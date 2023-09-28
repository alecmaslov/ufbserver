import { ok } from "assert";
import {
    UFBMap,
    GameTile,
    TileType,
    SpawnEntity,
    TileEdge,
    TileColorCodes,
    TileColor,
    Coordinates,
    TileSide,
} from "./types/map";
import {
    readFileSync,
    writeFileSync,
    readdirSync,
    existsSync,
    mkdirSync,
} from "fs";

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
    console.log(`tileCode: ${tileCode}`);
    return tileTypes.get(tileCode[0]) || null;
};

const parseTileColor = (tileCode: string): TileColor | null => {
    const colorCode = tileCode[0];
    return TileColorCodes.get(colorCode) || null;
};

function parseTileSides(tileCode: string): TileSide[] {
    const sides: TileSide[] = [];
    if (tileCode[1] === "1") sides.push({ side: "top", edgeProperty: "wall" });
    if (tileCode[2] === "1")
        sides.push({ side: "right", edgeProperty: "wall" });
    if (tileCode[3] === "1")
        sides.push({ side: "bottom", edgeProperty: "wall" });
    if (tileCode[4] === "1") sides.push({ side: "left", edgeProperty: "wall" });
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

function parseBackgroundLayer(
    map: any,
    layer: any,
    allTiles: Map<string, Partial<GameTile>>,
    adjacencyList: Map<string, TileEdge[]>
) {
    const bridgeTiles: string[] = [];
    iterateTiles(
        layer,
        (tileCode: string, coordinates: Coordinates, id: string) => {
            const sides = parseTileSides(tileCode);
            const tile = allTiles.get(id);
            if (tile === undefined)
                throw new Error(`Failed to find tile ${id}.`);
            const tileType = parseTileType(tileCode);
            if (tileType !== null) {
                tile.type = tileType;
                // top, right, bottom, left
                if (tile.type === TileType.Bridge) {
                    bridgeTiles.push(id);
                }
            }
            const sideToIndex = {
                top: 0,
                right: 1,
                bottom: 2,
                left: 3,
            };
            const neighborCoords = [
                { x: coordinates.x, y: coordinates.y - 1 },
                { x: coordinates.x + 1, y: coordinates.y },
                { x: coordinates.x, y: coordinates.y + 1 },
                { x: coordinates.x - 1, y: coordinates.y },
            ];
            const edgeCost = [1, 1, 1, 1];
            for (let i = 0; i < sides.length; i++) {
                const { side, edgeProperty } = sides[i];
                const edgeIndex = sideToIndex[side];
                if (edgeProperty === "wall") edgeCost[edgeIndex] = NaN;
            }
            for (let i = 0; i < 4; i++) {
                const neighborId = coordToTileId(neighborCoords[i]);
                const neighborTile = allTiles.get(neighborId);
                if (neighborTile === undefined) {
                    continue;
                }
                if (adjacencyList.get(id) === undefined)
                    adjacencyList.set(id, []);
                const edge: TileEdge = {
                    from: id,
                    to: neighborId,
                    type: "basic",
                    energyCost: edgeCost[i],
                }; 
                adjacencyList.get(id)!.push(edge);
            }

            tile.spawnItems = [];

            var color = parseTileColor(tileCode);
            if (color === null) color = TileColorCodes.get("E")!;
            tile.color = color;
            tile.layerName = layer.name;
            tile.sides = sides;
            tile.legacyCode = tileCode;
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
            tile.spawnItems = [];
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

    // for(const key of adjacencyList.keys()) {
    //   console.log(key, adjacencyList.get(key));
    // }

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

function parseAllMaps(
    allMapsFile: string,
    outputRoot: string = "../Assets/Resources/Maps"
) {
    const inputFile = allMapsFile;
    console.log(`Parsing ${inputFile}`);
    const data = readFileSync(inputFile);
    const allMaps = JSON.parse(data.toString());

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

parseAllMaps("./data/maps/input/all-maps.json", "/home/km/ufbserver/data/maps");
