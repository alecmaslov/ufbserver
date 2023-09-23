import { Coordinates } from "#shared-types";
import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";

export interface UFBMap {
    name: string;
    gridWidth: number;
    gridHeight: number;
    defaultCards: string[];
    tiles: Partial<GameTile>[];
    adjacencyList: Record<string, TileEdge[]>;
}

type TileType = "bridge" | "floor" | "void" | "chest" | "enemy" | "portal";

export interface SpawnEntity {
    name: string;
    // type : TileType;
    properties: any;
}

type EdgeType = "basic" | "portal" | "bridge";

export interface TileEdge {
    from: string;
    to: string;
    type: EdgeType;
    energyCost: number;
}

export interface TileSide {
    side: "top" | "right" | "bottom" | "left";
    edgeProperty: "wall" | "door" | "portal" | "bridge";
}

export interface GameTile {
    id: string;
    type: TileType;
    spawnItems: SpawnEntity[];
    coordinates: Coordinates;
    color: TileColor | null;
    layerName: string;
    sides: TileSide[];
    legacyCode: string; // code for the original UFB map parser in Swift
}

export class TileColor extends Schema {
    @type("string") name: string = "";
    @type("string") color: string = "";
}

export class TileState extends Schema {
    @type("string") id: string;
    @type("string") type: TileType;
    @type("number") x: number;
    @type("number") y: number;
}

export class TileEdgeSchema extends Schema {
    @type("string") from: string;
    @type("string") to: string;
    @type("string") type: EdgeType;
    @type("number") energyCost: number;
}

export class AdjacencyListItem extends Schema {
    @type([TileEdgeSchema]) edges = new ArraySchema<TileEdgeSchema>();
}

export class MapState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("number") gridWidth: number = 0;
    @type("number") gridHeight: number = 0;
    @type({ map: TileState }) tiles: MapSchema<TileState> 
        = new MapSchema<TileState>();
    @type({ map: AdjacencyListItem }) adjacencyList: MapSchema<AdjacencyListItem> 
        = new MapSchema<AdjacencyListItem>();
    /** raw representation for internal use */
    _map: UFBMap | null = null;
}
