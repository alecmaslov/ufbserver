
// export interface UFBMap {
//     name : string;
//     gridWidth : number;
//     gridHeight : number;
//     defaultCards: string[];
//     tiles : Partial<GameTile>[];
//     adjacencyList : Record<string, TileEdge[]>;
// }

// export enum TileType {
//     Bridge = "Bridge",
//     Floor = "Floor",
//     Void = "Void",
//     Chest = "Chest",
//     Enemy = "Enemy",
//     Portal = "Portal",
// }

// export interface TileColor {
//     name: string;
//     color: string;
// }

// export interface SpawnEntity {
//     name : string;
//     // type : TileType;
//     properties : any;
// }

// type EdgeType = "basic" | "portal" | "bridge";

// export interface TileEdge {
//     from: string;
//     to: string;
//     type: EdgeType;
//     energyCost: number;
// }

// export interface TileSide {
//     side: "top" | "right" | "bottom" | "left";
//     edgeProperty: "wall" | "door" | "portal" | "bridge";
// }

// export interface Coordinates {
//     x: number;
//     y: number;
// }

// export interface GameTile {
//     id: string;
//     type : TileType;
//     spawnItems : SpawnEntity[];
//     coordinates : Coordinates;
//     color: TileColor | null;
//     layerName : string;
//     sides : TileSide[];
//     legacyCode: string; // code for the original UFB map parser in Swift
// }