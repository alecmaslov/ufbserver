import { BAN_STACKS, DICE_TYPE, EDGE_TYPE, END_TYPE, ITEMDETAIL, ITEMTYPE, MONSTER_TYPE, MONSTERS, PERKTYPE, POWERCOSTS, powermoves, powers, POWERTYPE, stacks, STACKTYPE, USER_TYPE, WALL_DIRECT } from "#assets/resources";
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
    // for (let i = 1; i < p.length; i++) {
    //     const from = p[i - 1].id as string;
    //     const to = p[i].id as string;
    //     const edgeCollection = adjacencyList.get(from);
    //     if (!edgeCollection) {
    //         throw new Error(`no adjacency list for ${from}`);
    //     }
    //     let edge: { energyCost: number } | undefined;
    //     for (const e of edgeCollection.edges) {
    //         if (e.to === to) {
    //             edge = e;
    //             break;
    //         }
    //     }
    //     // console.log(`edge from ${from} to ${to} is ${JSON.stringify(edge)}`);
    //     if (!edge) {
    //         throw new Error(`no edge from ${from} to ${to}`);
    //     }
    //     cost += edge.energyCost;
    // }
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

    addItemToCharacter(ITEMTYPE.MANA, character.stats.maxMana, character);
    addItemToCharacter(ITEMTYPE.MELEE, character.stats.maxMelee, character);

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

    character.displayName = `<color="red"><size=50%>MONSTER</size></color>
${MONSTERS[monsterType].name}`;

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
        };
        if(extraItemId > 0) {

            powermove.costList.push({
                id: extraItemId,
                count: 1
            })

            powermove.result.health = !!powermove.result.health? powermove.result.health : 0;
            powermove.result.energy = !!powermove.result.energy? powermove.result.energy : 0;
            powermove.result.ultimate = !!powermove.result.ultimate? powermove.result.ultimate : 0;
            powermove.result.stacks = !!powermove.result.stacks? [...powermove.result.stacks] : [];

            if(extraItemId == ITEMTYPE.ARROW) {
                powermove.result.health -= 2;
            } else if(extraItemId == ITEMTYPE.BOMB_ARROW) {
                powermove.result.health -= 6;
                if(!!powermove.result.perkId) {
                    powermove.result.perkId1 = PERKTYPE.Pull;
                } else {
                    powermove.result.perkId = PERKTYPE.Pull;
                }
            } else if(extraItemId == ITEMTYPE.FIRE_ARROW) {
                powermove.result.health -= 3;
                powermove.result.stacks.push({
                    id: STACKTYPE.Burn,
                    count: 1
                });
            } else if(extraItemId == ITEMTYPE.ICE_ARROW) {
                powermove.result.ultimate -= 3;
                powermove.result.energy -= 3;
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
                    powermove.result.perkId = PERKTYPE.Pull;
                } else if(arrowId == ITEMTYPE.FIRE_ARROW) {
                    powermove.result.health = -3;
                    powermove.result.stacks = [{
                        id: STACKTYPE.Burn,
                        count: 1
                    }];
                } else if(arrowId == ITEMTYPE.ICE_ARROW) {
                    powermove.result.ultimate = -3;
                    powermove.result.energy = -3;
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

export function addItemToCharacter(id: number, count : number, state: CharacterState) {
    const {arrow, bomb, mana, melee} = getArrowBombCount(state);

    const data = GetRealItemIdByDouble(id);

    id = data.id;
    count = data.count * count;

    // AUTOMATICALLY SELL ARROW BOMB ITEM BEGIN
    if(IsArrowItem(id) && arrow < state.stats.arrowLimit) {
        const addedCount = Math.min(state.stats.arrowLimit - arrow, count);
        const shopCount = count - addedCount;
        state.stats.coin += ITEMDETAIL[id].sell * shopCount;
        count = addedCount;
    } else if(IsBombItem(id) && bomb < state.stats.bombLimit) {
        const addedCount = Math.min(state.stats.bombLimit - bomb, count);
        const shopCount = count - addedCount;
        state.stats.coin += ITEMDETAIL[id].sell * shopCount;
        count = addedCount;
    }

    // AUTOMATICALLY SELL ARROW BOMB ITEM END

    if(count == 0) return;

    const it = state.items.find(ii => ii.id == id);

    if(id == ITEMTYPE.MANA) {
        const maxMana = state.stats.maxMana;
        let addedCount = Math.max(0, mana + count - maxMana);
        if(addedCount == count) {
            state.stats.maxMana += addedCount;
        } else {
            count -= addedCount;
        }
        
    } else if(id == ITEMTYPE.MELEE) {
        const maxMelee = state.stats.maxMelee;
        let addedCount = Math.max(0, melee + count - maxMelee);
        if(addedCount == count) {
            state.stats.maxMelee += addedCount;
        } else {
            count -= addedCount;
        }
    }

    if(it != null) {
        it.count += count;
    } else {
        console.log("add new item: ", id, count, ITEMDETAIL[id])
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
    const stack : Item = state.stacks.find(stack => stack.id == id);
    console.log("add stack: ", stack);
    // ADD BAN STACK LOGIC
    if(!!BAN_STACKS[id]) {
        const banStack = state.stacks.find(st => st.id == BAN_STACKS[id]);
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
        newPower.count = count;
        newPower.description = "";
        newPower.level = powers[id].level;
        newPower.cost = POWERCOSTS[powers[id].level].cost;
        newPower.sell = POWERCOSTS[powers[id].level].sell;

        state.powers.push(newPower);
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
    if(xDir >= 1) {
        return {
            wallType: enemyTile.walls[WALL_DIRECT.RIGHT],
            desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
            desCoodinate: desCoodinate
        };
    } else if(xDir <= -1) {
        return {
            wallType: enemyTile.walls[WALL_DIRECT.LEFT],
            desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
            desCoodinate: desCoodinate
        };
    } else if(yDir >= 1) {
        return {
            wallType: enemyTile.walls[WALL_DIRECT.TOP],
            desTileId: coordToTileId(room.state.map.tiles, desCoodinate),
            desCoodinate: desCoodinate
        };
    } else if(yDir <= -1) {
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
        character.stats.health.add(amount);
        if(amount < 0) {
            character.stats.ultimate.add(2 * Math.abs(amount));
        }

        if(character.stats.health.current == 0) {
            if(character.type == USER_TYPE.MONSTER) {
                room.broadcast(SERVER_TO_CLIENT_MESSAGE.DEAD_MONSTER, {characterId : character.id});                
                room.RespawnMonster();

            } else if(character.type == USER_TYPE.USER) {
                if(!!character.stacks[STACKTYPE.Revive] && character.stacks[STACKTYPE.Revive].count > 0) {
                    character.stacks[STACKTYPE.Revive].count--;
                    character.stats.health.add(1);
                    character.stats.isRevive = true;
                    if(client == null) {
                        room.broadcast(SERVER_TO_CLIENT_MESSAGE.STACK_REVIVE_ACTIVE, {
                            characterId: character.id,
                            endType : END_TYPE.DEFEAT
                        })
                    } else {
                        client.send(SERVER_TO_CLIENT_MESSAGE.STACK_REVIVE_ACTIVE, {
                            characterId: character.id,
                            endType : END_TYPE.DEFEAT
                        })
                    }
                    return;
                } else {
                    let aliveCount = 0;
                    room.state.characters.forEach(p => {
                        if(p.type == USER_TYPE.USER && p.stats.health.current > 0) {
                            aliveCount++;
                        }
                    })

                    if(client == null) {
                        room.broadcast(SERVER_TO_CLIENT_MESSAGE.GAME_END_STATUS, {
                            characterId: character.id,
                            endType : END_TYPE.DEFEAT
                        })
                    } else {
                        client.send(SERVER_TO_CLIENT_MESSAGE.GAME_END_STATUS, {
                            characterId: character.id,
                            endType : END_TYPE.DEFEAT
                        })
                    }

                    if(aliveCount == 0) {
                        room.StopAIChecking();
                    }

                }
            }
        }

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

export function IsEnemyAdjacent(character: CharacterState, enemy : CharacterState, room : UfbRoom) {
    const currentTile = room.state.map.tiles.get(character.currentTileId);
    const enemyTile = room.state.map.tiles.get(enemy.currentTileId);
    const r = Math.abs(enemyTile.coordinates.x - currentTile.coordinates.x) + Math.abs(enemyTile.coordinates.y - currentTile.coordinates.y);
    return r == 1;
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
    console.log("near : ", id)
    if(id != "") {
        const directs = ['top', 'down', 'left', 'right'];
        const dirt = directs[Math.ceil(Math.random() * 100) % directs.length];
        const tile = room.state.map.tiles.get(room.state.characters.get(id).currentTileId);
        console.log("near : ", dirt, tile.coordinates.x, room.state.characters.get(id).currentTileId, dirt)
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
    let tileId = "";

    // const parameters: PortalEntityParameters = {
    //     seedId: zone.seedId,
    //     portalGroup: i,
    //     portalIndex: n % 2,
    // };

    const parameters: PortalEntityParameters = JSON.parse(data.parameters);

    room.state.map.spawnEntities.forEach(entity => {
        if(entity.type == "Portal") {
            const entityParams: PortalEntityParameters = JSON.parse(entity.parameters);

            console.log("entityParams: ", tileId, entity.parameters, entityParams);


            if(entityParams.portalGroup != parameters.portalGroup && entityParams.portalIndex == parameters.portalIndex) {
                tileId = entity.tileId;
            }
        }
    });

    console.log("desTile: ", tileId, data.parameters, parameters);

    if(tileId != "") {
        const desTile = room.state.map.tiles.get(tileId);
        console.log("desTile data: ", desTile);

        if(desTile.walls[0] == EDGE_TYPE.BASIC) {   //TOP
            tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "top");
        } else if(desTile.walls[1] == EDGE_TYPE.BASIC) {   //RIGHT
            tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "right");
        } else if(desTile.walls[2] == EDGE_TYPE.BASIC) {   //DOWN
            tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "down");
        } else if(desTile.walls[3] == EDGE_TYPE.BASIC) {   //LEFT
            tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "left");
        }
    }
    return tileId;
}