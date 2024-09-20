import { Jwt } from "#auth";
import { DEV_MODE } from "#config";
import db from "#db";
import { Pathfinder } from "#game/Pathfinder";
import { RoomCache } from "#game/RoomCache";
import { addItemToCharacter, addPowerToCharacter, addStackToCharacter, fillPathWithCoords, getArrowBombCount, getDiceCount, GetNearestPlayerId, GetNearestTileId, GetObstacleTileIds, initializeSpawnEntities, IsEnemyAdjacent, spawnCharacter } from "#game/helpers/map-helpers";
import { registerMessageHandlers } from "#game/message-handlers";
import {
    AdjacencyListItemState,
    TileEdgeState,
    TileState,
} from "#game/schema/MapState";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { SpawnEntityConfig, UFBMap } from "#game/types/map-types";
import { isNullOrEmpty } from "#util";
import { Client, Room } from "@colyseus/core";
import { ArraySchema, MapSchema } from "@colyseus/schema";
import { createId } from "@paralleldrive/cuid2";
import { TileType } from "@prisma/client";
import { readFile } from "fs/promises";
import { join as pathJoin } from "path";
import { Dispatcher } from "@colyseus/command";
import { UfbRoomOptions } from "./types/room-types";
import { DICE_TYPE, ITEMDETAIL, ITEMTYPE, MONSTER_TYPE, MONSTERS, powers, stacks, STACKTYPE, TURN_TIME, USER_TYPE } from "#assets/resources";
import { Item } from "./schema/CharacterState";
import { getItemIdsByLevel, getPowerIdsByLevel } from "./helpers/room-helpers";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { CharacterMovedMessage } from "./message-types";
import { PathStep } from "#shared-types";

const DEFAULT_SPAWN_ENTITY_CONFIG: SpawnEntityConfig = {
    chests: 16,
    merchants: 4,
    portals: 2,
    monsters: 8,
};

export class UfbRoom extends Room<UfbRoomState> {
    dispatcher = new Dispatcher(this);

    maxClients = 10;
    sessionIdToPlayerId = new Map<string, string>();
    pathfinder: Pathfinder = new Pathfinder();

    isMonsterActive: boolean = true;
    aiInterval: any;

    async onCreate(options: UfbRoomOptions) {
        RoomCache.set(this.roomId, this);
        this.setState(new UfbRoomState());

        console.log("onCreate options", options.createOptions);
        try {
            await this.initMap(options.createOptions?.mapName ?? "kraken");
        } catch (err) {
            console.error(err);
        }
        registerMessageHandlers(this);
        console.log(`created room ${this.roomId}`);

        this.aiInterval = setInterval(() => {
            this.aiChecking();
        }, 3000);
    }

    notify(client: Client, message: string, notificationType: string = "info") {
        client.send("notification", {
            type: notificationType,
            message,
        });
    }

    async onJoin(client: Client, options: UfbRoomOptions) {
        let playerId = options.joinOptions.playerId ?? "";
        console.log("onJoin options", options);
        if (isNullOrEmpty(playerId)) {
            playerId = createId();
            client.send("generatedPlayerId", {
                playerId,
            });
        }
        this.sessionIdToPlayerId.set(client.sessionId, playerId);
        console.log(client.sessionId, "joined!");

        const tile = await db.tile.findFirst({
            where: {
                // x_y_mapId: {
                //     x: Math.floor(Math.random() * this.state.map.gridWidth),
                //     y: Math.floor(Math.random() * this.state.map.gridHeight),
                //     mapId: this.state.map.id,
                // },
                x: Math.floor(Math.random() * this.state.map.gridWidth),
                y: Math.floor(Math.random() * this.state.map.gridHeight),
                mapId: this.state.map.id,
            },
        });

        const character = spawnCharacter(
            this.state.characters,
            client.sessionId,
            tile,
            options.joinOptions.characterClass ?? "kirin",
            options.joinOptions.characterId,
            playerId,
            options.joinOptions.displayName
        );

        // @change
        this.state.turnOrder.push(character.id);

        const users = this.state.turnOrder.map(key => this.state.characters.get(key)).filter(p => p.type == USER_TYPE.USER);

        if (users.length === 1) {
            this.state.currentCharacterId = playerId;
            console.log("first player, setting current player id to", playerId);
        }
        this.notify(client, "Welcome to the game, " + playerId + "!");
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
        this.dispatcher.stop();
        clearInterval(this.aiInterval);
    }

    onAuth(client: Client, options: Record<string, any>) {
        if (DEV_MODE) {
            return true;
        }
        const token = options.token as string;
        if (isNullOrEmpty(token)) {
            console.log("auth failed: no token");
            return false;
        }
        try {
            Jwt.verify(token);
            return true;
        } catch (err) {
            console.log("auth failed: invalid token");
            return false;
        }
    }

    // custom state change actions
    incrementTurn() {
        const n = this.state.turnOrder.length;
        const nextPlayerIndex =
            (this.state.turnOrder.indexOf(this.state.currentCharacterId) + 1) %
            n;
        // could compute nextPlayerIndex from turn instead, but this works if turnOrder length changes
        this.state.currentCharacterId = this.state.turnOrder[nextPlayerIndex];
        this.state.turn++;

        const currentCharacter = this.state.characters.get(this.state.currentCharacterId);
        currentCharacter.stats.isRevive = false;
        currentCharacter.stats.energy.setToMax();
        
        const mana = currentCharacter.items.find(it => it.id == ITEMTYPE.MANA);
        const melee = currentCharacter.items.find(it => it.id == ITEMTYPE.MELEE);

        mana.count = currentCharacter.stats.maxMana;
        melee.count = currentCharacter.stats.maxMelee;

        console.log("turn orders:", this.state.turnOrder, n, this.state.currentCharacterId);

        this.broadcast(
            SERVER_TO_CLIENT_MESSAGE.TURN_CHANGED,
            { turn: this.state.turn, characterId: this.state.currentCharacterId, curTime : TURN_TIME },
            { afterNextPatch: true }
        );
    }

    resetTurn() {
        this.state.turn = 0;
        this.state.currentCharacterId = this.state.turnOrder[0] ?? "";
    }

    // @kyle - Implemented map loading from database
    // it should have the same exact functionality
    async initMap(mapName: string) {
        const map = await db.ufbMap.findFirst({
            where: {
                name: mapName,
            },
            include: {
                tiles: {
                    include: {
                        fromTileAdjacencies: true,
                    },
                },
            },
        });

        const spawnZones = await db.spawnZone.findMany({
            where: {
                tile: {
                    mapId: map.id,
                },
            },
        });

        this.state.map.spawnEntities = initializeSpawnEntities(
            spawnZones,
            DEFAULT_SPAWN_ENTITY_CONFIG,
            async (spawnZone, type) => {
                // Spawn monsters
                const tile = await db.tile.findUnique({
                    where: { id: spawnZone.tileId },
                });
                try {
                    const monster = spawnCharacter(
                        this.state.characters,
                        "foobarbaz",
                        tile,
                        MONSTERS[type].characterClass,
                        "",
                        "",
                        "",
                        USER_TYPE.MONSTER,
                        type
                    );

                    // TEST:::
                    Object.keys(STACKTYPE).forEach(key => {
                        const testStack : Item = monster.stacks.find(stack => stack.id == STACKTYPE[key]);
                        if(testStack == null && STACKTYPE[key] < STACKTYPE.Dodge2) {
                            const newStack = new Item();
                            newStack.id = STACKTYPE[key];
                            newStack.count = 5;
                            newStack.name = key;
                            newStack.description = stacks[STACKTYPE[key]].description;
                            newStack.level = stacks[STACKTYPE[key]].level;
                            newStack.cost = stacks[STACKTYPE[key]].cost;
                            newStack.sell = stacks[STACKTYPE[key]].sell;
                            monster.stacks.push(newStack);
                        }
                    });                    
                    // END TEST:::
                    console.log("init monster")
                    // AI MONSTER EQUIP all POWERS AND INIT ITEM...
                    if(MONSTERS[type].level == 1) {
                        const lvl1Items = getItemIdsByLevel(1, true);
                        const lvl1Powers = getPowerIdsByLevel(1, true);

                        const idxItem = Math.ceil(Math.random() * lvl1Items.length);
                        const idxPower = Math.ceil(Math.random() * lvl1Powers.length);

                        addItemToCharacter(lvl1Items[idxItem].id, 1, monster);
                        addPowerToCharacter(lvl1Powers[idxPower].id, 1, monster);
                        
                        monster.powers.forEach(p => {
                            monster.equipSlots.push(p);
                            p.count--;
                        });

                        monster.stats.coin = 3 + Math.ceil(Math.random() * 3);
                    } else if(MONSTERS[type].level == 2) {
                        const lvl1Items = getItemIdsByLevel(1, true);
                        const lvl1Powers = getPowerIdsByLevel(1, true);

                        let idxItem = Math.ceil(Math.random() * lvl1Items.length);
                        let idxPower = Math.ceil(Math.random() * lvl1Powers.length);

                        addItemToCharacter(lvl1Items[idxItem].id, 1, monster);
                        addPowerToCharacter(lvl1Powers[idxPower].id, 1, monster);

                        const lvl2Items = getItemIdsByLevel(2, true);
                        const lvl2Powers = getPowerIdsByLevel(2, true);

                        idxItem = Math.ceil(Math.random() * lvl2Items.length);
                        idxPower = Math.ceil(Math.random() * lvl2Powers.length);

                        addItemToCharacter(lvl2Items[idxItem].id, 1, monster);
                        addPowerToCharacter(lvl2Powers[idxPower].id, 1, monster);

                        monster.powers.forEach(p => {
                            monster.equipSlots.push(p);
                            p.count--;
                        });

                        monster.stats.coin = 8 + Math.ceil(Math.random() * 5);

                    } else if(MONSTERS[type].level == 3) {

                        const lvl1Items = getItemIdsByLevel(1, true);
                        const lvl2Items = getItemIdsByLevel(2, true);
                        const lvl2Powers = getPowerIdsByLevel(2, true);

                        for(let i = 0; i < 2; i++) {
                            const idx1 = Math.ceil(Math.random() * lvl1Items.length);
                            const idx2 = Math.ceil(Math.random() * lvl2Items.length);
                            addItemToCharacter(lvl1Items[idx1].id, 1, monster);
                            addItemToCharacter(lvl2Items[idx2].id, 1, monster);
                        }

                        for(let i = 0; i < 3; i++) {
                            const idx = Math.ceil(Math.random() * lvl2Powers.length);
                            addPowerToCharacter(lvl2Powers[idx].id, 1, monster);
                        }

                        monster.powers.forEach(p => {
                            monster.equipSlots.push(p);
                            p.count--;
                        });

                        monster.stats.coin = 15 + Math.ceil(Math.random() * 6);
                    }

                    console.log("init end monster")

                    // END EQUIP ALL ITEM, POWERS

                    // SET MONSTER PROPERTY
                    monster.stats.health.setMaxValue(MONSTERS[type].property.heart);
                    monster.stats.health.setToMax();
                    monster.stats.energy.setMaxValue(MONSTERS[type].property.energy);
                    monster.stats.energy.setToMax();

                    addItemToCharacter(ITEMTYPE.MELEE, MONSTERS[type].property.melee, monster);
                    addItemToCharacter(ITEMTYPE.MANA, MONSTERS[type].property.mana, monster);
                    // END MONSTER PROPERTY

                    this.state.turnOrder.push(monster.id);
                } catch {
                    console.error(
                        `Tried to spawn monster at ${tile.id} but failed. | ${tile.x}, ${tile.y}`
                    );
                }
            }
        );

        this.state.map.id = map.id;
        this.state.map.name = map.name;
        this.state.map.resourceAddress = map.resourceAddress;
        this.state.map.gridWidth = map.gridWidth;
        this.state.map.gridHeight = map.gridHeight;
        this.state.map._map = map as any;

        this.state.map.adjacencyList = new MapSchema<AdjacencyListItemState>();

        for (const tile of map.tiles) {
            const tileState = new TileState();
            tileState.id = tile.id;
            tileState.type = tile.type as TileType;

            // if(tile.type != TileType.OpenTile) {
            //     console.log(`Tile Type: ${tile.type} Tile index: ${tile.id}, TilePosX : ${tile.x}, Tile Y: ${tile.y}`)
            // }

            tileState.coordinates.x = tile.x;
            tileState.coordinates.y = tile.y;
            tileState.tileCode = tile.tileCode;
            // walls can be null
            const walls = new ArraySchema<number>();
            if (tile.walls) {
                for (const wall of tile.walls as number[]) {
                    walls.push(wall);
                }
            }

            tileState.walls = walls;

            this.state.map.tiles.set(tile.id, tileState);

            // const adjacencyListItem = new AdjacencyListItemState();
            // adjacencyListItem.edges = new ArraySchema<TileEdgeState>();

            // for (const edge of tile.fromTileAdjacencies) {
            //     const edgeState = new TileEdgeState();
            //     edgeState.from = edge.fromId;
            //     edgeState.to = edge.toId;
            //     edgeState.type = edge.type as any;
            //     edgeState.energyCost = edge.energyCost;
            //     adjacencyListItem.edges.push(edgeState);
            // }

            // this.state.map.adjacencyList.set(tile.id, adjacencyListItem);
        }

        this.pathfinder = Pathfinder.fromMapState(this.state.map);

        this.broadcast("mapChanged", {}, { afterNextPatch: true });
        this.resetTurn();
    }

    // @amin - AI Monsters checking..
    aiChecking() {
        const selectedMonster = this.state.characters.get(this.state.currentCharacterId);
        console.log(!!selectedMonster, "checking AIIIII")

        if(selectedMonster == null || selectedMonster.type == USER_TYPE.USER || !this.isMonsterActive) {
            return;
        }

        console.log("AI CHECKING..kkk")

        // AI MONSTER ITEM
        let isItemUse = false;
        selectedMonster.items.forEach(p => {
            if(p.id == ITEMTYPE.POSITION && p.count > 0) {
                isItemUse = true
                selectedMonster.stats.health.add(5);
                this.sendBroadcastStats(5, 'heart');
                p.count--;
            } else if(p.id == ITEMTYPE.ELIXIR && p.count > 0) {
                isItemUse = true;
                selectedMonster.stats.energy.add(10);
                addStackToCharacter(STACKTYPE.Cure, 1, selectedMonster, null, this);
                addStackToCharacter(STACKTYPE.Dodge, 1, selectedMonster, null, this);
                p.count--;
            }
        })
        if(isItemUse) {
            this.DoActionMonster()
        }

        // AI MONSTER MOVEMENT LOGIC

        const nearCharcterId = GetNearestPlayerId(selectedMonster.currentTileId, this);
        const nearTileId = GetNearestTileId(selectedMonster.currentTileId, this);
        const obstacleTileIds = GetObstacleTileIds(selectedMonster.currentTileId, this);
        console.log("near tile id: ", nearTileId)
        
        let isAjuacent = false;

        if(nearCharcterId != "") {
            const enemy = this.state.characters.get(nearCharcterId);
            isAjuacent = IsEnemyAdjacent(selectedMonster, enemy, this);
        }

        if(nearTileId != "" && !isAjuacent) {
            const { path, cost } = this.pathfinder.find(
                selectedMonster.currentTileId,
                nearTileId
            );
            console.log("ai move : ", path);

            const energy = selectedMonster.stats.energy.current;
            if(energy > 0 && path.length > 1) {
                const pathArray = path.slice(0, Math.min(path.length, energy));
                let monsterPath: any = pathArray;
                for(let i = 0; i < pathArray.length; i++) {
                    const p = pathArray[i];
                    if(obstacleTileIds.indexOf(p.tileId) != -1) {
                        monsterPath = pathArray.slice(0, i);
                        break;
                    }
                }


                fillPathWithCoords(monsterPath, this.state.map);

                if(monsterPath.length > 1) {
                    const characterMovedMessage: CharacterMovedMessage = {
                        characterId: selectedMonster.id,
                        path: monsterPath,
                        left: -1,
                        right: -1,
                        top: -1,
                        down: -1,
                    };
    
                    selectedMonster.stats.energy.add(-Math.min(monsterPath.length, energy));
            
                    this.DoActionMonster()
                    const destinationTile = this.state.map.tiles.get(monsterPath[monsterPath.length - 1].tileId);
                    setTimeout(() => {
                        selectedMonster.coordinates.x = destinationTile.coordinates.x;
                        selectedMonster.coordinates.y = destinationTile.coordinates.y;
                        selectedMonster.currentTileId = destinationTile.id;
                    }, 4000)
    
                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.CHARACTER_MOVED, characterMovedMessage);
        
                    this.sendBroadcastStats(-Math.min(monsterPath.length, energy));

                }
            }
        }


        // AI MONSTER ATTACK
        if(this.isMonsterActive && isAjuacent) {
            // PUNCH
            const {mana, melee} = getArrowBombCount(selectedMonster);
            
            if(selectedMonster.stats.energy.current > 2) {
                const enemy = this.state.characters.get(nearCharcterId);
                if(mana > 0) {
                    this.DoActionMonster();                        
                    selectedMonster.items.forEach(p => {
                        if(p.id == ITEMTYPE.MANA) {
                            p.count--;
                        }
                    })
                    selectedMonster.stats.energy.add(-2);
                    this.sendBroadcastStats(-2);

                    // ATTACK 4 DICE ROLL
                    const damage = getDiceCount(Math.random(), DICE_TYPE.DICE_4);
                    enemy.stats.health.add(-damage);
                
                } else if(melee > 0) {
                    this.DoActionMonster();                        
                    selectedMonster.items.forEach(p => {
                        if(p.id == ITEMTYPE.MELEE) {
                            p.count--;
                        }
                    })
                    selectedMonster.stats.energy.add(-2);
                    this.sendBroadcastStats(-2);

                    // ATTACK 4 DICE ROLL
                    const damage = getDiceCount(Math.random(), DICE_TYPE.DICE_4);
                    enemy.stats.health.add(-damage);
                }
            }
        }

        // AI MONSTER TURN
        if(selectedMonster.stats.energy.current <= 1 || this.isMonsterActive) {
            this.incrementTurn();
        }

    }

    sendBroadcastStats(score : number, type: string = 'energy') {
        this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
            score: score,
            type: "energy"
        })
    }

    DoActionMonster(delay : number = 4) {
        this.isMonsterActive = false;
        setTimeout(() => {
            this.isMonsterActive = true;
        }, delay * 1000);
    }

}
