import { Item } from "#game/schema/CharacterState";

export type Coordinates = { x: number, y: number };

export interface PathStep {
    tileId: string;
    coord?: Coordinates;
    gameId?: string;
}

export interface PowerMove {
    id: number;
    name: string;
    powerImageId: number;
    powerIds: number[];
    costList: Item[];
    light: number;
    coin: number;
    range: number;
    result: {
        health?: number;
        stacks?: {
            id : number,
            count : number
        }[];
        perkId?: number;
        ultimate?: number;
        items?: {
            id : number,
            count : number
        }[];
        coin?: number;
        energy?: number;
    } 
}

export const RESPONSE_TYPE = {
    ERROR: "ERROR",
    SUCCESS: "SUCCESS",
    ALREADY_EXIST: "ALREADY_EXIST",
    NOT_EXIST: "NOT_EXIST",
    WRONG_PASSWORD: "WRONG_PASSWORD"
}