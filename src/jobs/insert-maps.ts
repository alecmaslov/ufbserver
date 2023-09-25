import { UfbMap, AdjacencyType, TileType } from "@prisma/client";
import db from "#db";
import { JsonArray } from "@prisma/client/runtime/library";
import { getAllMapFiles, getMap } from "#assets/maps";
import { createId } from "@paralleldrive/cuid2";
import { GameTile, UFBMap } from "#game/schema/MapState";

const DEFAULT_MAP_PUBLISHER = "ufb";

async function upsertMap(mapData: UFBMap): Promise<string> {
    const existingMap = await db.ufbMap.findFirst({
        where: {
            name: mapData.name,
        },
    });

    if (existingMap) {
        return existingMap.id;
    }

    const newMap = await db.ufbMap.create({
        data: {
            name: mapData.name,
            resourceAddress: `maps/${mapData.name}`,
            gridWidth: mapData.gridWidth,
            gridHeight: mapData.gridHeight,
            publisher: DEFAULT_MAP_PUBLISHER
        },
    });

    return newMap.id;
}

async function uspertMapTransaction(map: UFBMap) {
    const mapId = await upsertMap(map);
    // Prepare tile data
    const tiles = map.tiles.map((tile: Partial<GameTile>) => {
        return {
            id: createId(),
            tileCode: tile.id,
            x: tile.coordinates.x,
            y: tile.coordinates.y,
            type: tile.type as TileType,
            mapId: mapId,
        };
    });

    // Map of tileCode to generated ID
    const tileIdMap: Record<string, string> = {};
    tiles.forEach((tile) => {
        tileIdMap[tile.tileCode] = tile.id;
    });

    // Prepare adjacency data
    const adjacencies: any[] = [];
    for (const tileCode in map.adjacencyList) {
        const tileAdjacencies = map.adjacencyList[tileCode];
        for (const adjacency of tileAdjacencies) {
            adjacencies.push({
                fromId: tileIdMap[adjacency.from],
                toId: tileIdMap[adjacency.to],
                type: adjacency.type.toUpperCase() as AdjacencyType,
                energyCost: adjacency.energyCost,
            });
        }
    }

    const operations: any[] = [];

    // Insert tiles
    for (const tile of tiles) {
        operations.push(
            db.tile.create({
                data: tile,
            })
        );
    }

    // Insert adjacencies
    for (const adjacency of adjacencies) {
        operations.push(
            db.tileAdjacency.create({
                data: adjacency,
            })
        );
    }

    await db.$transaction(operations);
}

async function insertMaps() {
    const allMaps = getAllMapFiles();

    for (const { name } of allMaps) {
        const map = getMap(name);
        try {
            await uspertMapTransaction(map);
            console.log(`Inserted map: ${name}`)
        } catch (e) {
            console.error(e);
        }
    }
}

insertMaps();