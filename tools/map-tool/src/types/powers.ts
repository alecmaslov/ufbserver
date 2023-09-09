import { PlayerAttribute } from "./items";

export type PowerCategory = 'melee' | 'weapon' | 'armor' | 'magic';

export enum MeleeItemType {
    Sword = 'Sword',
    Ax = 'Ax',
    Spear = 'Spear',
    Shield = 'Shield',
}

export enum RangedItemType {
    Bow = 'Bow',
    Crossbow = 'Crossbow',
    Cannon = 'Cannon',
}

export enum ArmorItemType {
    Armor = 'Armor',
}

export enum MagicItemType {
    FireCrystal = 'Fire Crystal',
    IceCrystal = 'Ice Crystal',
    LightCrystal = 'Light Crystal', 
    VoidCrystal = 'Void Crystal',
}

export type ItemType = MeleeItemType | RangedItemType | ArmorItemType | MagicItemType;

export interface PowerCost {
    type: PlayerAttribute | string;
    value: number;
}

export type PlayerAction = "placeMine" | "passVoid";

export interface PowerResult {
    type: PlayerAttribute | string;
    value: number;
}

export interface PowerRange {
    type: 'radius' | 'line'; // some weapons/crystals have a general area that it affects
    value: number;
}


export interface PowerBehavior {
    name: string; // aka "Power Move"
    cost: PowerCost[], // a list of costs to the player to initiate a power
    playerAction: PlayerAction[], // any actions the player takes as a result
    playerResult: PowerResult[], // whatever happens to the player
    enemyResult: PowerResult[], // whatever happens to the enemy
    range: PowerRange | null; // range of the power, used to calculate which enemies to apply enemyResult to 
    bonus: {} | null 
}


export interface Power {
    name: string;
    category: PowerCategory;
    type: ItemType;
    behavior: PowerBehavior;
}



// export enum PowerCostType {
//     Health = 'Health',
//     Energy = 'Energy',
//     Magic = 'Magic',
//     Gold = 'Gold',
//     Arrow = 'Arrow',
//     Bomb = 'Bomb',
//     Potion = 'Potion',
//     Landmine = 'Landmine',
//     Elixir = 'Elixir',
// }