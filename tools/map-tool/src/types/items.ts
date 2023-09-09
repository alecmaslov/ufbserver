export enum TokenType {
    Magic = 'Magic',
    Melee = 'Melee',
}

// what "Item" is labeled as, but I want to distinguish between any item
export enum CollectibleItemType {
    Potion = 'Potion',
    Elixir = 'Elixir',
    Arrow = 'Arrow',
    Bomb = 'Bomb',
    Landmine = 'Landmine',
    Gold = 'Gold',
}

export enum BonusType {
    Counter = 'Counter',
    Reflect = 'Reflect',
    Block = 'Block',
    Deflect = 'Deflect',
    Charge = 'Charge',
    Burn = 'Burn',
    Freeze = 'Freeze',
    Steady = 'Steady',
}

export enum PowerBoostType {
    Push = 'Push',
    Pull = 'Pull',
    Wall = 'Wall',
    Vampire = 'Vampire',
    Confuse = 'Confuse',
    Poison = 'Poison',
    Regenerate = 'Regenerate',
    Ghost = 'Ghost',
}


// any attribute on the player that can be affected
export type PlayerAttribute = 'health' | 'energy' | TokenType | CollectibleItemType | BonusType | PowerBoostType; 