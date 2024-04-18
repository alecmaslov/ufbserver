import { readFileSync, writeFileSync } from "node:fs";
import type { TileSide } from "./types/map";

type TileType =
    | "VerticalBridge"
    | "HorizontalBridge"
    | "DoubleBridge"
    | "Void"
    | "StairsNS"
    | "StairsSN"
    | "StairsEW"
    | "StairsWE"
    | "Upper"
    | "Lower"
    | "OpenTile"
    | "BlockNorth"
    | "BlockEast"
    | "BlockSouth"
    | "BlockWest"
    | "BlockNS"
    | "BlockEW"
    | "BlockNE"
    | "BlockES"
    | "BlockSW"
    | "BlockNW"
    | "BlockESW"
    | "BlockSWN"
    | "BlockWNE"
    | "BlockNES";


const TileTypeRecord: { [key: string]: TileType } = {
    A: "VerticalBridge",
    B: "HorizontalBridge",
    C: "DoubleBridge",
    D: "Void",
    E: "StairsNS",
    F: "StairsSN",
    G: "StairsEW",
    H: "StairsWE",
    I: "Upper",
    J: "Lower",
};

type BlockPath =
    | "None"
    | "North"
    | "East"
    | "South"
    | "West"
    | "NorthSouth"
    | "EastWest"
    | "NorthEast"
    | "EastSouth"
    | "SouthWest"
    | "NorthWest"
    | "EastSouthWest"
    | "SouthWestNorth"
    | "WestNorthEast"
    | "NorthEastSouth";

// Define the block path record with mappings from single-letter codes to block path names
const BlockPathRecord: { [key: string]: BlockPath } = {
    K: "None",
    L: "North",
    M: "East",
    N: "South",
    O: "West",
    P: "NorthSouth",
    Q: "EastWest",
    R: "NorthEast",
    S: "EastSouth",
    T: "SouthWest",
    U: "NorthWest",
    V: "EastSouthWest",
    W: "SouthWestNorth",
    X: "WestNorthEast",
    Y: "NorthEastSouth",
};

const BlockedPathToSides: { [key in BlockPath]: TileSide[] } = {
    None: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    North: [
        { side: "Top", edgeProperty: "Wall" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    East: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Wall" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    South: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Wall" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    West: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Wall" },
    ],
    NorthSouth: [
        { side: "Top", edgeProperty: "Wall" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Wall" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    EastWest: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Wall" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Wall" },
    ],
    NorthEast: [
        { side: "Top", edgeProperty: "Wall" },
        { side: "Right", edgeProperty: "Wall" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    EastSouth: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Wall" },
        { side: "Bottom", edgeProperty: "Wall" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    SouthWest: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Wall" },
        { side: "Left", edgeProperty: "Wall" },
    ],
    NorthWest: [
        { side: "Top", edgeProperty: "Wall" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Wall" },
    ],
    EastSouthWest: [
        { side: "Top", edgeProperty: "Basic" },
        { side: "Right", edgeProperty: "Wall" },
        { side: "Bottom", edgeProperty: "Wall" },
        { side: "Left", edgeProperty: "Wall" },
    ],
    SouthWestNorth: [
        { side: "Top", edgeProperty: "Wall" },
        { side: "Right", edgeProperty: "Wall" },
        { side: "Bottom", edgeProperty: "Wall" },
        { side: "Left", edgeProperty: "Basic" },
    ],
    WestNorthEast: [
        { side: "Top", edgeProperty: "Wall" },
        { side: "Right", edgeProperty: "Wall" },
        { side: "Bottom", edgeProperty: "Basic" },
        { side: "Left", edgeProperty: "Wall" },
    ],
    NorthEastSouth: [
        { side: "Top", edgeProperty: "Wall" },
        { side: "Right", edgeProperty: "Basic" },
        { side: "Bottom", edgeProperty: "Wall" },
        { side: "Left", edgeProperty: "Wall" },
    ],
};

type SpawnType = "Chest" | "Monster" | null;

const SpawnTypeRecord: { [key: string]: SpawnType } = {
    "0": null,
    "1": "Chest",
    "2": "Monster",
};

type Tile = {
    id: string; // like "tile_A_1"
    x: number;
    y: number;
    tileType: TileType;
    blockPath: BlockPath;
    spawnType: SpawnType;
    sides?: TileSide[];
};

// Parser function
function parseTiles(tilesData: string[][]): Tile[] {
    const tiles: Tile[] = [];

    for (const rowTileCodes of tilesData) {
        for (const tileCode of rowTileCodes) {
            const coordinate = tileCode.substring(0, 3);
            const x = coordinate.charCodeAt(0) - "A".charCodeAt(0);
            const y = parseInt(coordinate.substring(1, 3), 10) - 1;

            const tileType =
                TileTypeRecord[tileCode[3] as keyof typeof TileTypeRecord];
            const blockPath =
                BlockPathRecord[tileCode[4] as keyof typeof BlockPathRecord];
            if (blockPath === undefined) {
                console.log(`Invalid block path: ${tileCode[4]}`);
            }
            let spawnType =
                SpawnTypeRecord[tileCode[5] as keyof typeof SpawnTypeRecord];

            if (spawnType === undefined || tileCode[5] === "0") {
                spawnType = null;
            }

            const sides = BlockedPathToSides[blockPath];

            const id = `tile_${coordinate[0]}_${y + 1}`;

            tiles.push({ id, x, y, tileType, blockPath, spawnType, sides });
        }
    }

    return tiles;
}

// Example usage:

const mapData = JSON.parse(
    readFileSync("./data/maps/input/map-3d.json", "utf-8")
);
const parsedTiles = parseTiles(mapData.tiles);
// console.log(parsedTiles);

writeFileSync("./data/maps/output/map-3d.json", JSON.stringify(parsedTiles));

// const TileTypeToSides: { [key in BlockPath]: TileSide[] } = {
//     VerticalBridge: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     HorizontalBridge: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     DoubleBridge: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     Void: [
//         { side: "Top", edgeProperty: "Void" },
//         { side: "Right", edgeProperty: "Void" },
//         { side: "Bottom", edgeProperty: "Void" },
//         { side: "Left", edgeProperty: "Void" },
//     ],
//     StairsNS: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     StairsSN: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     StairsEW: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     StairsWE: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     Upper: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     Lower: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     OpenTile: [
//         { side: "Top", edgeProperty: "Basic" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],
//     BlockNorth: [
//         { side: "Top", edgeProperty: "Wall" },
//         { side: "Right", edgeProperty: "Basic" },
//         { side: "Bottom", edgeProperty: "Basic" },
//         { side: "Left", edgeProperty: "Basic" },
//     ],

// }
