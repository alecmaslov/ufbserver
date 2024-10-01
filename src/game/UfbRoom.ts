import { Jwt } from "#auth";
import { DEV_MODE } from "#config";
import db from "#db";
import { Pathfinder } from "#game/Pathfinder";
import { RoomCache } from "#game/RoomCache";
import { addItemToCharacter, addPowerToCharacter, addStackToCharacter, fillPathWithCoords, getArrowBombCount, getCharacterIdsInArea, getDiceCount, GetMonsterDeadCount, GetNearestPlayerId, GetNearestTileId, GetObstacleTileIds, getPerkEffectDamage, getPowerMoveFromId, initializeSpawnEntities, IsBlueMonster, IsEnemyAdjacent, IsGreenMonster, IsYellowMonster, setCharacterHealth, spawnCharacter, spawnMonster } from "#game/helpers/map-helpers";
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
import { SpawnZone, SpawnZoneType, TileType } from "@prisma/client";
import { readFile } from "fs/promises";
import { join as pathJoin } from "path";
import { Dispatcher } from "@colyseus/command";
import { UfbRoomOptions } from "./types/room-types";
import { DICE_TYPE, EDGE_TYPE, END_TYPE, ITEMDETAIL, ITEMTYPE, MONSTER_TYPE, MONSTERS, PERKTYPE, powers, stacks, STACKTYPE, TURN_TIME, USER_TYPE } from "#assets/resources";
import { CharacterState, Item } from "./schema/CharacterState";
import { getCharacterById, getItemIdsByLevel, getPowerIdsByLevel } from "./helpers/room-helpers";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { CharacterMovedMessage } from "./message-types";
import { PathStep } from "#shared-types";
import { PowerMoveCommand } from "./commands/PowerMoveCommand";

const DEFAULT_SPAWN_ENTITY_CONFIG: SpawnEntityConfig = {
    chests: 16,
    merchants: 4,
    portals: 2,
    monsters: 4,
};

export class UfbRoom extends Room<UfbRoomState> {
    dispatcher = new Dispatcher(this);

    maxClients = 10;
    sessionIdToPlayerId = new Map<string, string>();
    pathfinder: Pathfinder = new Pathfinder();

    isMonsterActive: boolean = true;
    aiInterval: any;

    spawnZoneArray: SpawnZone[];

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
        this.broadcast("notification", {
            type: notificationType,
            message,
        });
    }

    async onJoin(client: Client, options: UfbRoomOptions) {
        let playerId = options.joinOptions.playerId ?? "";
        console.log("onJoin options", options);
        if (isNullOrEmpty(playerId)) {
            playerId = createId();
            this.broadcast("generatedPlayerId", {
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
        this.StopAIChecking();
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
        const currentCharacter = this.state.characters.get(this.state.currentCharacterId);

        // CHECK DEAD
        if(currentCharacter.stats.health.current == 0) {
            // CHECK USER WIN???--here?
            this.incrementTurn();
        }

        this.state.turn++;

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

        this.spawnZoneArray = spawnZones;

        this.state.map.spawnEntities = initializeSpawnEntities(
            spawnZones,
            DEFAULT_SPAWN_ENTITY_CONFIG,
            async (spawnZone, type) => {
                // Spawn monsters
                const tile = await db.tile.findUnique({
                    where: { id: spawnZone.tileId },
                });
                try {

                    const monster = spawnMonster(
                        this.state.characters,
                        "foobarbaz",
                        tile.id,
                        tile.x,
                        tile.y,
                        MONSTERS[type].characterClass,
                        USER_TYPE.MONSTER,
                        type
                    );

                    // const monster = spawnCharacter(
                    //     this.state.characters,
                    //     "foobarbaz",
                    //     tile,
                    //     MONSTERS[type].characterClass,
                    //     "",
                    //     "",
                    //     "",
                    //     USER_TYPE.MONSTER,
                    //     type
                    // );

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

        if(selectedMonster == null || selectedMonster.type == USER_TYPE.USER || !this.isMonsterActive) {
            return;
        }

        console.log("AI CHECKING..kkk")

        // AI MONSTER ITEM
        let isItemUse = false;
        selectedMonster.items.forEach(p => {
            if(p.id == ITEMTYPE.POTION && p.count > 0) {
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
            return;
        }

        // AI MONSTER MOVEMENT LOGIC

        const nearCharcterId = GetNearestPlayerId(selectedMonster.currentTileId, this);
        let nearTileId = GetNearestTileId(selectedMonster.currentTileId, this);
        const obstacleTileIds = GetObstacleTileIds(selectedMonster.currentTileId, this);
        console.log("near tile id: ", nearTileId)
        
        let isAjuacent = false;

        if(nearCharcterId != "") {
            const enemy = this.state.characters.get(nearCharcterId);
            isAjuacent = IsEnemyAdjacent(selectedMonster, enemy, this);
            nearTileId = enemy.currentTileId;
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
                    selectedMonster.coordinates.x = destinationTile.coordinates.x;
                    selectedMonster.coordinates.y = destinationTile.coordinates.y;
                    selectedMonster.currentTileId = destinationTile.id;
    
                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.CHARACTER_MOVED, characterMovedMessage);
        
                    this.sendBroadcastStats(-Math.min(monsterPath.length, energy));

                }
            }
        }


        // AI MONSTER ATTACK
        if(this.isMonsterActive && isAjuacent) {
            // PUNCH
            const {mana, melee} = getArrowBombCount(selectedMonster);
            console.log("mana, melee: ", mana, melee);
            console.log("ATTCK PUNCH: ", selectedMonster.stats.energy.current);
            if(selectedMonster.stats.energy.current > 2) {
                const enemy = this.state.characters.get(nearCharcterId);
                if(mana > 0) {
                    this.isMonsterActive = false;
                    this.AIPunchAttack(selectedMonster, enemy, -100);
                } else if(melee > 0) {
                    this.isMonsterActive = false;
                    this.AIPunchAttack(selectedMonster, enemy, -1);
                }
            }
        }

        // AI MONSTER TURN
        if(this.isMonsterActive) {
            setTimeout(this.incrementTurn.bind(this), 3000);
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

    AIPunchAttack (ai: CharacterState, target : CharacterState, id: number ) {
        // SELECT ARROW? OR BOMB? -100: melee, 
        const pm = getPowerMoveFromId(id);

        this.broadcast(SERVER_TO_CLIENT_MESSAGE.DEFENCE_ATTACK, {
            pm: pm,
            originId: ai.id,
            targetId: target.id
        });
        console.log("AIPunch attack-------")
        setTimeout(this.AISetDiceRoll.bind(this, ai, target, {powerMoveId: id, extraItemId: -1, diceTimes: 1}), 2000);
    }

    AISetDiceRoll( ai: CharacterState,  target : CharacterState, message: any ) {
        
        const powermove = getPowerMoveFromId(message.powerMoveId, message.extraItemId);

        if(powermove == null) {
            return;
        }
        const setDiceRollMessage: any = {
            diceData : []
        }
        if(!!powermove.result.dice && message.diceTimes == 1) {

            if(powermove.result.dice == DICE_TYPE.DICE_4 || powermove.result.dice == DICE_TYPE.DICE_6) {
                setDiceRollMessage.diceData.push({
                    type: powermove.result.dice,
                    diceCount: getDiceCount(Math.random(), powermove.result.dice)
                })
            } else if(powermove.result.dice == DICE_TYPE.DICE_6_4) {
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_6,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                })
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_4,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                })
            } else if(powermove.result.dice == DICE_TYPE.DICE_6_6) {
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_6,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                })
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_6,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                })
            }

        }
        
        if(!!powermove.result.perkId && powermove.result.perkId == PERKTYPE.Vampire) {
            setDiceRollMessage.diceData.push({
                type: DICE_TYPE.DICE_6,
                diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
            })
            setDiceRollMessage.diceData.push({
                type: DICE_TYPE.DICE_4,
                diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
            })
        }

        this.broadcast( SERVER_TO_CLIENT_MESSAGE.SET_DICE_ROLL, setDiceRollMessage);
        message.diceRoll = setDiceRollMessage;
        setTimeout(this.AISendDamage.bind(this, ai, target, message), 3000)
        console.log("AISetDiceRoll attack-------")
    }

    AISendDamage(ai: CharacterState,  _target : CharacterState, message: any) {
        const diceRoll = message.diceRoll;
        let diceCount = 0;
        let vampireCount = 0; // set vampire
        diceRoll.diceData.forEach((roll : any) => {
            diceCount += roll.diceCount;
        });
        
        message = {
            enemyId : _target.id,
            characterId : ai.id,
            diceCount : diceCount,
            vampireCount : vampireCount,
            ...message
        }

        const character = ai;
        const enemy = _target;

        const powerMoveId = message.powerMoveId;

        let powermove = getPowerMoveFromId(powerMoveId, message.extraItemId);
        console.log("AISendDamage: ", message);
        let isResult = true;

        if(powermove["coin"] > 0) {
            isResult = character.stats.coin >= powermove.coin;
        }
        if(powermove["light"] > 0 && isResult) {
            isResult = character.stats.energy.current >= powermove.light;
        }
        if(powermove["costList"].length > 0 && isResult) {
            powermove.costList.forEach((item : any) => {
                if(isResult) {
                    const idx = character.items.findIndex(ii => ii.id == item.id);
                    if(idx > -1) {
                        isResult = character.items[idx].count >= item.count;
                        if(!isResult) return;
                    } else {
                        isResult = false;
                        return;
                    }
                }
            });
        }
        console.log("check isResult : ", isResult, powermove);
        if(!isResult) {
            this.notify(null, "Your item is not enough!", "error");
            this.broadcast(SERVER_TO_CLIENT_MESSAGE.AI_END_ATTACK, {
                characterId: character.id,
            })
            this.DoActionMonster();
            return;
        }
        // REDUCE COST PART
        Object.keys(powermove).forEach(key => {
            if(key == "range") {

            } else if(key == "light") {
                character.stats.energy.add(-powermove.light);
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: -powermove.light,
                    type: "energy",
                });
            } else if(key == "coin") {
                character.stats.coin -= powermove.coin;
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: -powermove.coin,
                    type: "coin",
                });
            } else if(key == "costList") {
                powermove.costList.forEach((item: any) => {
                    const idx = character.items.findIndex(ii => ii.id == item.id);
                    character.items[idx].count -= item.count;

                    if(item.id == ITEMTYPE.MELEE) {
                        this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: -item.count,
                            type: "melee",
                        });
                    } else if(item.id == ITEMTYPE.MANA) {
                        this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: -item.count,
                            type: "mana",
                        });
                    }
                });
            }
        });

        console.log("------ check cost ppart======")

        // END ATTACK?
        let isEndAttack = true;

        // ADD RESOULT PART -- IMPORTANT
        let target : CharacterState;
        if(powermove.range == 0) {
            target = character;
        } else {
            target = enemy;
        }

        if(target == null) return;

        Object.keys(powermove.result).forEach(key => {
            if(key == "health") {
                setCharacterHealth(target, powermove.result.health, this, null, "heart");

                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.health,
                    type: target == character? "heart" : "heart_e",
                });
            } else if(key == "energy") {
                target.stats.energy.add(powermove.result.energy);
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.energy,
                    type: target == character? "energy" : "energy_e",
                });
            } else if(key == "coin") {
                target.stats.coin += powermove.result.coin;
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.coin,
                    type: "coin",
                });
            } else if(key == "ultimate") {
                target.stats.ultimate.add(powermove.result.ultimate);
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.ultimate,
                    type: target == character? "ultimate" : "ultimate_e",
                });
            } else if((key == "perkId" || key == "perkId1") && target == enemy) {

                if(powermove.result[key] == PERKTYPE.AreaOfEffect) {
                    const enemyIds = getCharacterIdsInArea(character, powermove.range, this);
                    enemyIds.forEach((id: string) => {
                        setCharacterHealth(this.state.characters.get(id), -1, this, null, "heart");
                    })

                } else {

                    if(!!enemy.stacks[STACKTYPE.Steady] && enemy.stacks[STACKTYPE.Steady].count > 0) {
                        // REMOVE PERK EFFECT BY STEADY STACK
                        console.log("ACTIVE STEADY STACK....", character.id);
                        this.broadcast( SERVER_TO_CLIENT_MESSAGE.RECEIVE_STACK_PERK_TOAST, {
                            characterId : character.id,
                            stackId : STACKTYPE.Steady,
                            perkId : powermove.result[key],
                            count : enemy.stacks[STACKTYPE.Steady].count,
                        });

                        enemy.stacks[STACKTYPE.Steady].count--;

                    } else {
                        const result = getPerkEffectDamage(character, enemy, this, powermove.result[key]);
                        console.log(result);
                        if(result.desTileId == "") {
                            setCharacterHealth(target, -1, this, null, "heart");

                            this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                score: -1,
                                type: "heart_e",
                            });
                        } else {
                            let isEmptyTile = true;
                            this.state.characters.forEach(ct => {
                                if(!isEmptyTile) return; 
                                if(ct.currentTileId == result.desTileId) {
                                    isEmptyTile = false;
                                    return
                                }
                            })
                            if(result.wallType == EDGE_TYPE.BASIC) {
        
                                if(isEmptyTile) {
                                    // CHANGE POSITION
        
                                    target.coordinates.x = result.desCoodinate.x;
                                    target.coordinates.y = result.desCoodinate.y;
                                    target.currentTileId = result.desTileId;
        
                                    const path: PathStep[] = [{
                                        tileId: result.desTileId
                                    }];
        
                                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                        characterId : target.id,
                                        path
                                    });
    
                                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                        characterId : target.id,
                                        perkId: powermove.result[key],
                                        tileId: result.desTileId
                                    });
        
                                } else {
                                    setCharacterHealth(target, -1, this, null, "heart");
        
                                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                        score: -1,
                                        type: "heart_e",
                                    });
                                }
        
                            } else if(result.wallType == EDGE_TYPE.WALL || result.wallType == EDGE_TYPE.BRIDGE || result.wallType == EDGE_TYPE.STAIR) {
                                setCharacterHealth(target, -1, this, null, "heart");
        
                                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                    score: -1,
                                    type: "heart_e",
                                });
                            } else if(result.wallType == EDGE_TYPE.RAVINE) {
                                addStackToCharacter(STACKTYPE.Slow, 1, target, null, this);
        
                                // CHANGE POSITION
                                if(isEmptyTile) {
                                    target.coordinates.x = result.desCoodinate.x;
                                    target.coordinates.y = result.desCoodinate.y;
                                    target.currentTileId = result.desTileId;
        
                                    const path: PathStep[] = [{
                                        tileId: result.desTileId
                                    }];
                                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                        characterId : target.id,
                                        path
                                    });
    
                                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                        characterId : target.id,
                                        perkId: powermove.result[key],
                                        tileId: result.desTileId
                                    });
                                }
        
                            } else if(result.wallType == EDGE_TYPE.CLIFF) {
        
                                setCharacterHealth(target, -1, this, null, "heart");

                                // CHANGE POSITION
                                if(isEmptyTile) {
                                    target.coordinates.x = result.desCoodinate.x;
                                    target.coordinates.y = result.desCoodinate.y;
                                    target.currentTileId = result.desTileId;
        
                                    const path: PathStep[] = [{
                                        tileId: result.desTileId
                                    }];
                                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                        characterId : target.id,
                                        path
                                    });
    
                                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                        characterId : target.id,
                                        perkId: powermove.result[key],
                                        tileId: result.desTileId
                                    });
                                }
        
                            } else if(result.wallType == EDGE_TYPE.VOID) {
                                setCharacterHealth(target, -2, this, null, "heart");
                                addStackToCharacter(STACKTYPE.Void, 1, target, null, this);
                                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                    score: -2,
                                    type: "heart_e",
                                });
                            }
                        }
                    }
                }

            } else if(key == "items") {
                let ctn = 0;
                powermove.result.items.forEach((item : any) => {
                    const id = item.id;

                    if(target == enemy && !!enemy.stacks[STACKTYPE.Dodge] && enemy.stacks[STACKTYPE.Dodge].count > 0) {
                        enemy.stacks[STACKTYPE.Dodge].count--;

                        // DODGE STACK ... remove Item effect
                        this.broadcast( SERVER_TO_CLIENT_MESSAGE.RECEIVE_STACK_ITEM_TOAST, {
                            characterId : character.id,
                            stack1 : id,
                            stack2 : STACKTYPE.Dodge,
                            count1 : item.count,
                            count2 : enemy.stacks[STACKTYPE.Dodge].count
                        });

                    } else {
                        addItemToCharacter(item.id, item.count, target);
                    }


                    ctn += item.count;
                    
                    if(id == ITEMTYPE.MELEE) {
                        this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: item.count,
                            type: "melee",
                        });
                    } else if(id == ITEMTYPE.MANA) {
                        this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: item.count,
                            type: "mana",
                        });
                    }
                })
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: ctn,
                    type: "item",
                });
            } else if(key == "stacks") {
                let ctn = 0;
                powermove.result.stacks.forEach((stack : any) => {
                    if(target == enemy && !!enemy.stacks[STACKTYPE.Reflect] && enemy.stacks[STACKTYPE.Reflect].count > stack.count) {
                        enemy.stacks[STACKTYPE.Reflect].count -= stack.count;

                        this.broadcast( SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                            characterId : character.id,
                            stack1 : stack.id,
                            stack2 : STACKTYPE.Reflect,
                            count1 : stack.count,
                            count2 : enemy.stacks[STACKTYPE.Reflect].count
                        });

                    } else {
                        console.log("add charcter stack....", stack.id)

                        addStackToCharacter(stack.id, stack.count, target, null, this);
                    }
                    ctn += stack.count;
                })
                console.log("use stack....")
                if(ctn > 0) {
                    this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                        score: ctn,
                        type: "stack",
                    });
                }
            } else if(key == "dice") {
                if(target == enemy) {
                    if(!!enemy.stacks[STACKTYPE.Block] && enemy.stacks[STACKTYPE.Block].count > 0) {
                        enemy.stacks[STACKTYPE.Block].count--;

                        const msg = {
                            enemyId: enemy.id,
                            characterId: character.id,
                            powerMoveId: message.powerMoveId,
                            stackId: STACKTYPE.Block,
                            diceCount: message.diceCount,
                            enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4),
                            extraItemId: message.extraItemId
                        }
                        this.broadcast(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, msg);
                        setTimeout(this.AIEndDiceRoll.bind(this, msg), 4000);
                        isEndAttack = false;

                    } else {
                        setCharacterHealth(enemy, -message.diceCount, this, null, "heart");

                        this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: -message.diceCount,
                            type: "heart_e",
                        });

                        if(!!enemy.stacks[STACKTYPE.Revenge] && enemy.stacks[STACKTYPE.Revenge].count > 0 && IsEnemyAdjacent(character, enemy, this)) {
                            const msg = {
                                enemyId: enemy.id,
                                characterId: character.id,
                                powerMoveId: message.powerMoveId,
                                stackId: STACKTYPE.Revenge,
                                diceCount: 0,
                                enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4),
                                extraItemId: message.extraItemId
                            }
                            this.broadcast(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, msg);
                            setTimeout(this.AIEndDiceRoll.bind(this, msg), 4000);
                            isEndAttack = false;
                        }
                    }
                }
            }
        });

        if(message.vampireCount > 0) {
            setCharacterHealth(character, message.vampireCount, this, null, "heart");
            
            this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: message.vampireCount,
                type: "heart",
            });
        }

        if(isEndAttack) {
            setTimeout(() => {
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.AI_END_ATTACK, {characterId: character.id})
            }, 2000);
            this.DoActionMonster();
        }
    }

    AIEndDiceRoll (message: any) {
        const {enemyId, characterId, powerMoveId, diceCount, enemyDiceCount, extraItemId} = message;

        const enemy = getCharacterById(this, enemyId);
        const character = getCharacterById(this, characterId);
        const pm = getPowerMoveFromId(powerMoveId, extraItemId);
        const health = !!pm.result.health? pm.result.health : 0;

        let deltaCount = diceCount - health - enemyDiceCount;

        let isEnd = true;
        // REVENGE STACK ACTIVE
        if(!!enemy.stacks[STACKTYPE.Revenge] && enemy.stacks[STACKTYPE.Revenge].count > 0 && IsEnemyAdjacent(character, enemy, this)) {
            if(message.stackId == STACKTYPE.Revenge) {
                enemy.stacks[STACKTYPE.Revenge].count--;
                setCharacterHealth(character, -enemyDiceCount, this, null, "heart");

                enemy.stats.ultimate.add(enemyDiceCount);

                deltaCount += enemyDiceCount;
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: -enemyDiceCount,
                    type: "heart",
                });
            } else {
                const msg = {
                    enemyId: enemy.id,
                    characterId: character.id,
                    powerMoveId: powerMoveId,
                    stackId: STACKTYPE.Revenge,
                    diceCount: 0,
                    enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4),
                    extraItemId: pm.extraItemId
                }
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, msg);
                setTimeout(this.AIEndDiceRoll.bind(this, msg), 4000);
                isEnd = false;
            }

        }

        console.log("ai - reduce health", deltaCount, diceCount, health, enemyDiceCount);

        if(deltaCount > 0) {
            setCharacterHealth(enemy, -deltaCount, this, null, "heart");
            enemy.stats.ultimate.add(deltaCount);

            this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -deltaCount,
                type: "heart_e",
            });
            if(pm != null && !!pm.result.stacks && pm.result.stacks.length > 0){
                this.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: 1,
                    type: "stack_e",
                });
            }
        }

        if(isEnd) {
            this.broadcast(SERVER_TO_CLIENT_MESSAGE.AI_END_ATTACK, {
                characterId: character.id,
            })
            this.DoActionMonster();
        }
    }

    RespawnMonster() {
        const {blue, green, yellow, blueLive, greenLive, yellowLive} = GetMonsterDeadCount(this);
        const monsterZones = this.spawnZoneArray.filter(zone => zone.type == SpawnZoneType.Monster).sort(() => Math.random() - 0.5);
        console.log("monster zone:   ", monsterZones.length)
        if(blue == 4 && greenLive == 0 && green == 0) {
            // CREATE GREEN MONSTERS
            const mTypes = [
                MONSTER_TYPE.WASP_GREEN,
                MONSTER_TYPE.EARWIG_GREEN,
                MONSTER_TYPE.SPIDER_GREEN,
                MONSTER_TYPE.CENTIPEDE_GREEN,
            ];
            mTypes.forEach((_type, i) => {
                this.CreateMonster(_type, monsterZones[i]);
            })
        } else if(blue == 4 && green == 4 && yellow == 0 && yellowLive == 0) {
            // CREATE YELLOW MONSTERS
            const mTypes = [
                MONSTER_TYPE.WASP_YELLOW,
                MONSTER_TYPE.EARWIG_YELLOW,
                MONSTER_TYPE.SPIDER_YELLOW,
                MONSTER_TYPE.CENTIPEDE_YELLOW,
            ];
            mTypes.forEach((_type, i) => {
                this.CreateMonster(_type, monsterZones[i]);
            })
        } else if(blue == 4 && green == 4 && yellow == 4) {
            // WIN PLAYER (in solo mode) // check solo mode
            let characterId = "";
            this.state.characters.forEach(character => {
                if(character.type == USER_TYPE.USER && character.stats.health.current > 0) {
                    characterId = character.id;
                }
            });

            this.broadcast(SERVER_TO_CLIENT_MESSAGE.GAME_END_STATUS, {
                characterId,
                endType: END_TYPE.VICTORY
            });
            this.StopAIChecking();
        }

    }

    CreateMonster(type: number, monsterZone: SpawnZone) {

        const tile: TileState = this.state.map.tiles.get(monsterZone.tileId);
        
        const monster = spawnMonster(
            this.state.characters,
            "foobarbaz",
            tile.id,
            tile.coordinates.x,
            tile.coordinates.y,
            MONSTERS[type].characterClass,
            USER_TYPE.MONSTER,
            type
        );

        // TEST:::
        Object.keys(STACKTYPE).forEach(key => {
            const testStack : Item = monster.stacks.find(stack => stack.id == STACKTYPE[key]);
            if(testStack == null && STACKTYPE[key] < STACKTYPE.Dodge2) {
                const newStack = new Item();
                newStack.id = STACKTYPE[key];
                newStack.count = 1;
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

            const idxItem = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
            const idxPower = Math.ceil(Math.random() * lvl1Powers.length) % lvl1Powers.length;

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

            let idxItem = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
            let idxPower = Math.ceil(Math.random() * lvl1Powers.length) % lvl1Powers.length;
            console.log("add lvlitem: ", idxItem, lvl1Items[idxItem])
            addItemToCharacter(lvl1Items[idxItem].id, 1, monster);
            addPowerToCharacter(lvl1Powers[idxPower].id, 1, monster);

            const lvl2Items = getItemIdsByLevel(2, true);
            const lvl2Powers = getPowerIdsByLevel(2, true);

            idxItem = Math.ceil(Math.random() * lvl2Items.length) % lvl2Items.length;
            idxPower = Math.ceil(Math.random() * lvl2Powers.length) % lvl2Powers.length;

            console.log("add lvlitem: ", idxItem, lvl2Items[idxItem])
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
                const idx1 = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
                const idx2 = Math.ceil(Math.random() * lvl2Items.length) % lvl2Items.length;
                addItemToCharacter(lvl1Items[idx1].id, 1, monster);
                addItemToCharacter(lvl2Items[idx2].id, 1, monster);
            }

            for(let i = 0; i < 3; i++) {
                const idx = Math.ceil(Math.random() * lvl2Powers.length) % lvl2Powers.length;
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

    }

    RewardFromMonster(character: CharacterState, monster: CharacterState, client: Client) {

        let rewardMsg: any = {
            characterId : character.id,
            coin: monster.stats.coin,
            items: [],
            stacks: [],
            powers: []
        }

        if(IsBlueMonster(monster.characterClass)) {
            // CHECK MONSTER's INVENTORY
            const {items, powers} = this.GetInventoryFromEnemy(character, monster);
            rewardMsg.items = items;
            rewardMsg.powers = powers;

            // REWARD PART
            const id = Math.random() < 0.5? ITEMTYPE.MELEE : ITEMTYPE.MANA;
            addItemToCharacter(id, 1, character);
            const lvl1Items = getItemIdsByLevel(1, true);
            const idxItem = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
            addItemToCharacter(lvl1Items[idxItem].id, 1, character);

            rewardMsg.items.push({
                id: id,
                count: 1
            })
            rewardMsg.items.push({
                id: lvl1Items[idxItem].id,
                count: 1
            })

        } else if(IsGreenMonster(monster.characterClass)) {
            // CHECK MONSTER's INVENTORY
            const {items, powers} = this.GetInventoryFromEnemy(character, monster);
            rewardMsg.items = items;
            rewardMsg.powers = powers;

            // REWARD PART
            const id = Math.random() < 0.5? ITEMTYPE.MELEE : ITEMTYPE.MANA;
            addItemToCharacter(id, 2, character);
            const lvl1Items = getItemIdsByLevel(1, true);
            const lvl2Items = getItemIdsByLevel(2, true);
            const idxItem = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
            const idxItem1 = Math.ceil(Math.random() * lvl2Items.length) % lvl2Items.length;
            addItemToCharacter(lvl1Items[idxItem].id, 1, character);
            addItemToCharacter(lvl2Items[idxItem1].id, 1, character);

            // ADD GOOD STACK need to develop...
            addStackToCharacter(STACKTYPE.Cure, 1, character, client, this);
            if(Math.random() > 0.5) {
                character.stats.arrowLimit++;
            } else {
                character.stats.bombLimit++;
            }

        } else if(IsYellowMonster(monster.characterClass)) {
            // CHECK MONSTER's INVENTORY
            const {items, powers} = this.GetInventoryFromEnemy(character, monster);
            rewardMsg.items = items;
            rewardMsg.powers = powers;

            // REWARD PART
            const id = Math.random() < 0.5? ITEMTYPE.MELEE : ITEMTYPE.MANA;
            addItemToCharacter(id, 3, character);
            const lvl1Items = getItemIdsByLevel(1, true);
            const lvl2Items = getItemIdsByLevel(2, true);
            const idxItem = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
            const idxItem1 = Math.ceil(Math.random() * lvl2Items.length) % lvl2Items.length;
            addItemToCharacter(lvl1Items[idxItem].id, 1, character);
            addItemToCharacter(lvl2Items[idxItem1].id, 1, character);

            // ADD GOOD STACK ....
            addStackToCharacter(STACKTYPE.Cure, 2, character, client, this);
            if(Math.random() > 0.5) {
                character.stats.arrowLimit += 2;
            } else {
                character.stats.bombLimit += 2;
            }
        }

        if(client != null) {
            console.log("Reward message: ", rewardMsg);
            client.send(SERVER_TO_CLIENT_MESSAGE.REWARD_BONUS, rewardMsg);
        }
    }

    GetInventoryFromEnemy(character: CharacterState, enemy: CharacterState) {
        character.stats.coin += enemy.stats.coin;
        let addItems: any = [];
        let addPowers: any = [];
        enemy.items.forEach(item => {
            if(item.count > 0) {
                addItemToCharacter(item.id, item.count, character);
                addItems.push({
                    id: item.id,
                    count: item.count
                })
            }
        })

        enemy.powers.forEach(p => {
            if(p.count > 0) {
                addPowerToCharacter(p.id, p.count, character);
                addPowers.push({
                    id: p.id,
                    count: p.count
                })
            }
        });

        return {items: addItems, powers: addPowers};
    }

    StopAIChecking() {
        clearInterval(this.aiInterval);
    }
}
