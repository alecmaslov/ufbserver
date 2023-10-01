import { Coordinates } from "#shared-types";
import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import { CoordinatesState } from "./CharacterState";
import { TileType, AdjacencyType } from "@prisma/client";

export interface UFBMap {
    name: string;
    resourceAddress?: string;
    gridWidth: number;
    gridHeight: number;
    defaultCards: string[];
    tiles: Partial<GameTile>[];
    adjacencyList: Record<string, TileEdge[]>;
}

// type TileType = "Default" | "Bridge" | "Floor" | "Void" | "Chest" | "Enemy" | "Portal";

// export interface SpawnEntity {
//     name: string;
//     // type : TileType;
//     properties: any;
// }

export type SpawnZoneType = "Merchant" | "Portal" | "Monster" | "Chest";

export interface SpawnZone {
    type: SpawnZoneType;
    seedId: number;
}

// export interface SpawnZone {
//     id: string;
//     type: 
// }

// type EdgeType = "BASIC" | "PORTAL" | "BRIDGE";

export interface TileEdge {
    from: string;
    to: string;
    type: AdjacencyType;
    energyCost: number;
}

export interface TileSide {
    side: "Top" | "Right" | "Bottom" | "Left";
    edgeProperty: "Wall" | "Door" | "Portal" | "Bridge";
}

export interface GameTile {
    id: string;
    type: TileType;
    spawnZone?: SpawnZone;
    coordinates: Coordinates;
    sides: TileSide[];
}

export class TileState extends Schema {
    @type("string") id: string = "";
    @type("string") tileCode: string = ""; // e.g. "tile_A_1"
    @type("string") type: TileType = "Default";
    @type(["uint8"]) walls: ArraySchema<number> = new ArraySchema<number>(); // @kyle - Added walls
    @type(CoordinatesState) coordinates: CoordinatesState = new CoordinatesState();
}

export class TileEdgeState extends Schema {
    @type("string") from: string = "";
    @type("string") to: string = "";
    @type("string") type: AdjacencyType = "Basic";
    @type("number") energyCost: number = 1;
}

export class AdjacencyListItemState extends Schema {
    @type([TileEdgeState]) edges = new ArraySchema<TileEdgeState>();
}

export class MapState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") resourceAddress: string = ""; // address of the map image file
    @type("number") gridWidth: number = 0;
    @type("number") gridHeight: number = 0;
    @type({ map: TileState }) tiles: MapSchema<TileState> 
        = new MapSchema<TileState>();
    @type({ map: AdjacencyListItemState }) adjacencyList: MapSchema<AdjacencyListItemState> 
        = new MapSchema<AdjacencyListItemState>();
    /** raw representation for internal use */
    _map: UFBMap | null = null;
}
