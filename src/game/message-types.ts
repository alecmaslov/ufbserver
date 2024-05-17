import { Coordinates, PathStep, PowerMove } from "#shared-types";
import { CharacterState } from "./schema/CharacterState";

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
    left: number,
    right: number,
    top: number,
    down: number,
}

export interface PowerMoveListMessage {
    powermoves: PowerMove[];
}

export interface GetResourceDataMessage {
    characterState: CharacterState
}

export interface SpawnInitMessage {
    characterId: string;
    spawnId: string;
    item: number;
    power: number;
    coin: number;
    tileId: string;
}

export interface ChangeMapMessage {
    mapName: string;
}

export interface GeneratedPlayerIdMessage {
    playerId: string;
}