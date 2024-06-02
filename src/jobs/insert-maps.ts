import { getAllMapFiles, getMap } from "#assets/maps";
import db from "#db";
import { GameTile, TileSide, UFBMap } from "#game/types/map-types";
import { createId } from "@paralleldrive/cuid2";
import { TileType } from "@prisma/client";

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
        const wallValue = side.edgeProperty === "Wall" ? 1 : 0;
        switch (side.side) {
            case "Top":
                wallArray[0] = wallValue;
                break;
            case "Right":
                wallArray[1] = wallValue;
                break;
            case "Bottom":
                wallArray[2] = wallValue;
                break;
            case "Left":
                wallArray[3] = wallValue;
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

    // delete the map if it already exist
    await db.tile.deleteMany({
        where: {
            mapId: mapId,
        },
    });
    console.log("deleted origin map data.");
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
                    ? TileType.OpenTile
                    : (tile.type as TileType),
            mapId: mapId,
        };
    });

    console.log("init tiles data.");

    // Map of tileCode to generated ID
    const tileIdMap: Record<string, string> = {};
    tiles.forEach((tile) => {
        tileIdMap[tile.tileCode] = tile.id;
    });

    const tilesWithSpawns = map.tiles.filter((tile) => tile.spawnZone);
    const spawnZones = tilesWithSpawns.map((tile: Partial<GameTile>) => {
        return {
            type: tile.spawnZone?.type,
            seedId: tile.spawnZone?.seedId,
            tileId: tileIdMap[tile.id],
        };
    });

    // Prepare adjacency data
    const adjacencies: any[] = [];
    for (const tileCode in map.adjacencyList) {
        const tileAdjacencies = map.adjacencyList[tileCode];
        for (const adjacency of tileAdjacencies) {
            adjacencies.push({
                fromId: tileIdMap[adjacency.from],
                toId: tileIdMap[adjacency.to],
                type: adjacency.type,
                energyCost: adjacency.energyCost,
            });
        }
    }

    const operations: any[] = [];

    for (const tile of tiles) {
        operations.push(
            db.tile.create({
                data: {
                    ...tile,
                },
            })
        );
    }

    for (const adjacency of adjacencies) {
        operations.push(
            db.tileAdjacency.create({
                data: adjacency,
            })
        );
    }

    for (const spawnZone of spawnZones) {
        operations.push(
            db.spawnZone.create({
                data: {
                    ...spawnZone,
                },
            })
        );
    }
    console.log("db run.");

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
