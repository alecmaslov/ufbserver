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