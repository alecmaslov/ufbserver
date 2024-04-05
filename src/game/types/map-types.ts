import { TileType, AdjacencyType, SpawnZoneType } from "@prisma/client";
import { Coordinates } from "#shared-types";

export type SpawnEntityType = "Chest" | "Merchant";

export interface UFBMap {
    name: string;
    resourceAddress?: string;
    gridWidth: number;
    gridHeight: number;
    defaultCards: string[];
    tiles: Partial<GameTile>[];
    adjacencyList: Record<string, TileEdge[]>;
}

export interface SpawnZone {
    type: SpawnZoneType;
    seedId: number;
}

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

export interface NewGameTile {
    id: string;
    type: TileType;
    spawnZone?: SpawnZone;
    coordinates: Coordinates;
    sides: TileSide[];
}

export interface Spawnable {
    id: string;
    type: SpawnEntityType;
    // any other common properties...
}

export interface SpawnEntityConfig {
    chests: number;
    merchants: number;
    portals: number; // 2 portals for each
    monsters: number;
}
