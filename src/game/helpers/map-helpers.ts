import { BAN_STACKS, DICE_TYPE, ITEMDETAIL, ITEMTYPE, MONSTERS, PERKTYPE, POWERCOSTS, powermoves, powers, POWERTYPE, stacks, STACKTYPE, USER_TYPE, WALL_DIRECT } from "#assets/resources";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { CharacterState, CoordinatesState, Item } from "#game/schema/CharacterState";
import { AdjacencyListItemState, MapState, SpawnEntity, TileState } from "#game/schema/MapState";
import { SpawnEntityConfig } from "#game/types/map-types";
import { UfbRoom } from "#game/UfbRoom";
import { Coordinates, PathStep } from "#shared-types";
import { shuffleArray } from "#utils/collections";
import { ArraySchema, MapSchema } from "@colyseus/schema";
import { createId } from "@paralleldrive/cuid2";
import { SpawnZone, SpawnZoneType, Tile } from "@prisma/client";
import { ok } from "assert";
import { Client } from "colyseus";
import { Node } from "ngraph.graph";

const TILE_LETTERS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
];

const entitiesRootAddress = "Entities/"

export const coordToGameId = (
    coordinates: CoordinatesState | Coordinates
): string => {
    return `tile_${TILE_LETTERS[coordinates.x]}_${coordinates.y + 1}`;
};

export const coordToTileId = (
    tiles: MapSchema<TileState>, 
    coordinates: CoordinatesState | Coordinates
): string => {
    let id = ""; 
    tiles.forEach(tile => {
        if(tile.coordinates.x == coordinates.x && tile.coordinates.y == coordinates.y) {
            id = tile.id;
        }
    })
    return id;
}

export const getTileIdByDirection = (
    tiles: MapSchema<TileState>,
    coordinates: CoordinatesState | Coordinates,
    direction: string
): string => {
    const coord = new CoordinatesState();
    coord.x = coordinates.x;
    coord.y = coordinates.y;
    if(direction == "left") {
        coord.x--;
    } else if(direction == "right") {
        coord.x++;
    } else if(direction == "top") {
        coord.y--;
    } else if(direction == "down") {
        coord.y++;
    }
    return coordToTileId(tiles, coord);
}

export const gameIdToCoord = (tileId: string): CoordinatesState => {
    const parts = tileId.split("_");
    const x = TILE_LETTERS.indexOf(parts[1]);
    const y = parseInt(parts[2]) - 1;
    const c = { x, y } as CoordinatesState;
    ok(coordToGameId(c) === tileId);
    return c;
};

export const getPathCost = (
    p: Node<any>[],
    adjacencyList: MapSchema<AdjacencyListItemState, string>
) => {
    let cost = 0;
    for (let i = 1; i < p.length; i++) {
        const from = p[i - 1].id as string;
        const to = p[i].id as string;
        const edgeCollection = adjacencyList.get(from);
        if (!edgeCollection) {
            throw new Error(`no adjacency list for ${from}`);
        }
        let edge: { energyCost: number } | undefined;
        for (const e of edgeCollection.edges) {
            if (e.to === to) {
                edge = e;
                break;
            }
        }
        // console.log(`edge from ${from} to ${to} is ${JSON.stringify(edge)}`);
        if (!edge) {
            throw new Error(`no edge from ${from} to ${to}`);
        }
        cost += edge.energyCost;
    }
    return cost;
};

////
export const getTileIdBridge = (
    p: Node<any>[],
    adjacencyList: MapSchema<AdjacencyListItemState, string>
) => {
    let cost = 0;
    for (let i = 1; i < p.length; i++) {
        const from = p[i - 1].id as string;
        const to = p[i].id as string;
        const edgeCollection = adjacencyList.get(from);
        if (!edgeCollection) {
            throw new Error(`no adjacency list for ${from}`);
        }
        let edge: { energyCost: number } | undefined;
        for (const e of edgeCollection.edges) {
            if (e.to === to) {
                edge = e;
                break;
            }
        }
        // console.log(`edge from ${from} to ${to} is ${JSON.stringify(edge)}`);
        if (!edge) {
            throw new Error(`no edge from ${from} to ${to}`);
        }
        cost += edge.energyCost;
    }
    return cost;
};

////
export const getTileIdStar = (
    p: Node<any>[],
    adjacencyList: MapSchema<AdjacencyListItemState, string>
) => {
    let cost = 0;
    for (let i = 1; i < p.length; i++) {
        const from = p[i - 1].id as string;
        const to = p[i].id as string;
        const edgeCollection = adjacencyList.get(from);
        if (!edgeCollection) {
            throw new Error(`no adjacency list for ${from}`);
        }
        let edge: { energyCost: number } | undefined;
        for (const e of edgeCollection.edges) {
            if (e.to === to) {
                edge = e;
                break;
            }
        }
        // console.log(`edge from ${from} to ${to} is ${JSON.stringify(edge)}`);
        if (!edge) {
            throw new Error(`no edge from ${from} to ${to}`);
        }
        cost += edge.energyCost;
    }
    return cost;
};

export const fillPathWithCoords = (
    pathSteps: PathStep[],
    mapState: MapState
) => {
    const allIds = pathSteps.map((step) => step.tileId);
    const allCoords = allIds.map((id) => mapState.tiles.get(id).coordinates);
    allCoords.forEach((coord, i) => {
        pathSteps[i].gameId = coordToGameId(coord);
        pathSteps[i].coord = coord;
    });
};

interface PortalEntityParameters {
    seedId: number;
    portalGroup: number;
    portalIndex: number;
}

interface MerchantEntityParameters {
    seedId: number;
    merchantIndex: number;
    merchantName: string;
    inventory: string[];
}


export function initializeSpawnEntities(
    spawnZones: SpawnZone[],
    config: SpawnEntityConfig,
    onMonsterSpawn: (spawnZone: SpawnZone, type : number) => void
) : ArraySchema<SpawnEntity> {
    const spawnEntities = new ArraySchema<SpawnEntity>();
    const seedIds = new Set(spawnZones.map((zone) => zone.seedId));
    const shuffledSeedIds = shuffleArray(Array.from(seedIds)) as number[];
    const takenIds = new Set<string>();

    const totalSpawnZones = spawnZones.length;
    console.log("total spawn zone count: ", totalSpawnZones);
    if (config.chests < config.monsters) {
        throw new Error("not enough chests for monsters");
    }
    if (
        totalSpawnZones <
        config.chests + config.portals * 2 + config.merchants
    ) {
        throw new Error("config provided has too many spawn zones for map");
    }

    console.log(shuffledSeedIds, config)

    let numMonsters = 0;

    // spawn 16 chests
    // for (let i = 0; i < config.chests - 1; i++) {
    //     const seedId = shuffledSeedIds.pop();

    //     const zones = spawnZones.filter((zone) => zone.seedId === seedId);
    //     console.log(zones, seedId)

    //     if (zones.length < 2) {
    //         throw new Error(
    //             `expected 2 chest zones for seed id ${seedId}, got ${zones.length}`
    //         );
    //     }
    //     if (!zones.find((zone) => zone.type === "Chest")) {
    //         throw new Error(`expected 1 chest zone for seed id ${seedId}`);
    //     }
    //     if (!zones.find((zone) => zone.type === "Monster")) {
    //         throw new Error(`expected 1 monster zone for seed id ${seedId}`);
    //     }
    //     const isItemBag = Math.random() < 0.5? true: false;
    //     const chestZone = zones.find((zone) => zone.type === "Chest");

    //     const chestEntity = new SpawnEntity();
    //     chestEntity.id = chestZone.id;
    //     chestEntity.gameId = `chest_${i}`;
    //     chestEntity.prefabAddress = isItemBag? `${entitiesRootAddress}ItemBag` : `${entitiesRootAddress}chest`;
    //     chestEntity.tileId = chestZone.tileId;
    //     chestEntity.type = "Chest";
    //     chestEntity.parameters = `{"seedId" : "${chestZone.seedId}"}`;
    //     spawnEntities.push(chestEntity);

    //     takenIds.add(chestZone.id);

    //     if (numMonsters < config.monsters) {
    //         const monsterZone = zones.find((zone) => zone.type === "Monster");
    //         onMonsterSpawn(monsterZone); // allow caller to figure out how to spawn a new monster (which is a character)
    //         takenIds.add(monsterZone.id);
    //         numMonsters++;
    //     }

    // }

    const zones = spawnZones.filter(zone => (zone.type == SpawnZoneType.Chest)).sort(() => Math.random() - 0.5);
    console.log("chestZone: ", zones.length)

    let n = 0;
    zones.forEach((zone, i) => {
        if(n < config.chests) {

            const isItemBag = Math.random() < 0.5? true: false;
            
            const chestEntity = new SpawnEntity();
            chestEntity.id = zone.id;
            chestEntity.gameId = `chest_${i}`;
            chestEntity.prefabAddress = isItemBag? `${entitiesRootAddress}ItemBag` : `${entitiesRootAddress}chest`;
            chestEntity.tileId = zone.tileId;
            chestEntity.type = "Chest";
            chestEntity.parameters = `{"seedId" : "${zone.seedId}"}`;
            spawnEntities.push(chestEntity);
        } else if(n < config.chests + config.merchants) {
            const parameters: MerchantEntityParameters = {
                seedId: zone.seedId,
                merchantIndex: i,
                merchantName: `Merchant ${i}`,
                inventory: [],
            };
            
            const merchantEntity = new SpawnEntity();
            merchantEntity.id = zone.id;
            merchantEntity.gameId = `merchant_${i}`;
            merchantEntity.prefabAddress = `${entitiesRootAddress}merchant`;
            merchantEntity.tileId = zone.tileId;
            merchantEntity.type = "Merchant";
            merchantEntity.parameters = JSON.stringify(parameters);
            // merchantEntity.parameters = `{"seedId" : "${zone.seedId}", "merchantIndex" : "${i}", "merchantName" : "Merchant ${i}", "inventory" : []}`;
            spawnEntities.push(merchantEntity);
        } else if(n < config.chests + config.merchants + config.portals * 2) {
            const parameters: PortalEntityParameters = {
                seedId: zone.seedId,
                portalGroup: i,
                portalIndex: n % 2,
            };
    
            const portalEntity = new SpawnEntity();
            portalEntity.id = zone.id;
            portalEntity.gameId = `portal_${i}`;
            portalEntity.prefabAddress = `${entitiesRootAddress}portal`;
            portalEntity.tileId = zone.tileId;
            portalEntity.type = "Portal";
            portalEntity.parameters = JSON.stringify(parameters);
            // portalEntity.parameters = `{"seedId" : "${zone.seedId}", "portalGroup" : "${i}", "portalIndex" : "${j}"}`;
            spawnEntities.push(portalEntity);
        }
        n++;
    })

    const monsterZones = spawnZones.filter(zone => zone.type == SpawnZoneType.Monster);
    console.log("monsterZones: ", monsterZones.length)

    n = 0;
    monsterZones.sort(() => Math.random() - 0.5).forEach((monsterZone, i) => {
        if(n < config.monsters)
        {
            onMonsterSpawn(monsterZone, n + 1); // allow caller to figure out how to spawn a new monster (which is a character)
        }
        n++;
    })

    // n = 0;
    // const portalZones = spawnZones.filter(zone => zone.type == SpawnZoneType.Portal)
    // console.log("portal: ", portalZones.length)
    // portalZones.forEach((protalZone, i) => {
    //     for (let j = 0; j < 2; j++) { 

    //     }
    // })

    // n = 0;
    // const merchantZones = spawnZones.filter(zone => zone.type == SpawnZoneType.Merchant);
    // console.log("merchantZones: ", merchantZones.length)

    // merchantZones.forEach((zone, i) => {
    //     if(n < config.merchants)
    //     {            

    //     }
    //     n++;
    // })


    // const remainingSpawnZones = spawnZones.filter(
    //     (zone) => !takenIds.has(zone.id) && zone.type === "Chest"
    // );

    // console.log(`Number of remaining spawn zones ${remainingSpawnZones.length}`);

    // const shuffledZones = shuffleArray(remainingSpawnZones) as SpawnZone[];

    // for (let i = 0; i < config.portals; i++) {
    //     // spawn 2 portals for each
    //     for (let j = 0; j < 2; j++) {
    //         const zone = shuffledZones.pop();

    //         const parameters: PortalEntityParameters = {
    //             seedId: zone.seedId,
    //             portalGroup: i,
    //             portalIndex: j,
    //         };

    //         const portalEntity = new SpawnEntity();
    //         portalEntity.id = zone.id;
    //         portalEntity.gameId = `portal_${i}`;
    //         portalEntity.prefabAddress = `${entitiesRootAddress}portal`;
    //         portalEntity.tileId = zone.tileId;
    //         portalEntity.type = "Portal";
    //         portalEntity.parameters = JSON.stringify(parameters);
    //         // portalEntity.parameters = `{"seedId" : "${zone.seedId}", "portalGroup" : "${i}", "portalIndex" : "${j}"}`;
    //         spawnEntities.push(portalEntity);
    //     }
    // }

    // for (let i = 0; i < config.merchants; i++) {
    //     const zone = shuffledZones.pop();

    //     const parameters: MerchantEntityParameters = {
    //         seedId: zone.seedId,
    //         merchantIndex: i,
    //         merchantName: `Merchant ${i}`,
    //         inventory: [],
    //     };

    //     const merchantEntity = new SpawnEntity();
    //     merchantEntity.id = zone.id;
    //     merchantEntity.gameId = `merchant_${i}`;
    //     merchantEntity.prefabAddress = `${entitiesRootAddress}merchant`;
    //     merchantEntity.tileId = zone.tileId;
    //     merchantEntity.type = "Merchant";
    //     merchantEntity.parameters = JSON.stringify(parameters);
    //     // merchantEntity.parameters = `{"seedId" : "${zone.seedId}", "merchantIndex" : "${i}", "merchantName" : "Merchant ${i}", "inventory" : []}`;
    //     spawnEntities.push(merchantEntity);
    // }

    return spawnEntities;
}

export function spawnCharacter(
    characters: MapSchema<CharacterState>,
    sessionId: string,
    tile: Tile,
    characterClass: string,
    characterId?: string,
    playerId?: string,
    displayName?: string,
    type?: number,
    monsterType?: number
) : CharacterState {
    const character = new CharacterState();
    const id = playerId || createId();
    character.id = id;
    character.sessionId = sessionId;
    character.characterClass = characterClass;
    character.characterId = characterId || createId();
    character.currentTileId = tile.id;

    if(!!type) {
        character.type = type;
    }

    if (displayName) {
        character.displayName = displayName;
    } else {
        let defaultName;
        if (!playerId) {
            defaultName = character.type == USER_TYPE.USER? `NPC (${character.characterClass})` : `<color="red"><size=50%>MONSTER</size></color>
${MONSTERS[monsterType].name}`;
        } else {
            defaultName = `<size=50%>Player</size>
${character.characterClass}`;
        }
        character.displayName = defaultName;
    }

    const coordinates = new CoordinatesState();
    coordinates.x = tile.x;
    coordinates.y = tile.y;
    character.coordinates = coordinates;

    characters.set(id, character);

    return character;
}

export function getDiceCount(percent : number, type : number) {
    const p = percent * 100;
    if(type == DICE_TYPE.DICE_6) {
        if(p <= 1) {
            return 1;
        } else if(p > 1 && p <= 10) {
            return 2;
        } else if(p > 10 && p <= 35) {
            return 3;
        } else if(p > 35 && p <= 60) {
            return 4;
        } else if(p > 60 && p <= 85) {
            return 5;
        } else if(p > 85 && p <= 100) {
            return 6;
        }
    } else {
        if(p <= 2) {
            return 1;
        } else if(p > 2 && p <= 42) {
            return 2;
        } else if(p > 42 && p <= 82) {
            return 3;
        } else if(p > 82 && p <= 100) {
            return 4;
        }
    }

    return 1;
}

export function getPowerMoveFromId(id : number) {
    let powermove = powermoves.find(pm => pm.id == id);

    if(powermove != null) {
        return powermove;
    } else {
        if(id < 0) {
            let arrowId = Math.abs(id + (id <= -100? 100 : 1));
            if(id <= -100) {
                powermove = {
                    id: 1000,
                    name: "Punch",
                    powerImageId: -1,
                    powerIds: [
                        22, 34
                    ],
                    costList: [
                        {
                            id: ITEMTYPE.MANA,
                            count: 1
                        },

                    ],
                    result : {
                        dice: DICE_TYPE.DICE_4
                    },
                    range: 1,
                    light: 2,
                    coin: 0,
                }
            } else {
                powermove = {
                    id: 1000,
                    name: "Punch",
                    powerImageId: -1,
                    powerIds: [
                        22, 34
                    ],
                    costList: [
                        {
                            id: ITEMTYPE.MELEE,
                            count: 1
                        },
                    ],
                    result : {
                        dice: DICE_TYPE.DICE_4
                    },
                    range: 1,
                    light: 2,
                    coin: 0,
                }
            }
            if(arrowId > 0) {
                powermove.costList.push({
                    id: arrowId,
                    count: 1
                });

                if(arrowId == ITEMTYPE.ARROW) {
                    powermove.result.health = 2;
                } else if(arrowId == ITEMTYPE.BOMB_ARROW) {
                    powermove.result.health = 6;
                    powermove.result.perkId = PERKTYPE.Pull;
                } else if(arrowId == ITEMTYPE.FIRE_ARROW) {
                    powermove.result.health = 3;
                    powermove.result.stacks = [{
                        id: STACKTYPE.Burn,
                        count: 1
                    }];
                } else if(arrowId == ITEMTYPE.ICE_ARROW) {
                    powermove.result.ultimate = 3;
                    powermove.result.energy = 3;
                    powermove.result.stacks = [{
                        id: STACKTYPE.Freeze,
                        count: 1
                    }];
                } else if(arrowId == ITEMTYPE.VOID_ARROW) {
                    powermove.result.health = 4;
                    powermove.result.stacks = [{
                        id: STACKTYPE.Void,
                        count: 1
                    }];
                }


            }

            return powermove;

        } else {
            return null;
        }
    }
}

export function addItemToCharacter(id: number, count : number, state: CharacterState) {
    const it = state.items.find(ii => ii.id == id);
    if(it != null) {
        it.count += count;
    } else {
        const newItem = new Item();
        newItem.id = id;
        newItem.count = count;
        newItem.name = ITEMDETAIL[id].name;
        newItem.description = "description";
        newItem.level = ITEMDETAIL[id].level;
        newItem.cost = ITEMDETAIL[id].cost;
        newItem.sell = ITEMDETAIL[id].sell;
        state.items.push(newItem);
    }
}

export function addStackToCharacter(id: number, count : number, state: CharacterState, client: Client) {
    const stack : Item = state.stacks.find(stack => stack.id == id);
    // ADD BAN STACK LOGIC
    if(!!BAN_STACKS[id]) {
        const banStack = state.stacks.find(st => st.id == BAN_STACKS[id]);
        console.log("ban stack?", BAN_STACKS[id], id, banStack.count);
        if(banStack != null && banStack.count > 0) {
            if(banStack.count >= count) {
                client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                    characterId : state.id,
                    stack1 : id,
                    stack2 : banStack.id,
                    count1 : count,
                    count2 : banStack.count
                });

                banStack.count -= count;
                return;
            } else {
                client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                    characterId : state.id,
                    stack1 : id,
                    stack2 : banStack.id,
                    count1 : count,
                    count2 : banStack.count
                });

                count -= banStack.count;
                banStack.count = 0;
            }

        }
    }

    if(stack == null) {
        const newStack = new Item();
        newStack.id = id;
        newStack.count = count;
        newStack.name = stacks[id].name;
        newStack.description = stacks[id].description;
        newStack.level = stacks[id].level;
        newStack.cost = stacks[id].cost;
        newStack.sell = stacks[id].sell;

        state.stacks.push(newStack);
    } else {
        stack.count += count;
    }
}

export function addPowerToCharacter(id: number, count: number, state: CharacterState) {
    const power : Item = state.powers.find(p => p.id == id);
    if(power == null) {
        const newPower = new Item();
        newPower.id = id;
        newPower.name = powers[id].name;
        newPower.count = 1;
        newPower.description = "";
        newPower.level = powers[id].level;
        newPower.cost = POWERCOSTS[powers[id].level].cost;
        newPower.sell = POWERCOSTS[powers[id].level].sell;
    } else {
        power.count += count;
    }
}

export function getPerkEffectDamage(character: CharacterState, enemy : CharacterState, room: UfbRoom, type: number) {
    const currentTile = room.state.map.tiles.get(character.currentTileId);
    const enemyTile = room.state.map.tiles.get(enemy.currentTileId);

    const x = enemyTile.coordinates.x - currentTile.coordinates.x;
    const y = enemyTile.coordinates.y - currentTile.coordinates.y;

    let x1 = 0;
    let y1 = 0;

    let step = type == PERKTYPE.Push? 1 : -1;

    if(x > y || (x == y && Math.random() < 0.5)) {
        y1 = y;
        x1 = (Math.abs(x) + step) * Math.sign(x);
    } else if(x < y) {
        x1 = x;
        y1 = (Math.abs(y) + step) * Math.sign(y);
    } else {
        x1 = x;
        y1 = (Math.abs(y) + step) * Math.sign(y);
    }

    const desCoodinate = new CoordinatesState();
    desCoodinate.x = currentTile.coordinates.x + x1;
    desCoodinate.y = currentTile.coordinates.y + y1;

    const xDir = x1 - x;
    const yDir = y1 - y;
    if(xDir == 1) {
        return {
            wallType: enemyTile.walls[WALL_DIRECT.RIGHT],
            desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
            desCoodinate: desCoodinate
        };
    } else if(xDir == -1) {
        return {
            wallType: enemyTile.walls[WALL_DIRECT.LEFT],
            desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
            desCoodinate: desCoodinate
        };
    } else if(yDir == 1) {
        return {
            wallType: enemyTile.walls[WALL_DIRECT.TOP],
            desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
            desCoodinate: desCoodinate
        };
    } else if(yDir == -1) {
        return {
            wallType: enemyTile.walls[WALL_DIRECT.DOWN],
            desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
            desCoodinate: desCoodinate
        };
    }

}

export function getCharacterIdsInArea(character: CharacterState, range: number, room : UfbRoom) : string[] {
    let ids: string[] = [];
    room.state.characters.forEach(c => {
        if(c.id != character.id) {
            const currentTile = room.state.map.tiles.get(character.currentTileId);
            const enemyTile = room.state.map.tiles.get(c.currentTileId);
            const r = Math.abs(enemyTile.coordinates.x - currentTile.coordinates.x) + Math.abs(enemyTile.coordinates.y - currentTile.coordinates.y);
            if(r <= range) {
                ids.push(c.id);
            }
        }
    });

    return ids;
}

export function setCharacterHealth(character : CharacterState, amount : number, room : UfbRoom, client: Client, type: string) {
    if(type == "heart") {
        character.stats.health.add(-amount);

    } else {

    }
}

export function IsEquipPower(character : CharacterState, powerId: number) {
    let isEquiped = false;
    character.equipSlots.forEach(slot => {
        if(slot.id == powerId && !isEquiped) {
            isEquiped = true;
        }
    })
    return isEquiped;
}