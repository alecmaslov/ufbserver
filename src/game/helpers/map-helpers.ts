import { CharacterState, CoordinatesState } from "#game/schema/CharacterState";
import { AdjacencyListItemState, MapState, SpawnEntity, TileState } from "#game/schema/MapState";
import { SpawnEntityConfig } from "#game/types/map-types";
import { Coordinates, PathStep } from "#shared-types";
import { shuffleArray } from "#utils/collections";
import { ArraySchema, MapSchema } from "@colyseus/schema";
import { createId } from "@paralleldrive/cuid2";
import { SpawnZone, Tile } from "@prisma/client";
import { ok } from "assert";
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
    onMonsterSpawn: (spawnZone: SpawnZone) => void
) : ArraySchema<SpawnEntity> {
    const spawnEntities = new ArraySchema<SpawnEntity>();
    const seedIds = new Set(spawnZones.map((zone) => zone.seedId));
    const shuffledSeedIds = shuffleArray(Array.from(seedIds)) as number[];
    const takenIds = new Set<string>();

    const totalSpawnZones = spawnZones.length;
    if (config.chests < config.monsters) {
        throw new Error("not enough chests for monsters");
    }
    if (
        totalSpawnZones <
        config.chests + config.portals * 2 + config.merchants
    ) {
        throw new Error("config provided has too many spawn zones for map");
    }

    let numMonsters = 0;

    // spawn 16 chests
    for (let i = 0; i < config.chests - 1; i++) {
        const seedId = shuffledSeedIds.pop();

        const zones = spawnZones.filter((zone) => zone.seedId === seedId);
        if (zones.length < 2) {
            throw new Error(
                `expected 2 chest zones for seed id ${seedId}, got ${zones.length}`
            );
        }
        if (!zones.find((zone) => zone.type === "Chest")) {
            throw new Error(`expected 1 chest zone for seed id ${seedId}`);
        }
        if (!zones.find((zone) => zone.type === "Monster")) {
            throw new Error(`expected 1 monster zone for seed id ${seedId}`);
        }
        const isItemBag = Math.random() < 0.5? true: false;
        const chestZone = zones.find((zone) => zone.type === "Chest");
        const chestEntity = new SpawnEntity();
        chestEntity.id = chestZone.id;
        chestEntity.gameId = `chest_${i}`;
        chestEntity.prefabAddress = isItemBag? `${entitiesRootAddress}ItemBag` : `${entitiesRootAddress}chest`;
        chestEntity.tileId = chestZone.tileId;
        chestEntity.type = "Chest";
        chestEntity.parameters = `{"seedId" : "${chestZone.seedId}"}`;
        spawnEntities.push(chestEntity);

        takenIds.add(chestZone.id);

        if (numMonsters < config.monsters) {
            const monsterZone = zones.find((zone) => zone.type === "Monster");
            onMonsterSpawn(monsterZone); // allow caller to figure out how to spawn a new monster (which is a character)
            takenIds.add(monsterZone.id);
            numMonsters++;
        }
    }

    const remainingSpawnZones = spawnZones.filter(
        (zone) => !takenIds.has(zone.id) && zone.type === "Chest"
    );

    console.log(`Number of remaining spawn zones ${remainingSpawnZones.length}`);

    const shuffledZones = shuffleArray(remainingSpawnZones) as SpawnZone[];

    for (let i = 0; i < config.portals; i++) {
        // spawn 2 portals for each
        for (let j = 0; j < 2; j++) {
            const zone = shuffledZones.pop();

            const parameters: PortalEntityParameters = {
                seedId: zone.seedId,
                portalGroup: i,
                portalIndex: j,
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
    }

    for (let i = 0; i < config.merchants; i++) {
        const zone = shuffledZones.pop();

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
    }

    return spawnEntities;
}

export function spawnCharacter(
    characters: MapSchema<CharacterState>,
    sessionId: string,
    tile: Tile,
    characterClass: string,
    characterId?: string,
    playerId?: string,
    displayName?: string
) : CharacterState {
    const character = new CharacterState();
    const id = playerId || createId();
    character.id = id;
    character.sessionId = sessionId;
    character.characterClass = characterClass;
    character.characterId = characterId || createId();
    character.currentTileId = tile.id;

    if (displayName) {
        character.displayName = displayName;
    } else {
        let defaultName;
        if (!playerId) {
            defaultName = `NPC (${character.characterClass})`;
        } else {
            defaultName = `Player (${character.characterClass})`;
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
