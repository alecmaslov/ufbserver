import { join as pathJoin } from "path";
import { readFile } from "fs/promises";
import { Room, Client } from "@colyseus/core";
import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import { UfbRoomState } from "#colyseus/schema/UfbRoomState";

export interface UFBMap {
    name : string;
    gridWidth : number;
    gridHeight : number;
    defaultCards: string[];
    tiles : Partial<GameTile>[];
    adjacencyList : Map<string, TileEdge[]>;
}

export enum TileType {
    Bridge = "Bridge",
    Floor = "Floor",
    Void = "Void",
    Chest = "Chest",
    Enemy = "Enemy",
    Portal = "Portal",
}

export interface TileColor {
    name: string;
    color: string;
}

export interface SpawnEntity {
    name : string;
    // type : TileType;
    properties : any;
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

export interface Coordinates {
    x: number;
    y: number;
}

export interface GameTile {
    id: string;
    type : TileType;
    spawnItems : SpawnEntity[];
    coordinates : Coordinates;
    color: TileColor | null;
    layerName : string;
    sides : TileSide[];
    legacyCode: string; // code for the original UFB map parser in Swift
}

export const loadMap = async (room: Room<UfbRoomState>, mapKey: string) => {
    const path = pathJoin(__dirname, "data", "maps", mapKey, "map.json");
    const data = await readFile(path);
    const parsed = JSON.parse(data.toString());
    const ufbMap = parsed as UFBMap;
    room.state.map.id = mapKey;
    room.state.map.gridWidth = ufbMap.gridWidth;
    room.state.map.gridHeight = ufbMap.gridHeight;
    room.state.map._adjacencyList = ufbMap.adjacencyList;
    room.state.map.adjacencyList = new MapSchema<AdjacencyListItem>();
    for (const key of ufbMap.adjacencyList.keys()) {
        const edges = ufbMap.adjacencyList.get(key)!;
        const item = new AdjacencyListItem();
        item.edges = new ArraySchema<TileEdgeSchema>();
        for (const edge of edges) {
            const edgeSchema = new TileEdgeSchema();
            edgeSchema.from = edge.from;
            edgeSchema.to = edge.to;
            edgeSchema.type = edge.type;
            edgeSchema.energyCost = edge.energyCost;
            item.edges.push(edgeSchema);
        }
        room.state.map.adjacencyList.set(key, item);
    }
}

export class TileState extends Schema {
    @type("string") id: string;
    @type("string") type: TileType;
    @type("string") layerName: string;
    @type("string") legacyCode: string;
    @type("string") color: TileColor | null;
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
    @type("string") id: string;
    @type("number") gridWidth: number = 0;
    @type("number") gridHeight: number = 0;
    @type({ map: TileState }) tiles: MapSchema<TileState> = new MapSchema<TileState>();
    /** representation for internal use */
    _adjacencyList: Map<string, TileEdge[]> = new Map();
    @type({ map: AdjacencyListItem }) adjacencyList = new MapSchema<AdjacencyListItem>();
}
