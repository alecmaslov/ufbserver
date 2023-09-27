import { UfbMap, AdjacencyType, TileType } from "@prisma/client";
import db from "#db";
import { JsonArray } from "@prisma/client/runtime/library";
import { getAllMapFiles, getMap } from "#assets/maps";
import { createId } from "@paralleldrive/cuid2";
import { GameTile, TileSide, UFBMap } from "#game/schema/MapState";

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
            publisher: DEFAULT_MAP_PUBLISHER,
        },
    });

    return newMap.id;
}

function sidesToWallArray(sides: TileSide[]) {
    const wallArray = [0, 0, 0, 0];
    for (const side of sides) {
        switch (side.side) {
            case "top":
                wallArray[0] = 1;
                break;
            case "right":
                wallArray[1] = 1;
                break;
            case "bottom":
                wallArray[2] = 1;
                break;
            case "left":
                wallArray[3] = 1;
                break;
        }
    }
    return wallArray;
}

const capitalizeWord = (word: string) => {
    word = word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
};

async function uspertMapTransaction(map: UFBMap) {
    const mapId = await upsertMap(map);
    // Prepare tile data
    const tiles = map.tiles.map((tile: Partial<GameTile>) => {
        return {
            id: createId(),
            tileCode: tile.id,
            x: tile.coordinates.x,
            y: tile.coordinates.y,
            walls:
                tile.sides === undefined ? null : sidesToWallArray(tile.sides),
            type:
                tile.type === undefined
                    ? TileType.Default
                    : (tile.type as TileType),
            // mapId: mapId,
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
                type: capitalizeWord(adjacency.type) as AdjacencyType,
                energyCost: adjacency.energyCost,
            });
        }
    }

    const operations: any[] = [];

    // Insert tiles
    for (const tile of tiles) {
        operations.push(
            db.tile.create({
                data: {
                    ...tile,
                    map: {
                        connect: {
                            id: mapId,
                        },
                    },
                },
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
            console.log(`Inserted map: ${name}`);
        } catch (e) {
            console.error(e);
        }
    }
}

insertMaps();
