import { ADD_EXTRA_TYPE, BAN_STACKS, DICE_TYPE, EDGE_TYPE, END_TYPE, EQUIP_EXTRA_BONUS, ITEMDETAIL, ITEMTYPE, MONSTER_TYPE, MONSTERS, PERKTYPE, POWERCOSTS, powermoves, powers, POWERTYPE, QUESTTYPE, stacks, STACKTYPE, USER_DATA_TYPE, USER_TYPE, WALL_DIRECT } from "#assets/resources";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { NavGraphLinkData } from "#game/Pathfinder";
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
import { Graph, Node } from "ngraph.graph";

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
    graph: Graph<any, NavGraphLinkData>
) => {
    let cost = 0;
    let featherCount = 0;
    for (let i = 1; i < p.length; i++) {
        const from = p[i - 1].id as string;
        const to = p[i].id as string;

        graph.forEachLink(link => {
            if(link.fromId == from && link.toId == to) {
                cost += link.data.energyCost;
                featherCount += link.data.featherCost
                return;
            }
        })

        // if(!link) {
        //     throw new Error(`no edge from ${from} to ${to}`);
        // }

        // const edgeCollection = adjacencyList.get(from);
        // if (!edgeCollection) {
        //     throw new Error(`no adjacency list for ${from}`);
        // }
        // let edge: { energyCost: number } | undefined;
        // for (const e of edgeCollection.edges) {
        //     if (e.to === to) {
        //         edge = e;
        //         break;
        //     }
        // }
        // // console.log(`edge from ${from} to ${to} is ${JSON.stringify(edge)}`);
        // if (!edge) {
        //     throw new Error(`no edge from ${from} to ${to}`);
        // }
    }
    return {cost, featherCount};
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
        config.chests + config.portals * 2 + config.merchants + config.itemBags
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
            const chestEntity = new SpawnEntity();
            chestEntity.id = zone.id;
            chestEntity.gameId = `chest_${i}`;
            chestEntity.prefabAddress = `${entitiesRootAddress}chest`;
            chestEntity.tileId = zone.tileId;
            chestEntity.type = "Chest";
            chestEntity.parameters = `{"seedId" : "${zone.seedId}"}`;
            spawnEntities.push(chestEntity);
        } else if(n < config.chests + config.itemBags) {
            const chestEntity = new SpawnEntity();
            chestEntity.id = zone.id;
            chestEntity.gameId = `chest_${i}`;
            chestEntity.prefabAddress = `${entitiesRootAddress}ItemBag`;
            chestEntity.tileId = zone.tileId;
            chestEntity.type = "Chest";
            chestEntity.parameters = `{"seedId" : "${zone.seedId}"}`;
            spawnEntities.push(chestEntity);
        } else if(n < config.chests + config.itemBags + config.merchants) {
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
        } else if(n < config.chests + config.itemBags + config.merchants + config.portals * 2) {
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
            defaultName = character.type == USER_TYPE.USER? `NPC (${character.characterClass})` : `${MONSTERS[monsterType].name}`;
        } else {
            defaultName = `${character.characterClass}`;
        }
        character.displayName = defaultName;
    }

    const coordinates = new CoordinatesState();
    coordinates.x = tile.x;
    coordinates.y = tile.y;
    character.coordinates = coordinates;

    addItemToCharacter(ITEMTYPE.MANA, character.stats.maxMana, character);
    addItemToCharacter(ITEMTYPE.MELEE, character.stats.maxMelee, character);

    // get coin in database...
    

    characters.set(id, character);

    return character;
}

export function spawnMonster(
    characters: MapSchema<CharacterState>,
    sessionId: string,
    tileId: string,
    x: number,
    y: number,
    characterClass: string,
    type?: number,
    monsterType?: number
) : CharacterState {
    const character = new CharacterState();
    const id = createId();
    character.id = id;
    character.sessionId = sessionId;
    character.characterClass = characterClass;
    character.characterId = createId();
    character.currentTileId = tileId;

    if(!!type) {
        character.type = type;
    }

    character.displayName = `${MONSTERS[monsterType].name}`;

    const coordinates = new CoordinatesState();
    coordinates.x = x;
    coordinates.y = y;
    character.coordinates = coordinates;

    // addItemToCharacter(ITEMTYPE.MANA, character.stats.maxMana, character);
    // addItemToCharacter(ITEMTYPE.MELEE, character.stats.maxMelee, character);

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

export function getPowerMoveFromId(id : number, extraItemId : number = -1) {
    const p = powermoves.find((pm : any) => pm.id == id);
    if(p != null) {
        const powermove = {
            ...p,
            result: {
                ...p.result
            },
            costList: [...p.costList],
            stackCostList: [...p.stackCostList]
        };
        if(extraItemId > 0) {

            console.log("extra item id: ", extraItemId);
            powermove.costList.push({
                id: extraItemId,
                count: 1
            });

            powermove.result.health = !!powermove.result.health? powermove.result.health : 0;
            powermove.result.energy = !!powermove.result.energy? powermove.result.energy : 0;
            powermove.result.ultimate = !!powermove.result.ultimate? powermove.result.ultimate : 0;
            powermove.result.stacks = !!powermove.result.stacks? [...powermove.result.stacks] : [];

            if(powermove.powerImageId == POWERTYPE.Void2){
                powermove.result.items = [];
                powermove.result.items.push({
                    id: extraItemId == ITEMTYPE.ARROW? ITEMTYPE.VOID_ARROW : ITEMTYPE.VOID_BOMB,
                    count: 1
                });
            } else if(powermove.powerImageId == POWERTYPE.Fire2){
                powermove.result.items = [];
                powermove.result.items.push({
                    id: extraItemId == ITEMTYPE.ARROW? ITEMTYPE.FIRE_ARROW : ITEMTYPE.FIRE_BOMB,
                    count: 1
                });
            } else if(powermove.powerImageId == POWERTYPE.Ice2){
                powermove.result.items = [];
                powermove.result.items.push({
                    id: extraItemId == ITEMTYPE.ARROW? ITEMTYPE.ICE_ARROW : ITEMTYPE.ICE_BOMB,
                    count: 1
                });
            } else {
                if(extraItemId == ITEMTYPE.ARROW) {
                    powermove.result.health -= 2;
                } else if(extraItemId == ITEMTYPE.BOMB_ARROW) {
                    powermove.result.health -= 6;
                    if(!!powermove.result.perkId) {
                        powermove.result.perkId1 = PERKTYPE.Push;
                    } else {
                        powermove.result.perkId = PERKTYPE.Push;
                    }
                } else if(extraItemId == ITEMTYPE.FIRE_ARROW) {
                    powermove.result.health -= 3;
                    powermove.result.stacks.push({
                        id: STACKTYPE.Burn,
                        count: 1
                    });
                } else if(extraItemId == ITEMTYPE.ICE_ARROW) {
                    powermove.result.ultimate -= 3;
                    powermove.result.health -= 3;
                    powermove.result.stacks.push({
                        id: STACKTYPE.Freeze,
                        count: 1
                    });
                } else if(extraItemId == ITEMTYPE.VOID_ARROW) {
                    powermove.result.health -= 4;
                    powermove.result.stacks.push({
                        id: STACKTYPE.Void,
                        count: 1
                    });
                } else if(extraItemId == ITEMTYPE.BOMB) {
                    powermove.result.health -= 3;
                } else if(extraItemId == ITEMTYPE.FIRE_BOMB) {
                    powermove.result.health -= 4;
                    powermove.result.stacks.push({
                        id: STACKTYPE.Burn,
                        count: 1
                    });
                } else if(extraItemId == ITEMTYPE.ICE_BOMB) {
                    powermove.result.health -= 3;
                    powermove.result.energy -= 2;
                    powermove.result.stacks.push({
                        id: STACKTYPE.Freeze,
                        count: 1
                    });
                } else if(extraItemId == ITEMTYPE.VOID_BOMB) {
                    powermove.result.health -= 5;
                    powermove.result.stacks.push({
                        id: STACKTYPE.Void,
                        count: 1
                    });
                } else if(extraItemId == ITEMTYPE.CALTROP_BOMB) {
                    powermove.result.ultimate -= 4;
                    powermove.result.energy -= 4;
                    powermove.result.stacks.push({
                        id: STACKTYPE.Slow,
                        count: 1
                    })
                }
            }


        } 
        return powermove;
    } else {
        let powermove : any;
        if(id < 0) {
            let arrowId = Math.abs(id + (id <= -100? 100 : 1));
            if(id <= -100) {
                powermove = {
                    id: id,
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
                    stackCostList:[],
                    result : {
                        dice: DICE_TYPE.DICE_4
                    },
                    range: 1,
                    light: 2,
                    coin: 0,
                }
            } else {
                powermove = {
                    id: id,
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
                    stackCostList:[],
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
                    powermove.result.health = -2;
                } else if(arrowId == ITEMTYPE.BOMB_ARROW) {
                    powermove.result.health = -6;
                    powermove.result.perkId = PERKTYPE.Push;
                } else if(arrowId == ITEMTYPE.FIRE_ARROW) {
                    powermove.result.health = -3;
                    powermove.result.stacks = [{
                        id: STACKTYPE.Burn,
                        count: 1
                    }];
                } else if(arrowId == ITEMTYPE.ICE_ARROW) {
                    powermove.result.ultimate = -3;
                    powermove.result.health = -3;
                    powermove.result.stacks = [{
                        id: STACKTYPE.Freeze,
                        count: 1
                    }];
                } else if(arrowId == ITEMTYPE.VOID_ARROW) {
                    powermove.result.health = -4;
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

export function getEquipBonusDamage(id: number, character: CharacterState){
    let extraDamage = {
        damage : 0,
        range : 0
    };

    character.equipSlots.forEach(slot => {
        if(id >= 0) {
            if(slot.id == id && !!EQUIP_EXTRA_BONUS[id]){
                extraDamage.damage = 0;
                extraDamage.range = EQUIP_EXTRA_BONUS[id].range;
            }
        }
    })

    return extraDamage;
}

export function getArrowBombCount(character : CharacterState) {
    let arrowCount = 0;
    let bombCount = 0;
    let meleeCount = 0;
    let manaCount = 0;
    character.items.forEach(item => {
        if(IsArrowItem(item.id)) {
            arrowCount += item.count;
        } else if(IsBombItem(item.id)) {
            bombCount += item.count;
        } else if(item.id == ITEMTYPE.MELEE) {
            meleeCount += item.count;
        } else if(item.id == ITEMTYPE.MANA) {
            manaCount += item.count;
        }
    });

    return {
        arrow : arrowCount,
        bomb : bombCount,
        melee : meleeCount,
        mana : manaCount
    }
}

export function IsArrowItem(id: number) {
    return id == ITEMTYPE.ARROW || id == ITEMTYPE.ICE_ARROW || id == ITEMTYPE.BOMB_ARROW || id == ITEMTYPE.FIRE_ARROW || id == ITEMTYPE.VOID_ARROW;
}

export function IsBombItem(id : number) {
    return id == ITEMTYPE.BOMB || id == ITEMTYPE.ICE_BOMB || id == ITEMTYPE.FIRE_BOMB || id == ITEMTYPE.VOID_BOMB || id == ITEMTYPE.CALTROP_BOMB;
}

export function IsDoubleItem(id : number) {
    return id >= ITEMTYPE.FLAME_CHILI2;
}


export function GetRealItemIdByDouble(id : number) {
    let realId = id;
    let count = 1;
    if(id == ITEMTYPE.FLAME_CHILI2) {
        realId = ITEMTYPE.FLAME_CHILI;
        count = 2;
    } else if(id == ITEMTYPE.FLAME_CHILI3) {
        realId = ITEMTYPE.FLAME_CHILI;
        count = 3;
    } else if(id == ITEMTYPE.ICE_TEA2) {
        realId = ITEMTYPE.ICE_TEA;
        count = 2;
    } else if(id == ITEMTYPE.ICE_TEA3) {
        realId = ITEMTYPE.ICE_TEA;
        count = 3;
    } else if(id == ITEMTYPE.HEART_PIECE2) {
        realId = ITEMTYPE.HEART_PIECE;
        count = 2;
    } else if(id == ITEMTYPE.POTION2) {
        realId = ITEMTYPE.POTION;
        count = 2;
    } else if(id == ITEMTYPE.POTION3) {
        realId = ITEMTYPE.POTION;
        count = 3;
    } else if(id == ITEMTYPE.FEATHER2) {
        realId = ITEMTYPE.FEATHER;
        count = 2;
    } else if(id == ITEMTYPE.FEATHER3) {
        realId = ITEMTYPE.FEATHER;
        count = 3;
    } else if(id == ITEMTYPE.ARROW2) {
        realId = ITEMTYPE.ARROW;
        count = 2;
    } else if(id == ITEMTYPE.ARROW3) {
        realId = ITEMTYPE.ARROW;
        count = 3;
    } else if(id == ITEMTYPE.BOMB2) {
        realId = ITEMTYPE.BOMB;
        count = 2;
    } else if(id == ITEMTYPE.BOMB3) {
        realId = ITEMTYPE.BOMB;
        count = 3;
    } else if(id == ITEMTYPE.MELEE2) {
        realId = ITEMTYPE.MELEE;
        count = 2;
    } else if(id == ITEMTYPE.MANA2) {
        realId = ITEMTYPE.MANA;
        count = 2;
    } else if(id == ITEMTYPE.QUIVER2) {
        realId = ITEMTYPE.QUIVER;
        count = 2;
    } else if(id == ITEMTYPE.BOMB_BAG2) {
        realId = ITEMTYPE.BOMB_BAG;
        count = 2;
    } else if(id == ITEMTYPE.WARP_CRYSTAL2) {
        realId = ITEMTYPE.WARP_CRYSTAL;
        count = 2;
    } else if(id == ITEMTYPE.ELIXIR2) {
        realId = ITEMTYPE.ELIXIR;
        count = 2;
    } else if(id == ITEMTYPE.BOMB_ARROW2) {
        realId = ITEMTYPE.BOMB_ARROW;
        count = 2;
    } else if(id == ITEMTYPE.FIRE_ARROW2) {
        realId = ITEMTYPE.FIRE_ARROW;
        count = 2;
    } else if(id == ITEMTYPE.ICE_ARROW2) {
        realId = ITEMTYPE.ICE_ARROW;
        count = 2;
    } else if(id == ITEMTYPE.VOID_ARROW2) {
        realId = ITEMTYPE.VOID_ARROW;
        count = 2;
    } else if(id == ITEMTYPE.FIRE_BOMB2) {
        realId = ITEMTYPE.FIRE_BOMB;
        count = 2;
    } else if(id == ITEMTYPE.ICE_BOMB2) {
        realId = ITEMTYPE.ICE_BOMB;
        count = 2;
    } else if(id == ITEMTYPE.VOID_BOMB2) {
        realId = ITEMTYPE.VOID_BOMB;
        count = 2;
    } else if(id == ITEMTYPE.CALTROP_BOMB2) {
        realId = ITEMTYPE.CALTROP_BOMB;
        count = 2;
    }

    return {
        id : realId,
        count : count
    }
}

export function getItemCountFromCharacter(id: number, state: CharacterState) {
    let count = 0;

    state.items.forEach(item => {
        if(item.id == id){
            count = item.count;
        }
    })

    return count;
}

export function addItemToCharacter(id: number, count : number, state: CharacterState, client: Client = null) {
    const {arrow, bomb, mana, melee} = getArrowBombCount(state);

    const data = GetRealItemIdByDouble(id);

    id = data.id;
    count = data.count * count;

    // AUTOMATICALLY SELL ARROW BOMB ITEM BEGIN
    // if(IsArrowItem(id) && arrow < state.stats.arrowLimit) {
    //     const addedCount = Math.min(state.stats.arrowLimit - arrow, count);
    //     const shopCount = count - addedCount;
    //     state.stats.coin += ITEMDETAIL[id].sell * shopCount;
    //     count = addedCount;
    // } else if(IsBombItem(id) && bomb < state.stats.bombLimit) {
    //     const addedCount = Math.min(state.stats.bombLimit - bomb, count);
    //     const shopCount = count - addedCount;
    //     state.stats.coin += ITEMDETAIL[id].sell * shopCount;
    //     count = addedCount;
    // }

    // AUTOMATICALLY SELL ARROW BOMB ITEM END

    if(count == 0) return;

    if(id == ITEMTYPE.MANA) {
        const maxMana = state.stats.maxMana;
        let addedCount = Math.max(0, mana + count - maxMana);
        if(addedCount == count) {
            // state.stats.maxMana += addedCount;
        } else {
            count -= addedCount;
        }
        
    } else if(id == ITEMTYPE.MELEE) {
        const maxMelee = state.stats.maxMelee;
        let addedCount = Math.max(0, melee + count - maxMelee);
        if(addedCount == count) {
            // state.stats.maxMelee += addedCount;
        } else {
            count -= addedCount;
        }
    }

    let itemCount = getItemCountFromCharacter(id, state);
    
    if(count > 0){

        if(id == ITEMTYPE.HEART_PIECE) {
            if(itemCount != 0 && (itemCount + 1) % 4 == 0){
                addItemToCharacter(ITEMTYPE.HEART_CRYSTAL, 1, state, client);
            }
        } else if(id == ITEMTYPE.ENERGY_SHARD){
            if(itemCount != 0 && (itemCount + 1) % 3 == 0){
                console.log("added energy crystal...")
                addItemToCharacter(ITEMTYPE.ENERGY_CRYSTAL, 1, state, client);
            }
        } else if(id == ITEMTYPE.HEART_CRYSTAL){
            state.stats.health.max += 5;
            state.stats.health.add(5);
            if(client != null){
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: 5,
                    type: "heart"
                });
            }
            setQuestResult(QUESTTYPE.LIFE, 1, state);
        } else if(id == ITEMTYPE.ENERGY_CRYSTAL){
            state.stats.energy.max += 3;
            state.stats.energy.add(3);
            if(client != null){
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: 3,
                    type: "energy"
                });
            }
            setQuestResult(QUESTTYPE.ENERGY, 1, state);

            console.log("added energy crystal...", count)
        }
    }


    const itemIdx = state.items.findIndex(ii => ii.id == id);

    if(itemIdx != -1) {
        const it = state.items.find(ii => ii.id == id);
        it.count += count;
        state.items.deleteAt(itemIdx);
        state.items.push(it);
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

export function addStackToCharacter(id: number, count : number, state: CharacterState, client: Client, room: UfbRoom = null) {

    if(count < 0) {
        AddUserData(USER_DATA_TYPE.USED_STACK, state, count);
    }

    // ADD BAN STACK LOGIC
    if(!!BAN_STACKS[id] && count > 0) {
        const banStack = state.stacks.find(st => st.id == BAN_STACKS[id]);
        const banIdx = state.stacks.findIndex(st => st.id == BAN_STACKS[id]);
        if(banStack != null && banStack.count > 0) {
            if(banStack.count >= count) {
                if(client != null) {
                    client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                        characterId : state.id,
                        stack1 : id,
                        stack2 : banStack.id,
                        count1 : count,
                        count2 : banStack.count
                    });
                } else {
                    room.broadcast(
                        SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                            characterId : state.id,
                            stack1 : id,
                            stack2 : banStack.id,
                            count1 : count,
                            count2 : banStack.count
                        }
                    )
                }
                banStack.count -= count;
                return;
            } else {
                if(client != null) {
                    client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                        characterId : state.id,
                        stack1 : id,
                        stack2 : banStack.id,
                        count1 : count,
                        count2 : banStack.count
                    });
                } else {
                    room.broadcast(
                        SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                            characterId : state.id,
                            stack1 : id,
                            stack2 : banStack.id,
                            count1 : count,
                            count2 : banStack.count
                        }
                    )
                }
                count -= banStack.count;
                banStack.count = 0;
            }
            state.stacks.deleteAt(banIdx);
            state.stacks.push(banStack);
        }
    }

    const stackIdx = state.stacks.findIndex(stack => stack.id == id);

    if(stackIdx == -1) {
        if(count > 0) {
            console.log("added stack in state", count, id);
            const newStack = new Item();
            newStack.id = id;
            newStack.count = count;
            newStack.name = stacks[id].name;
            newStack.description = stacks[id].description;
            newStack.level = stacks[id].level;
            newStack.cost = stacks[id].cost;
            newStack.sell = stacks[id].sell;
    
            state.stacks.push(newStack);
        }

    } else {
        const _stack = state.stacks[stackIdx];
        _stack.count += count;
        _stack.count = Math.max(0, _stack.count);
        console.log("------------stack count------------" + _stack.count + " : " + stackIdx);
        state.stacks.deleteAt(stackIdx);
        state.stacks.push(_stack);
    }
}

export function addPowerToCharacter(id: number, count: number, state: CharacterState) {
    const pIdx : number = state.powers.findIndex(p => p.id == id);
    if(pIdx == -1) {
        if(count > 0){
            const newPower = new Item();
            newPower.id = id;
            newPower.name = powers[id].name;
            newPower.count = count;
            newPower.description = "";
            newPower.level = powers[id].level;
            newPower.cost = POWERCOSTS[powers[id].level].cost;
            newPower.sell = POWERCOSTS[powers[id].level].sell;
            state.powers.push(newPower);
        }
    } else {
        let oldPower = state.powers[pIdx];
        oldPower.count += count;
        oldPower.count = Math.max(0, oldPower.count);
        state.powers.deleteAt(pIdx);
        state.powers.push(oldPower);
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

    if(y != 0) {
        y1 = y + step * Math.sign(y);
    } else if (x != 0) {
        x1 = x + step * Math.sign(x);
    }

    const desCoodinate = new CoordinatesState();
    desCoodinate.x = currentTile.coordinates.x + x1;
    desCoodinate.y = currentTile.coordinates.y + y1;

    var desTileId = coordToTileId(room.state.map.tiles, desCoodinate);

    var wallType = enemyTile.walls[getDirectFromCoord(x1, y1)];
    console.log("bridge perk : ", wallType, " ", getDirectFromCoord(x1, y1), " ", x1, y1,  enemyTile.walls, EDGE_TYPE.BRIDGE, EDGE_TYPE.STAIR);
    if(wallType == EDGE_TYPE.BRIDGE || wallType == EDGE_TYPE.STAIR){
        
        if(y != 0) {
            y1 = y + step * Math.sign(y) * 2;
        } else if (x != 0) {
            x1 = x + step * Math.sign(x) * 2;
        }

        desCoodinate.x = currentTile.coordinates.x + x1;
        desCoodinate.y = currentTile.coordinates.y + y1;

        var prevTile = room.state.map.tiles.get(desTileId);
        desTileId = coordToTileId(room.state.map.tiles, desCoodinate);

        var deltaX = desCoodinate.x - prevTile.coordinates.x;
        var deltaY = desCoodinate.y - prevTile.coordinates.y;

        wallType = prevTile.walls[getDirectFromCoord(deltaX, deltaY)];

        console.log("des tile : ", prevTile);
    }

    return {
        wallType,
        desTileId,
        desCoodinate: desCoodinate
    };

    // const xDir = x1 - x;
    // const yDir = y1 - y;
    // if(xDir >= 1) {
    //     return {
    //         wallType: enemyTile.walls[WALL_DIRECT.RIGHT],
    //         desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
    //         desCoodinate: desCoodinate
    //     };
    // } else if(xDir <= -1) {
    //     return {
    //         wallType: enemyTile.walls[WALL_DIRECT.LEFT],
    //         desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
    //         desCoodinate: desCoodinate
    //     };
    // } else if(yDir >= 1) {
    //     return {
    //         wallType: enemyTile.walls[WALL_DIRECT.TOP],
    //         desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
    //         desCoodinate: desCoodinate
    //     };
    // } else if(yDir <= -1) {
    //     return {
    //         wallType: enemyTile.walls[WALL_DIRECT.DOWN],
    //         desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
    //         desCoodinate: desCoodinate
    //     };
    // }

}

export function setPerkEffectDamage(character: CharacterState, enemy : CharacterState, room: UfbRoom, client: Client, perkType: number, range: number = 1){
    let target = enemy;
    
    if(perkType == PERKTYPE.AreaOfEffect) {
        const enemyIds = getCharacterIdsInArea(character, range, room);
        enemyIds.forEach(id => {
            setCharacterHealth(room.state.characters.get(id), -1, room, client, "heart", character);
            if(room.state.characters.get(id).stats.health.current <= 0) {
                room.RewardFromMonster(character, room.state.characters.get(id), client);
            }
        })

    } else {

        if(getCountFromItem(STACKTYPE.Steady, enemy.stacks) > 0) {
            // REMOVE PERK EFFECT BY STEADY STACK
            console.log("ACTIVE STEADY STACK....", character.id);
            client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_STACK_PERK_TOAST, {
                characterId : character.id,
                stackId : STACKTYPE.Steady,
                perkId : perkType,
                count : getCountFromItem(STACKTYPE.Steady, enemy.stacks),
            });

            addStackToCharacter(STACKTYPE.Steady, -1, enemy, client, room);

        } else {
            const result = getPerkEffectDamage(character, enemy, room, perkType);
            console.log("perk: ", result);
            if(perkType != PERKTYPE.Vampire){
                if(result == null || result.desTileId == "") {
                    setCharacterHealth(enemy, -1, room, client, "heart", character);

                    // if(enemy.stats.health.current == 0) {
                    //     room.RewardFromMonster(character, enemy, client);
                    // }
                    room.sendBroadcastStats(-1, ADD_EXTRA_TYPE.HEART_ENEMY);
                } else {
                    let isEmptyTile = IsEmptyTile(result.desTileId, room);

                    if(result.wallType == EDGE_TYPE.BASIC) {

                        if(isEmptyTile) {
                            // CHANGE POSITION

                            target.coordinates.x = result.desCoodinate.x;
                            target.coordinates.y = result.desCoodinate.y;
                            target.currentTileId = result.desTileId;

                            const path: PathStep[] = [{
                                tileId: result.desTileId
                            }];
                            console.log("move tile")
                            room.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                characterId : target.id,
                                path
                            });

                            room.broadcast(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                characterId : target.id,
                                perkId: perkType,
                                tileId: result.desTileId
                            });

                        } else {
                            setCharacterHealth(target, -1, room, client, "heart", character);

                            // if(target == enemy && target.stats.health.current == 0) {
                            //     room.RewardFromMonster(character, target, client);
                            // }
                            room.sendBroadcastStats(-1, ADD_EXTRA_TYPE.HEART_ENEMY);
                        }

                    } else if(result.wallType == EDGE_TYPE.WALL || result.wallType == EDGE_TYPE.BRIDGE || result.wallType == EDGE_TYPE.NULL || result.wallType == EDGE_TYPE.STAIR 
                        || result.wallType == EDGE_TYPE.CLIFF) {
                        setCharacterHealth(target, -1, room, client, "heart", character);

                        // if(target == enemy && target.stats.health.current == 0) {
                        //     room.RewardFromMonster(character, target, client);
                        // }
                        room.sendBroadcastStats(-1, ADD_EXTRA_TYPE.HEART_ENEMY);
                    } else if(result.wallType == EDGE_TYPE.RAVINE) {
                        addStackToCharacter(STACKTYPE.Slow, 1, target, client);

                        // CHANGE POSITION
                        if(isEmptyTile) {
                            target.coordinates.x = result.desCoodinate.x;
                            target.coordinates.y = result.desCoodinate.y;
                            target.currentTileId = result.desTileId;

                            const path: PathStep[] = [{
                                tileId: result.desTileId
                            }];
                            room.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                characterId : target.id,
                                path
                            });

                            room.broadcast(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                characterId : target.id,
                                perkId: perkType,
                                tileId: result.desTileId
                            });
                        }

                    } else if(result.wallType == EDGE_TYPE.CLIFF) {
                        setCharacterHealth(target, -1, room, client, "heart", character);
                        
                        room.sendBroadcastStats(-1, ADD_EXTRA_TYPE.HEART_ENEMY);

                        // if(target == enemy && target.stats.health.current == 0) {
                        //     room.RewardFromMonster(character, target, client);
                        // }

                        // CHANGE POSITION
                        // if(isEmptyTile) {
                        //     target.coordinates.x = result.desCoodinate.x;
                        //     target.coordinates.y = result.desCoodinate.y;
                        //     target.currentTileId = result.desTileId;

                        //     const path: PathStep[] = [{
                        //         tileId: result.desTileId
                        //     }];
                        //     room.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                        //         characterId : target.id,
                        //         path
                        //     });

                        //     client.send(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                        //         characterId : target.id,
                        //         perkId: perkType,
                        //         tileId: result.desTileId
                        //     });
                        // }

                    } else if(result.wallType == EDGE_TYPE.VOID) {
                        setCharacterHealth(target, -2, room, client, "heart", character);

                        // if(target == enemy && target.stats.health.current == 0) {
                        //     room.RewardFromMonster(character, target, client);
                        // }

                        addStackToCharacter(STACKTYPE.Void, 1, target, client);
                        room.sendBroadcastStats(-2, ADD_EXTRA_TYPE.HEART_ENEMY);
                    }
                }
            }

        }
    }
}

function getDirectFromCoord(x: number, y: number) : number {
    if(x == 0) {
        return Math.sign(y) > 0 ? 2 : 0;
    } else {
        return Math.sign(x) > 0 ? 1 : 3;
    }
    return (1 - y) * (x == 0? 0 : 1) + (2 - x) * (y == 0? 0 : 1);
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

export function setCharacterHealth(character : CharacterState, amount : number, room : UfbRoom, client: Client, type: string, enemy: CharacterState) {
    let extra = character.stats.health.add(amount);
    if(amount < 0) {
        character.stats.ultimate.add(2 * Math.abs(amount));
        AddUserData(USER_DATA_TYPE.DAMAGE_TAKEN, character, amount);
        if(enemy != null)
            AddUserData(USER_DATA_TYPE.DAMAGE_DEAL, enemy, amount);
    } else{
        AddUserData(USER_DATA_TYPE.DAMAGE_HEAL, character, amount);
    }

    if(character.stats.health.current <= 0) {

        if(enemy != null)
            AddUserData(USER_DATA_TYPE.KILLS, enemy, 1);

        if(character.type == USER_TYPE.MONSTER) {
            room.broadcast(SERVER_TO_CLIENT_MESSAGE.DEAD_MONSTER, {characterId : character.id});                
            room.RespawnMonster();
            character.coordinates.x = -1;
            character.coordinates.y = -1;
            
            // if(enemy != null && character.stats.health.current <= 0) {
            //     room.RewardFromMonster(enemy, character, client);
            // }

            if(enemy != null){
                setQuestResult(QUESTTYPE.SLAYER, 1, enemy);
                if(IsGreenMonster(enemy.characterClass)){
                    setQuestResult(QUESTTYPE.KILL, 1, enemy);
                }
            }

        } else if(character.type == USER_TYPE.USER) {
            if(getCountFromItem(STACKTYPE.Revive, character.stacks) > 0) {
                addStackToCharacter(STACKTYPE.Revive, -1, character, client, room);
                character.stats.health.add(1);
                character.stats.isRevive = true;
                room.broadcast(SERVER_TO_CLIENT_MESSAGE.STACK_REVIVE_ACTIVE, {
                    characterId: character.id,
                    endType : END_TYPE.DEFEAT
                });
                return;
            } else {
                let aliveCount = 0;
                room.state.characters.forEach(p => {
                    if(p.type == USER_TYPE.USER && p.stats.health.current > 0) {
                        aliveCount++;
                    }
                })

                room.broadcast(SERVER_TO_CLIENT_MESSAGE.GAME_END_STATUS, {
                    characterId: character.id,
                    endType : END_TYPE.DEFEAT
                });

                if(enemy != null){
                    room.notify(
                        client,
                        `${character.displayName} was killed by ${enemy.displayName}`,
                        "error"
                    );
                } else{
                    room.notify(
                        client,
                        `${character.displayName} was killed.`,
                        "error"
                    );
                }

                // room.SaveCharacterData(character.id, client.sessionId);
                character.connected = false;
                if(aliveCount == 0) {
                    room.StopAIChecking();
                }

            }
        }
    }

    return extra;
}

export function setCharacterEnergy(character: CharacterState, amount: number, room: UfbRoom, client: Client){
    character.stats.energy.add(amount);
    AddUserData(USER_DATA_TYPE.USED_ENERGY, character, Math.abs(amount));
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

export function IsEnemyAdjacent(character: CharacterState, enemy : CharacterState, room : UfbRoom) {
    const currentTile = room.state.map.tiles.get(character.currentTileId);
    const enemyTile = room.state.map.tiles.get(enemy.currentTileId);
    const r = Math.abs(enemyTile.coordinates.x - currentTile.coordinates.x) + Math.abs(enemyTile.coordinates.y - currentTile.coordinates.y);
    return r == 1;
}

export function IsEmptyTile(tileId: string, room: UfbRoom){
    const characterTileIds: string[] = [];
    const spawnIds: string[] = [];
    
    room.state.characters.forEach(c => {
        characterTileIds.push(c.currentTileId);
    });
    
    room.state.map.spawnEntities.forEach(entity => {
        spawnIds.push(entity.tileId);
    });

    // Filter out occupied tiles (characters, spawns, and current tile to avoid immediate respawn overlap)
    const occupiedIds: string[] = [...characterTileIds, ...spawnIds];

    return occupiedIds.findIndex(id => id == tileId) == -1;

}

export function GetNearestPlayerId( currentTileId: string, room: UfbRoom) {
    const currentTile = room.state.map.tiles.get(currentTileId);

    let id = "";
    let range = 100;
    room.state.characters.forEach(character => {
        if(character.type == USER_TYPE.USER && character.stats.health.current > 0 && !character.stats.isRevive) {
            const enemyTile = room.state.map.tiles.get(character.currentTileId);
            const r = Math.abs(enemyTile.coordinates.x - currentTile.coordinates.x) + Math.abs(enemyTile.coordinates.y - currentTile.coordinates.y);
            if(range > r) {
                range = r;
                id = character.id;
            }
        }
    })

    return id;
}

export function GetNearestTileId( currentTileId: string, room: UfbRoom) {
    const id = GetNearestPlayerId(currentTileId, room);
    if(id != "") {
        const directs = ['top', 'down', 'left', 'right'];
        const dirt = directs[Math.ceil(Math.random() * 100) % directs.length];
        const tile = room.state.map.tiles.get(room.state.characters.get(id).currentTileId);
        return getTileIdByDirection(room.state.map.tiles, tile.coordinates, dirt);
    } else {
        return id;
    }
}

export function GetObstacleTileIds(currentTileId: string, room: UfbRoom) {
    let tileIds: any = [];
    room.state.characters.forEach(character => {
        if(currentTileId != character.currentTileId && character.stats.health.current != 0) {
            tileIds.push(character.currentTileId);
        }
    });
    return tileIds;
}

export function GetRandomFreeTileId(currentTileId: string, room: UfbRoom, type: SpawnZoneType): string {
    const tileIds: string[] = [];
    const characterTileIds: string[] = [];
    const spawnIds: string[] = [];
    
    room.state.characters.forEach(c => {
        characterTileIds.push(c.currentTileId);
    });
    
    room.spawnZoneArray.forEach(zone => {
        if(type == SpawnZoneType.Merchant){
            if(zone.type == SpawnZoneType.Chest || zone.type == SpawnZoneType.Merchant){
                tileIds.push(zone.tileId);
            }
        }else{
            if(zone.type == type){
                tileIds.push(zone.tileId);
            }
        }

    })
    
    room.state.map.spawnEntities.forEach(entity => {
        spawnIds.push(entity.tileId);
    });

    // Filter out occupied tiles (characters, spawns, and current tile to avoid immediate respawn overlap)
    const occupiedIds: Set<string> = new Set([...characterTileIds, ...spawnIds, currentTileId]);
    const freeTileIds: string[] = tileIds.filter(id => !occupiedIds.has(id));
    
    console.log("total zone count : ", tileIds.length, spawnIds.length, freeTileIds.length);
    // Return random free tile or fallback
    if (freeTileIds.length === 0) {
        console.warn("No free tiles available");
        return "";  // Or handle error as needed
    }
    
    let randomIndex: number = Math.floor(Math.random() * freeTileIds.length);
    return freeTileIds[randomIndex];
}

export function GetMonsterDeadCount(room: UfbRoom) {
    let blue = 0;
    let blueLive = 0;
    let green = 0;
    let greenLive = 0;
    let yellow = 0;
    let yellowLive = 0;
    room.state.characters.forEach(character => {
        if(character.type == USER_TYPE.MONSTER) {
            if(IsBlueMonster(character.characterClass)) {
                if(character.stats.health.current == 0) {
                    blue++;
                } else {
                    blueLive++;
                }
            } else if(IsGreenMonster(character.characterClass)) {
                if(character.stats.health.current == 0) {
                    green++;
                } else {
                    greenLive++;
                }
            } else if(IsYellowMonster(character.characterClass)) {
                if(character.stats.health.current == 0) {
                    yellow++;
                } else {
                    yellowLive++;
                }
            }
        }
    })

    return {blue, green, yellow, blueLive, greenLive, yellowLive};
}

export function IsBlueMonster(key: string) {
    return key == MONSTERS[MONSTER_TYPE.WASP_BLUE].characterClass ||
    key == MONSTERS[MONSTER_TYPE.EARWIG_BLUE].characterClass ||
    key == MONSTERS[MONSTER_TYPE.SPIDER_BLUE].characterClass ||
    key == MONSTERS[MONSTER_TYPE.CENTIPEDE_BLUE].characterClass; 
}

export function IsGreenMonster(key: string) {
    return key == MONSTERS[MONSTER_TYPE.WASP_GREEN].characterClass ||
    key == MONSTERS[MONSTER_TYPE.EARWIG_GREEN].characterClass ||
    key == MONSTERS[MONSTER_TYPE.SPIDER_GREEN].characterClass ||
    key == MONSTERS[MONSTER_TYPE.CENTIPEDE_GREEN].characterClass; 
}

export function IsYellowMonster(key: string) {
    return key == MONSTERS[MONSTER_TYPE.WASP_YELLOW].characterClass ||
    key == MONSTERS[MONSTER_TYPE.EARWIG_YELLOW].characterClass ||
    key == MONSTERS[MONSTER_TYPE.SPIDER_YELLOW].characterClass ||
    key == MONSTERS[MONSTER_TYPE.CENTIPEDE_YELLOW].characterClass; 
}

export function getPortalPosition(data: SpawnEntity, room: UfbRoom) {
    
    let tileId = getNextPortalTilePosition(data, room);

    if(tileId != "") {
        tileId = getOpenTilePosition(tileId, room);
    }
    return tileId;
}

export function getNextPortalTilePosition(data: SpawnEntity, room: UfbRoom): string {
    let tileId = "";
    const parameters: PortalEntityParameters = JSON.parse(data.parameters);

    room.state.map.spawnEntities.forEach(entity => {
        if(entity.type == "Portal") {
            const entityParams: PortalEntityParameters = JSON.parse(entity.parameters);
            if(entityParams.portalGroup != parameters.portalGroup && entityParams.portalIndex == parameters.portalIndex) {
                tileId = entity.tileId;
            }
        }
    });
    return tileId;
}

export function getOpenTilePosition(tileId: string, room: UfbRoom) : string {
    
    const desTile = room.state.map.tiles.get(tileId);

    if(desTile.walls[0] == EDGE_TYPE.BASIC) {   //TOP
        tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "top");
    } else if(desTile.walls[1] == EDGE_TYPE.BASIC) {   //RIGHT
        tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "right");
    } else if(desTile.walls[2] == EDGE_TYPE.BASIC) {   //DOWN
        tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "down");
    } else if(desTile.walls[3] == EDGE_TYPE.BASIC) {   //LEFT
        tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "left");
    }
    return tileId;
}

export function getDiceTypeFromStack(stackId: number) : number {
    if(stackId == STACKTYPE.Cure || stackId == STACKTYPE.Burn || stackId == STACKTYPE.Freeze || stackId == STACKTYPE.Charge){
        return DICE_TYPE.DICE_4;
    } else if(stackId == STACKTYPE.Void || stackId == STACKTYPE.Slow){
        return DICE_TYPE.DICE_6_4
    } else if(stackId == STACKTYPE.Pump){
        return DICE_TYPE.DICE_6
    }
    else{
        return DICE_TYPE.DICE_4;
    }
}

export function setQuestResult(questId: number, complete: number, character: CharacterState) {

    character.quests.forEach(q => {
        if(q.id == questId){
            q.complete += complete;
        }
    })

}

export function getCountFromItem(id: number, items: ArraySchema<Item>){
    let itemCount = 0;

    items.forEach(v => {
        if(v.id == id){
            itemCount = v.count;
        }
    })

    return itemCount;
}

export function getTotalGoldAtEnd(character: CharacterState){
    let gold = character.stats.coin;

    character.powers.forEach(p => {
        gold += p.sell;
    });
    character.items.forEach(i => {
        if(!(i.id == ITEMTYPE.MANA || i.id == ITEMTYPE.MELEE))
            gold += i.sell;
    });
    character.stacks.forEach(s => {
        gold += s.sell;
    })

    return gold;
}

export function AddUserData(type: number, character: CharacterState, amount: number){
    switch(type){
        case USER_DATA_TYPE.DAMAGE_DEAL:
            character.stats.damage_deal += Math.abs(amount);
            break;
        case USER_DATA_TYPE.DAMAGE_HEAL:
            character.stats.damage_heal += Math.abs(amount);
            break;
        case USER_DATA_TYPE.DAMAGE_TAKEN:
            character.stats.damage_taken += Math.abs(amount);
            break;
        case USER_DATA_TYPE.KILLS:
            character.stats.kills += Math.abs(amount);
            break;
        case USER_DATA_TYPE.TRAVELED_TILE:
            character.stats.traveled_tile += Math.abs(amount);
            break;
        case USER_DATA_TYPE.USED_ENERGY:
            character.stats.used_energy += Math.abs(amount);
            break;      
        case USER_DATA_TYPE.USED_STACK:
            character.stats.used_stack += Math.abs(amount);
            break;          
            default:
    }
}