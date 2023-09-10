import { join as pathJoin } from "path";
import { readFile } from "fs/promises";
import { Room } from "@colyseus/core";
import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import { UfbRoomState } from "#colyseus/schema/UfbRoomState";
import createGraph, { Graph } from "ngraph.graph";
import { ok } from "assert";

const TILE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

export const coordToTileId = (coordinates: Coordinates): string => {
  return `tile_${TILE_LETTERS[coordinates.y]}_${coordinates.x + 1}`;
};

export const tileIdToCoord = (tileId: string): Coordinates => {
  const parts = tileId.split("_");
  const y = TILE_LETTERS.indexOf(parts[1]);
  const x = parseInt(parts[2]) - 1;
  const c = { x, y };
  ok(coordToTileId(c) === tileId);
  return c;
};

type NavGraphLinkData = {
    energyCost: number;
}

export interface UFBMap {
    name : string;
    gridWidth : number;
    gridHeight : number;
    defaultCards: string[];
    tiles : Partial<GameTile>[];
    adjacencyList : Record<string, TileEdge[]>;
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
    @type("string") name: string;
    @type("number") gridWidth: number = 0;
    @type("number") gridHeight: number = 0;
    @type({ map: TileState }) tiles: MapSchema<TileState> = new MapSchema<TileState>();
    @type({ map: AdjacencyListItem }) adjacencyList = new MapSchema<AdjacencyListItem>();
    /** raw representation for internal use */
    _map: UFBMap | null = null;
    /** nav graph for pathfinding */
    _navGraph: Graph<any, NavGraphLinkData> = null;
}

export const loadMap = async (room: Room<UfbRoomState>, mapKey: string) => {
    const path = pathJoin("data", "maps", mapKey, "map.json");
    const data = await readFile(path);
    const parsed = JSON.parse(data.toString());
    const ufbMap = parsed as UFBMap;
    room.state.map.id = mapKey;
    room.state.map.name = mapKey;
    room.state.map.gridWidth = ufbMap.gridWidth;
    room.state.map.gridHeight = ufbMap.gridHeight;
    room.state.map._map = ufbMap;

    for (const tile of ufbMap.tiles) {
        const tileSchema = new TileState();
        tileSchema.id = tile.id;
        tileSchema.type = tile.type;
        tileSchema.layerName = tile.layerName;
        tileSchema.legacyCode = tile.legacyCode;
        tileSchema.color = tile.color;
        tileSchema.x = tile.coordinates.x;
        tileSchema.y = tile.coordinates.y;
        room.state.map.tiles.set(tile.id, tileSchema);
    }

    room.state.map.adjacencyList = new MapSchema<AdjacencyListItem>();
    for (const key in ufbMap.adjacencyList) {
        const edges = ufbMap.adjacencyList[key]!;
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

    // build nav graph
    const graph = createGraph<any, NavGraphLinkData>();
    for (const key in ufbMap.adjacencyList) {
        const edges = ufbMap.adjacencyList[key]!;
        for (const edge of edges) {
            graph.addLink(edge.from, edge.to, {
                energyCost: edge.energyCost,
            });
        }
    }
    room.state.map._navGraph = graph;
    room.broadcast("mapChanged", {});
}