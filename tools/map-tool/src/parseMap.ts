import { ok } from "assert";
import {
    UFBMap,
    GameTile,
    TileType,
    SpawnZone,
    TileEdge,
    TileColorCodes,
    TileColor,
    Coordinates,
    TileSide,
    EdgeType,
    TileSideOrientation,
    tileSideToIndex,
    tileIndexToSide,
} from "./types/map";
import {
    readFileSync,
    writeFileSync,
    readdirSync,
    existsSync,
    mkdirSync,
} from "fs";
import { parseArgs } from "node:util";

const COLOR_CODES = [
    "E",
    "R",
    "G",
    "T",
    "N",
    "S",
    "Y",
    "I",
    "A",
    "P",
    "Q",
    "O",
    "L",
    "K",
];

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

const coordToTileId = (coordinates: Coordinates): string => {
    return `tile_${TILE_LETTERS[coordinates.x]}_${coordinates.y + 1}`;
};

const tileIdToCoord = (tileId: string): Coordinates => {
    const parts = tileId.split("_");
    const x = TILE_LETTERS.indexOf(parts[1]);
    const y = parseInt(parts[2]) - 1;
    const c = { x, y };
    ok(coordToTileId(c) === tileId);
    return c;
};

const tileTypes = new Map<string, TileType>([
    ["B", TileType.Bridge],
    ["F", TileType.Floor],
    ["V", TileType.Void],
    ["C", TileType.Chest],
    ["M", TileType.Enemy],
    ["P", TileType.Portal],
]);

// @kyle - type void error originates here
const parseTileType = (tileCode: string): TileType | null => {
    return tileTypes.get(tileCode[0]) || null;
};

const parseTileColor = (tileCode: string): TileColor | null => {
    const colorCode = tileCode[0];
    return TileColorCodes.get(colorCode) || null;
};

function parseTileSides(tileCode: string): TileSide[] {
    const sides: TileSide[] = [
        { side: "Top", edgeProperty: tileCode[1] === "1" ? "Wall" : "Basic" },
        { side: "Right", edgeProperty: tileCode[2] === "1" ? "Wall" : "Basic" },
        {
            side: "Bottom",
            edgeProperty: tileCode[3] === "1" ? "Wall" : "Basic",
        },
        { side: "Left", edgeProperty: tileCode[4] === "1" ? "Wall" : "Basic" },
    ];
    return sides;
}

function iterateTiles(
    layer: any,
    callback: (tile: any, coordinates: Coordinates, id: string) => void
) {
    layer.tiles.forEach((row: string[], rowIndex: number) => {
        row.forEach((tileCode: string, columnIndex: number) => {
            const coordinates: Coordinates = {
                x: columnIndex,
                y: rowIndex,
            };
            const id = coordToTileId(coordinates);
            callback(tileCode, coordinates, id);
        });
    });
}

function initializeTiles(dimensions: number): Map<string, Partial<GameTile>> {
    const allTiles: Map<string, Partial<GameTile>> = new Map();
    for (let i = 0; i < dimensions; i++) {
        for (let j = 0; j < dimensions; j++) {
            const coordinates: Coordinates = {
                x: j,
                y: i,
            };
            const id = coordToTileId(coordinates);
            allTiles.set(id, {
                id,
                coordinates,
            });
        }
    }
    return allTiles;
}

// const sideToIndex = {
//     Top: 0,
//     Right: 1,
//     Bottom: 2,
//     Left: 3,
// };

// 27x27 grid
interface Wall {
    coordinates: Coordinates;
}

function parseBackgroundLayer(
    map: any,
    layer: any,
    allTiles: Map<string, Partial<GameTile>>,
    adjacencyList: Map<string, TileEdge[]>
) {
    const walls = new Map<string, Coordinates>();

    function getNeighbor(coordinates: Coordinates, side: TileSideOrientation) {
        switch (side) {
            case "Top":
                return allTiles.get(
                    coordToTileId({
                        x: coordinates.x,
                        y: coordinates.y - 1,
                    })
                );
            case "Right":
                return allTiles.get(
                    coordToTileId({
                        x: coordinates.x + 1,
                        y: coordinates.y,
                    })
                );
            case "Bottom":
                return allTiles.get(
                    coordToTileId({
                        x: coordinates.x,
                        y: coordinates.y + 1,
                    })
                );
            case "Left":
                return allTiles.get(
                    coordToTileId({
                        x: coordinates.x - 1,
                        y: coordinates.y,
                    })
                );
            default:
                throw new Error(`Unknown side: ${side}`);
        }
    }

    const bridgeTiles: string[] = [];
    iterateTiles(
        layer,
        (tileCode: string, coordinates: Coordinates, id: string) => {
            const currentTile = allTiles.get(id);
            if (currentTile === undefined)
                throw new Error(`Failed to find tile ${id}.`);
            const tileType = parseTileType(tileCode);
            if (tileType !== null) {
                currentTile.type = tileType;
                // top, right, bottom, left
                if (currentTile.type === TileType.Bridge) {
                    bridgeTiles.push(id);
                }
            }
            const sides = parseTileSides(tileCode);

            for (const side of sides) {
                if (side.edgeProperty !== "Wall") continue;
                const neighborTile = getNeighbor(coordinates, side.side);
                const wallId = [id, neighborTile?.id].sort().join("-");
                if (walls.has(wallId)) continue;
                walls.set(wallId, coordinates);
            }

            var color = parseTileColor(tileCode);
            if (color === null) color = TileColorCodes.get("E")!;
            currentTile.color = color;
            currentTile.layerName = layer.name;
            currentTile.sides = sides;
            currentTile.legacyCode = tileCode;
        }
    );

    // now that all tiles have info, go back and get the edges
    iterateTiles(
        layer,
        (tileCode: string, coordinates: Coordinates, id: string) => {
            const currentTile = allTiles.get(id) as GameTile;
            if (currentTile === undefined)
                throw new Error(`Failed to find tile ${id}.`);

            if (currentTile.type === TileType.Bridge) {
                // find the 2 sides with walls, then make an edge between them
                const wallSides = currentTile.sides.filter(
                    (side) => side.edgeProperty === "Wall"
                );
                if (wallSides.length !== 2) {
                    throw new Error(
                        `Bridge tile ${id} has ${wallSides.length} walls.`
                    );
                }

                if (adjacencyList.get(id) === undefined)
                    adjacencyList.set(id, []);

                const overEdge: TileEdge = {
                    from: getNeighbor(coordinates, wallSides[0].side)!.id!,
                    to: getNeighbor(coordinates, wallSides[1].side)!.id!,
                    type: "OverBridge",
                    energyCost: 1,
                };
                adjacencyList.get(id)!.push(overEdge);

                const underneathSides = currentTile.sides.filter(
                    (side) => side.edgeProperty !== "Wall"
                );

                if (underneathSides.length !== 2) {
                    throw new Error(
                        `Bridge tile ${id} has ${underneathSides.length} underneath sides.`
                    );
                }

                let toTile1 = getNeighbor(coordinates, underneathSides[0].side);
                let toTile2 = getNeighbor(coordinates, underneathSides[1].side);

                if (toTile1 !== undefined) {
                    adjacencyList.get(id)!.push({
                        from: currentTile.id!,
                        to: getNeighbor(coordinates, underneathSides[0].side)!
                            .id!,
                        type: "UnderBridge",
                        energyCost: 1,
                    });
                }

                if (toTile2 !== undefined) {
                    adjacencyList.get(id)!.push({
                        from: currentTile.id!,
                        to: getNeighbor(coordinates, underneathSides[1].side)!
                            .id!,
                        type: "UnderBridge",
                        energyCost: 1,
                    });
                }
            } else {
                for (const side of currentTile.sides) {
                    const neighborTile = getNeighbor(coordinates, side.side);
                    if (neighborTile === undefined) continue;
                    if (adjacencyList.get(id) === undefined)
                        adjacencyList.set(id, []);

                    let edgeType: EdgeType = "Basic";
                    let energyCost = 1;

                    if (side.edgeProperty === "Wall") {
                        edgeType = "Wall";
                        energyCost = NaN;
                    } else {
                        // make sure it isn't actually an over bridge
                        const id = [currentTile.id, neighborTile.id]
                            .sort()
                            .join("-");
                        if (walls.has(id)) {
                            // in this case, this is an over bridge, so we want to ignore it
                            // since it has already been added to the node list
                            const neighborBridge =
                                neighborTile.type === TileType.Bridge;
                            console.log(
                                `Wall between ${currentTile.id} and ${neighborTile.id} | neighborBridge: ${neighborBridge}`
                            );
                            edgeType = "Wall";
                            energyCost = NaN;
                            continue;
                        }
                        switch (neighborTile.type) {
                            case TileType.Bridge:
                                // now we need to figure out
                                // how the walls are positioned
                                edgeType = "UnderBridge";
                                energyCost = 1;
                                break;
                            case TileType.Void:
                                edgeType = "Void";
                                energyCost = NaN;
                                break;
                            default:
                                edgeType = "Basic";
                                energyCost = 1;
                                break;
                        }
                    }

                    const edge: TileEdge = {
                        from: id,
                        to: coordToTileId(neighborTile.coordinates!),
                        type: edgeType, //@change
                        energyCost: energyCost,
                    };
                    adjacencyList.get(id)!.push(edge);
                }
            }
        }
    );

    // fix edges for bridge tiles
    // edges from the left to a bridge tile should be modified to point to the right of the bridge
    // (and vice versa, same for top/bottom)
    // for (const bridgeTileId of bridgeTiles) {
    //   const bridgeCoord = tileIdToCoord(bridgeTileId);
    //   adjacencyList.forEach((edges) => {
    //     edges.forEach(edge => {
    //       const fromCoord = tileIdToCoord(edge.from);
    //       const toCoord = tileIdToCoord(edge.to);
    //       if (bridgeTileId === edge.to) {
    //         edge.energyCost = 2;
    //         // Left of bridge pointing to the right
    //         if (fromCoord.x < bridgeCoord.x && fromCoord.y === bridgeCoord.y) {
    //           edge.to = coordToTileId({ x: toCoord.x + 1, y: toCoord.y });
    //         }
    //         // Right of bridge pointing to the left
    //         else if (fromCoord.x > bridgeCoord.x && fromCoord.y === bridgeCoord.y) {
    //           edge.to = coordToTileId({ x: toCoord.x - 1, y: toCoord.y });
    //         }
    //         // Above bridge pointing to the bottom
    //         else if (fromCoord.x === bridgeCoord.x && fromCoord.y < bridgeCoord.y) {
    //           const c = { x: toCoord.x, y: toCoord.y + 1 };
    //           edge.to = coordToTileId(c);
    //         }
    //         // Below bridge pointing to the top
    //         else if (fromCoord.x === bridgeCoord.x && fromCoord.y > bridgeCoord.y) {
    //           const c = { x: toCoord.x, y: toCoord.y - 1 };
    //           edge.to = coordToTileId(c);
    //         }
    //       }
    //     });
    //   });
    // }
}

function parseSpawnLayer(layer: any, allTiles: Map<string, Partial<GameTile>>) {
    iterateTiles(
        layer,
        (tileCode: string, coordinates: Coordinates, id: string) => {
            const tile = allTiles.get(id);
            if (tile === undefined) throw new Error("Failed to find tile.");
            // tile.spawnZone = [];
            if (tileCode === "0") {
                return;
            }

            const letterCode = tileCode[0];
            const seedId = parseInt(tileCode.slice(1));
            if (isNaN(seedId)) {
                console.log(`Failed to parse seedId from ${tileCode}`);
                return;
            }

            let type = null;
            switch (letterCode) {
                case "M":
                    type = "Monster";
                    break;
                case "C":
                    type = "Chest";
                    break;
                default:
                    throw new Error(`Unknown spawn zone type: ${letterCode}`);
            }

            tile.spawnZone = {
                type: type as any,
                seedId,
            };
        }
    );
}

export function parseUFBMap(map: any): UFBMap {
    const width = map.layers[0].tiles[0].length;
    const tiles = initializeTiles(width);

    const backgroundLayer = map.layers.find(
        (layer: any) => layer.name === "Background"
    );
    if (backgroundLayer === undefined)
        throw new Error("Failed to find background layer.");
    const adjacencyList: Map<string, TileEdge[]> = new Map();
    parseBackgroundLayer(map, backgroundLayer, tiles, adjacencyList);

    const spawnLayer = map.layers.find(
        (layer: any) => layer.name === "Spawnzones"
    );
    if (spawnLayer === undefined)
        throw new Error("Failed to find spawn layer.");
    parseSpawnLayer(spawnLayer, tiles);

    const ufbMap: UFBMap = {
        name: map.name,
        // TODO - compute gridWidth and gridHeight from the map
        gridWidth: 26,
        gridHeight: 26,
        defaultCards: map.defaultCards,
        tiles: Array.from(tiles.values()),
        adjacencyList,
    };

    return ufbMap;
}

/** Parses the map from the old UFB format to the new JSON format */
export function parseOldFormatMaps(
    allMapsFile: string,
    outputRoot: string = "../Assets/Resources/Maps"
) {
    const inputFile = allMapsFile;
    console.log(`Parsing ${inputFile}`);
    const data = readFileSync(inputFile);
    let allMaps = JSON.parse(data.toString());

    // check if the type of allMaps is a list
    if (!Array.isArray(allMaps)) {
        allMaps = [allMaps];
    }

    // allMaps = allMaps.filter((map: any) => map.name == "kraken");
    for (const map of allMaps) {
        const parsed = parseUFBMap(map);
        console.log(
            `Writing ${parsed.name} to ${outputRoot}/${parsed.name}/map.json`
        );
        if (!existsSync(`${outputRoot}/${parsed.name}`))
            mkdirSync(`${outputRoot}/${parsed.name}`, { recursive: true });
        const outputFile = `${outputRoot}/${parsed.name}/map.json`;
        (parsed as any).adjacencyList = Object.fromEntries(
            parsed.adjacencyList
        );
        console.log(`Writing ${parsed}`);
        writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
    }

    const mapNames = allMaps.map((map: any) => map.name);
    const mapInfo = mapNames.map((name: string) => {
        return {
            name,
            path: `Maps/${name}/map`,
        };
    });

    writeFileSync(
        `${outputRoot}/mapInfo.json`,
        JSON.stringify(mapInfo, null, 2)
    );
}

function parseDirectory(mapDir: string) {
    const allFiles = readdirSync(mapDir);
    allFiles.forEach((file: string) => {
        if (!file.endsWith(".json")) return;
        const inputFile = `${mapDir}/${file}`;
        console.log(`Parsing ${inputFile}`);
        const data = readFileSync(inputFile);
        const originalMap = JSON.parse(data.toString());
        if (originalMap === undefined)
            throw new Error("Failed to parse map file.");
        let mapName = inputFile.split("/").pop();
        if (mapName === undefined) throw new Error("Failed to parse map name.");
        mapName = mapName.split(".")[0];
        mapName = mapName.replace("_", "");
        originalMap.name = mapName;
        const parsed = parseUFBMap(originalMap);
        const outputFile: string = `./data/maps/output/${mapName}.json`;
        writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
    });
    console.log("Done.");
}







// parseAllMaps("./data/maps/input/all-maps.json", "/home/km/ufbserver/tools/map-tool/data/maps/output");
