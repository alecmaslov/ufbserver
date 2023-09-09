// import { parse } from "path";
// import { UFBMap, GameTile, TileType, SpawnEntity, TileEdge, TileColorCodes, TileColor, Coordinates } from "./types/map";
// import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, write } from "fs";

// const COLOR_CODES = ["E", "R", "G", "T", "N", "S", "Y", "I", "A", "P", "Q", "O", "L", "K"];

// const TILE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
//   "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];


// const tileTypes = new Map<string, TileType>([
//   ["B", TileType.Bridge],
//   ["F", TileType.Floor],
//   ["V", TileType.Void],
//   ["C", TileType.Chest],
//   ["M", TileType.Enemy],
//   ["P", TileType.Portal],
// ]);


// const parseTileType = (tileCode: string): TileType => {
//   return tileTypes.get(tileCode[0]) || TileType.Void;
// }

// const parseTileColor = (tileCode: string): TileColor | null => {
//   const colorCode = tileCode[0];
//   return TileColorCodes.get(colorCode) || null;
// }

// function parseEdgeProperties(tileCode: string): TileEdge[] {
//   const tileEdges: TileEdge[] = [];

//   if (tileCode[1] === '1') tileEdges.push({ side: "top", edgeProperty: "wall" });
//   if (tileCode[2] === '1') tileEdges.push({ side: "right", edgeProperty: "wall" });
//   if (tileCode[3] === '1') tileEdges.push({ side: "bottom", edgeProperty: "wall" });
//   if (tileCode[4] === '1') tileEdges.push({ side: "left", edgeProperty: "wall" });

//   return tileEdges;
// }

// function iterateTiles(layer: any, callback: (tile: any, coordinates: Coordinates, id: string) => void) {
//   layer.tiles.forEach((row: string[], rowIndex: number) => {
//     row.forEach((tileCode: string, columnIndex: number) => {
//       const coordinates: Coordinates = {
//         x: columnIndex,
//         y: rowIndex
//       };
//       const id = `tile_${TILE_LETTERS[rowIndex]}_${columnIndex}`;
//       callback(tileCode, coordinates, id);
//     });
//   });
// }

// function initializeTiles(dimensions: number): Map<string, Partial<GameTile>> {
//   const allTiles: Map<string, Partial<GameTile>> = new Map();
//   for (let i = 0; i < dimensions; i++) {
//     for (let j = 0; j < dimensions; j++) {
//       const id = `tile_${TILE_LETTERS[i]}_${j}`;
//       const coordinates: Coordinates = {
//         x: j,
//         y: i
//       };

//       allTiles.set(id, {
//         id,
//         coordinates
//       });
//     }
//   }
//   return allTiles;
// }

// function parseBackgroundLayer(layer: any, allTiles: Map<string, Partial<GameTile>>) {
//   iterateTiles(layer, (tileCode: string, coordinates: Coordinates, id: string) => {
//     const edges = parseEdgeProperties(tileCode);
//     const tile = allTiles.get(id);
//     if (tile === undefined) throw new Error("Failed to find tile.");
//     tile.type = parseTileType(tileCode);
//     tile.spawnItems = [];

//     var color = parseTileColor(tileCode);
//     if (color === null) color = TileColorCodes.get("E")!;
//     tile.color = color;
//     tile.layerName = layer.name;
//     tile.edges = edges;
//     tile.legacyCode = tileCode;
//   });
// }
// //   {
// //     "c" : "chest[id], store[id], portal[id]",
// //     "m" : "monster?[id]"
// // }

// // const spawnCodes = Map<string, SpawnEntity>([
// //   ["c", SpawnEntity.Chest],


// function parseSpawnLayer(layer: any, allTiles: Map<string, Partial<GameTile>>) {
//   iterateTiles(layer, (tileCode: string, coordinates: Coordinates, id: string) => {
//     const tile = allTiles.get(id);
//     if (tile === undefined) throw new Error("Failed to find tile.");
//     tile.spawnItems = [];
//   });
// }

// export function parseUFBMap(map: any): UFBMap {

//   const width = map.layers[0].tiles[0].length;
//   const tiles = initializeTiles(width);

//   const backgroundLayer = map.layers.find((layer: any) => layer.name === "Background");
//   if (backgroundLayer === undefined) throw new Error("Failed to find background layer.");
//   parseBackgroundLayer(backgroundLayer, tiles);

//   const spawnLayer = map.layers.find((layer: any) => layer.name === "Spawnzones");
//   if (spawnLayer === undefined) throw new Error("Failed to find spawn layer.");
//   parseSpawnLayer(spawnLayer, tiles);


//   const ufbMap: UFBMap = {
//     name: map.name,
//     defaultCards: map.defaultCards,
//     tiles: Array.from(tiles.values()),
//   };

//   return ufbMap;
// }

// function parseAllMaps(allMapsFile : string, outputRoot : string = "../Assets/Resources/Maps") {
//   const inputFile = allMapsFile;
//   console.log(`Parsing ${inputFile}`);
//   const data = readFileSync(inputFile);
//   const allMaps = JSON.parse(data.toString());
 
//   for (const map of allMaps) {
//     const parsed = parseUFBMap(map);
//     console.log(`Writing ${parsed.name} to ${outputRoot}/${parsed.name}/map.json`)
//     if (!existsSync(`${outputRoot}/${parsed.name}`)) mkdirSync(`${outputRoot}/${parsed.name}`, { recursive: true });
//     const outputFile = `${outputRoot}/${parsed.name}/map.json`;
//     writeFileSync(outputFile, JSON.stringify(parsed, null, 2)); 
//   }

//   const mapNames = allMaps.map((map: any) => map.name);
//   const mapInfo = mapNames.map((name: string) => {
//     return {
//       name,
//       path: `Maps/${name}/map`
//     }
//   });

//   writeFileSync(`${outputRoot}/mapInfo.json`, JSON.stringify(mapInfo, null, 2));

// }

// function parseDirectory(mapDir : string) {
//   const allFiles = readdirSync(mapDir);
//   allFiles.forEach((file: string) => {
//     if (!file.endsWith(".json")) return;
//     const inputFile = `${mapDir}/${file}`;
//     console.log(`Parsing ${inputFile}`);
//     const data = readFileSync(inputFile);
//     const originalMap = JSON.parse(data.toString());
//     if (originalMap === undefined) throw new Error("Failed to parse map file.");
//     let mapName = inputFile.split("/").pop();
//     if (mapName === undefined) throw new Error("Failed to parse map name.");
//     mapName = mapName.split(".")[0];
//     mapName = mapName.replace("_", "");
//     originalMap.name = mapName;
//     const parsed = parseUFBMap(originalMap);
//     const outputFile: string = `./data/maps/output/${mapName}.json`;
//     writeFileSync(outputFile, JSON.stringify(parsed, null, 2));
//   });
//   console.log("Done.");
// }

// // parseDirectory("./data/maps/input");
// parseAllMaps("./data/maps/input/all-maps.json", "../Assets/Resources/Maps");