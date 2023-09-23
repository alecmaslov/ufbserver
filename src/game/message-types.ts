import { Coordinates, PathStep } from "#shared-types";

/**
 * search for a path from one tile to another
 */
export interface FindPathMessage {
    from: Coordinates;
    to: Coordinates;
}

/**
 * response to "findPath" message
 */
export interface FoundPathMessage {
    from: Coordinates;
    to: Coordinates;
    /** each nodes in the path, in order */
    path: PathStep[];
    /** total energyCost of all edges in path */
    cost: number;
}

export interface MoveMessage {
    destination: Coordinates;
}

export interface CharacterMovedMessage {
    characterId: string;
    path: PathStep[];
}

export interface ChangeMapMessage {
    mapName: string;
}

export interface GeneratedPlayerIdMessage {
    playerId: string;
}