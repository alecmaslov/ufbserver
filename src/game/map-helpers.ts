import { ok } from "assert";
import { Node } from "ngraph.graph";
import { MapSchema, ArraySchema } from "@colyseus/schema";
import { CharacterState, CoordinatesState } from "./schema/CharacterState";
import { AdjacencyListItemState } from "./schema/MapState";
import { Coordinates, PathStep } from "#shared-types";
import { MapState, SpawnEntity } from "./schema/MapState";
import { SpawnZone, Tile } from "@prisma/client";
import { shuffleArray } from "#utils/collections";
import { createId } from "@paralleldrive/cuid2";
import { SpawnEntityConfig } from "#game/types/map-types";
import e from "express";

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

export const coordToGameId = (
    coordinates: CoordinatesState | Coordinates
): string => {
    return `tile_${TILE_LETTERS[coordinates.x]}_${coordinates.y + 1}`;
};

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



export function initializeSpawnEntities(
    spawnZones: SpawnZone[],
    config: SpawnEntityConfig,
    onMonsterSpawn: (spawnZone: SpawnZone) => void
) {
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
        if (zones.length !== 2) {
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

        const chestZone = zones.find((zone) => zone.type === "Chest");
        const chestEntity = new SpawnEntity();
        chestEntity.id = chestZone.id;
        chestEntity.gameId = `chest_${i}`;
        chestEntity.prefabAddress = "prefabs/chest";
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
        (zone) => !takenIds.has(zone.id)
    );

    const shuffledZones = shuffleArray(remainingSpawnZones) as SpawnZone[];

    for (let i = 0; i < config.portals; i++) {
        // spawn 2 portals for each
        for (let j = 0; j < 2; j++) {
            const zone = shuffledZones.pop();
            const portalEntity = new SpawnEntity();
            portalEntity.id = zone.id;
            portalEntity.gameId = `portal_${i}`;
            portalEntity.prefabAddress = "prefabs/portal";
            portalEntity.tileId = zone.tileId;
            portalEntity.type = "Portal";
            portalEntity.parameters = `{"seedId" : "${zone.seedId}", "portalGroup" : "${i}", "portalIndex" : "${j}"}`;
            spawnEntities.push(portalEntity);
        }
    }

    for (let i = 0; i < config.merchants; i++) {
        const zone = shuffledZones.pop();
        const merchantEntity = new SpawnEntity();
        merchantEntity.id = zone.id;
        merchantEntity.gameId = `merchant_${i}`;
        merchantEntity.prefabAddress = "prefabs/merchant";
        merchantEntity.tileId = zone.tileId;
        merchantEntity.type = "Merchant";
        merchantEntity.parameters = `{"seedId" : "${zone.seedId}", "merchantIndex" : "${i}", "merchantName" : "Merchant ${i}", "inventory" : []}`;
        spawnEntities.push(merchantEntity);
    }
}

export function spawnCharacter(
    characters: MapSchema<CharacterState>,
    sessionId: string,
    tile: Tile,
    characterClass: string,
    characterId?: string,
    playerId?: string,
    displayName?: string
) {
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
}
