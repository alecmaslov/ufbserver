export const USER_TYPE : {[key : string] : number} = {
    USER : 1,
    MONSTER : 2
}

export const END_TYPE : {[key : string] : number} = {
    VICTORY : 1,
    DEFEAT : 2
}

export const DICE_TYPE : {[key : string] : number} = {
    DICE_6 : 1,
    DICE_4 : 2,
    DICE_6_6 : 3,
    DICE_6_4 : 4
}

export const WALL_DIRECT : {[key : string] : number} = {
    TOP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
}

export const MONSTER_TYPE : {[key : string] : number} = {
    WASP_BLUE : 1,
    SPIDER_BLUE : 2,
    EARWIG_BLUE : 3,
    CENTIPEDE_BLUE : 4,
    WASP_GREEN : 5,
    SPIDER_GREEN : 6,
    EARWIG_GREEN : 7,
    CENTIPEDE_GREEN : 8,
    WASP_YELLOW : 9,
    SPIDER_YELLOW : 10,
    EARWIG_YELLOW : 11,
    CENTIPEDE_YELLOW : 12,
}

export const MONSTERS : {[key : number] : {
    name : string,
    level : number,
    characterClass : string,
    property : {
        heart : number,
        energy : number,
        melee : number,
        mana : number
    }
}} = {
    [MONSTER_TYPE.WASP_BLUE] : {
        name : "Blue Wasp",
        level : 1,
        characterClass : "Wasp_blue",
        property : {
            heart : 30,
            energy : 26,
            melee : 2,
            mana : 2
        }
    },
    [MONSTER_TYPE.WASP_GREEN] : {
        name : "Green Wasp",
        level : 2,
        characterClass : "Wasp_green",
        property : {
            heart : 50,
            energy : 36,
            melee : 4,
            mana : 4
        }
    },
    [MONSTER_TYPE.WASP_YELLOW] : {
        name : "Yellow Wasp",
        level : 3,
        characterClass : "Wasp_yellow",
        property : {
            heart : 70,
            energy : 46,
            melee : 6,
            mana : 6
        }
    },
    [MONSTER_TYPE.SPIDER_BLUE] : {
        name : "Blue Spider",
        level : 1,
        characterClass : "Spider_blue",
        property : {
            heart : 35,
            energy : 24,
            melee : 2,
            mana : 2
        }
    },
    [MONSTER_TYPE.SPIDER_GREEN] : {
        name : "Green Spider",
        level : 2,
        characterClass : "Spider_green",
        property : {
            heart : 55,
            energy : 34,
            melee : 4,
            mana : 4
        }
    },
    [MONSTER_TYPE.SPIDER_YELLOW] : {
        name : "Yellow Spider",
        level : 3,
        characterClass : "Spider_yellow",
        property : {
            heart : 75,
            energy : 44,
            melee : 6,
            mana : 6
        }
    },

    [MONSTER_TYPE.EARWIG_BLUE] : {
        name : "Blue Earwig",
        level : 1,
        characterClass : "Earwig_blue",
        property : {
            heart : 40,
            energy : 22,
            melee : 2,
            mana : 2
        }
    },
    [MONSTER_TYPE.EARWIG_GREEN] : {
        name : "Green Earwig",
        level : 2,
        characterClass : "Earwig_green",
        property : {
            heart : 60,
            energy : 32,
            melee : 4,
            mana : 4
        }
    },
    [MONSTER_TYPE.EARWIG_YELLOW] : {
        name : "Yellow Earwig",
        level : 3,
        characterClass : "Earwig_yellow",
        property : {
            heart : 80,
            energy : 42,
            melee : 6,
            mana : 6
        }
    },

    [MONSTER_TYPE.CENTIPEDE_BLUE] : {
        name : "Blue Centipede",
        level : 1,
        characterClass : "Centipede_blue",
        property : {
            heart : 45,
            energy : 20,
            melee : 2,
            mana : 2
        }
    },
    [MONSTER_TYPE.CENTIPEDE_GREEN] : {
        name : "Green Centipede",
        level : 2,
        characterClass : "Centipede_green",
        property : {
            heart : 65,
            energy : 30,
            melee : 4,
            mana : 4
        }
    },
    [MONSTER_TYPE.CENTIPEDE_YELLOW] : {
        name : "Yellow Centipede",
        level : 3,
        characterClass : "Centipede_yellow",
        property : {
            heart : 85,
            energy : 40,
            melee : 6,
            mana : 6
        }
    },
}

export const EDGE_TYPE : {[key: string] : number} = {
    NULL : -1,
    BASIC : 0,
    WALL : 1,
    RAVINE : 2,
    VOID : 3,
    CLIFF: 4,
    BRIDGE: 5,
    STAIR: 6,
}

export const ITEMTYPE: {[key : string] : number} = {
    HEART_PIECE: 0,
    ENERGY_SHARD: 1,
    POTION: 2,
    FEATHER: 3,
    ARROW: 4,
    BOMB: 5,
    HEART_CRYSTAL: 6,
    ENERGY_CRYSTAL: 7,
    MELEE: 8,
    MANA: 9,
    WARP_CRYSTAL: 10,
    ELIXIR: 11,
    QUIVER: 12,
    BOMB_BAG: 13,
    BOMB_ARROW: 14,
    FIRE_ARROW: 15,
    ICE_ARROW: 16,
    VOID_ARROW: 17,
    FIRE_BOMB: 18,
    ICE_BOMB: 19,
    VOID_BOMB: 20,
    CALTROP_BOMB: 21,
    ICE_TEA: 22,
    FLAME_CHILI: 23,
    
    FLAME_CHILI2 : 24,
    FLAME_CHILI3 : 25,
    ICE_TEA2 : 26,
    ICE_TEA3 : 27,
    HEART_PIECE2 : 28,
    POTION2 : 29,
    POTION3 : 30,
    FEATHER2 : 31,
    FEATHER3 : 32,
    ARROW2 : 33,
    ARROW3 : 34,
    BOMB2 : 35,
    BOMB3 : 36,

    MELEE2 : 37,
    MANA2 : 38,
    QUIVER2 : 39,
    BOMB_BAG2 : 40,
    WARP_CRYSTAL2 : 41,
    ELIXIR2 : 42,
    BOMB_ARROW2 : 43,
    FIRE_ARROW2 : 44,
    ICE_ARROW2 : 45,
    VOID_ARROW2 : 46,
    FIRE_BOMB2 : 47,
    ICE_BOMB2 : 48,
    VOID_BOMB2 : 49,
    CALTROP_BOMB2 : 50,

    //RANDOM ITEM
    RandomArrow : 51,
    RandomBomb : 52
}

export const STACKTYPE: {[key : string] : number} = {
    Cure : 0,
    Block : 1,
    Steady : 2,
    Reflect : 3,
    Charge : 4,
    Revenge : 5,
    Revive : 6,
    Slow : 7,
    Dodge : 8,
    Freeze : 9,
    Burn : 10,
    Void : 11,

    Dodge2 : 12,
    Cure2 : 13,
    Charge2 : 14,
    Barrier2 : 15,
    Steady2 : 16,
    Revenge2 : 17,
    Block2 : 18
}

export const PERKTYPE : {[key : string] : number} = {
    Push : 0,
    Pull : 1,
    Vampire : 2,
    XRay : 3,
    AreaOfEffect: 4
}

export const QUESTTYPE: {[key : string]: number} = {
    SLAYER: 0,
    GLITTER: 1,
    KILL: 2,
    CRAFTS: 3,
    LUCK: 4,
    ENERGY: 5,
    STRENGTH: 6,
    LIFE: 7
}

export const POWERTYPE : {[key : string] : number} = {
    Sword1 : 0,
    Axe1 : 1,
    Spear1 : 2,
    Shield1 : 3,
    Bow1 : 4,
    Crossbow1 : 5,
    Cannon1 : 6,
    Armor1 : 7,
    Fire1 : 8,
    Ice1 : 9,
    Holy1 : 10,
    Void1 : 11,

    Sword2 : 12,
    Axe2 : 13,
    Spear2 : 14,
    Shield2 : 15,
    Bow2 : 16,
    Crossbow2 : 17,
    Cannon2 : 18,
    Armor2 : 19,
    Fire2 : 20,
    Ice2 : 21,
    Holy2 : 22,
    Void2 : 23,

    Sword3 : 24,
    Axe3 : 25,
    Spear3 : 26,
    Shield3 : 27,
    Bow3 : 28,
    Crossbow3 : 29,
    Cannon3 : 30,
    Armor3 : 31,
    Fire3 : 32,
    Ice3 : 33,
    Holy3 : 34,
    Void3 : 35,
}

export const powermoves : any = [
    {
        // SWORD1
        id: 1,
        name: "Sword Strike",
        powerImageId: 0,
        powerIds: [
            0, 12, 24
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 8
            },
        ],
        result: {
            dice: DICE_TYPE.DICE_6,
        },
        range: 1,
        light: 3,
        coin: 0,
    },
    // {
    //     // SWORD1
    //     id: 1,
    //     name: "Sword Strike",
    //     powerImageId: 0,
    //     powerIds: [
    //         0, 12, 24
    //     ],
    //     costList: [
    //         {
    //             id: ITEMTYPE.MELEE,
    //             count: 0
    //         },
    //     ],
    //     result: {
    //         dice: DICE_TYPE.DICE_6,
    //         health: -20
    //     },
    //     range: 4,
    //     light: 1,
    //     coin: 0,
    // },
    {
        // SWORD2
        id: 2,
        name: "Flame Slice",
        powerImageId: 12,
        powerIds: [
            12, 24
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result: {
            dice: DICE_TYPE.DICE_6_4,
            stacks: [
                {
                    id: STACKTYPE.Burn,
                    count: 1
                }
            ]
        },

        range: 0,
        light: 5,
        coin: 0,
    },
    {
        // SWORD2
        id: 3,
        name: "Vengeance",
        powerImageId: 12,
        powerIds: [
            12, 24
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result: {
            stacks: [
                {
                    id: STACKTYPE.Revenge,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // SWORD3
        id: 4,
        name: "Elemental Strike",
        powerImageId: 24,
        powerIds: [
            24
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result: {
            dice: DICE_TYPE.DICE_6_6,
            stacks: [
                {
                    id: STACKTYPE.Burn,
                    count : 1
                },
            ]
        },
        range: 1,
        light: 10,
        coin: 0,
    },
    {
        // SWORD3
        id: 5,
        name: "Holy Sword",
        powerImageId: 24,
        powerIds: [
            24
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result: {
            stacks: [
                {
                    id : STACKTYPE.Dodge,
                    count : 1
                },
                {
                    id : STACKTYPE.Cure,
                    count: 1
                }
            ]
        },
        range: 0,
        light: 6,
        coin: 0,
    },
    {
        // Ax
        id: 6,
        name: "Chop",
        powerImageId: 1,
        powerIds: [
            1, 13, 25
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6
        },
        range: 1,
        light: 3,
        coin: 0,
    },
    {
        // Ax2
        id: 7,
        name: "Vampire Ax",
        powerImageId: 13,
        powerIds: [
            13, 25
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 2
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6,
            perkId: PERKTYPE.Vampire,
            stacks: [
                {
                    id : STACKTYPE.Void,
                    count : 1
                },
            ],
        },
        range: 1,
        light: 8,
        coin: 0,
    },
    {
        // Ax2
        id: 8,
        name: "Rock Steady",
        powerImageId: 13,
        powerIds: [
            13, 25
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            stacks: [
                {
                    id : STACKTYPE.Steady,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // Ax3
        id: 9,
        name: "Tornado Cleave",
        powerImageId: 25,
        powerIds: [
            25
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 2
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            perkId: PERKTYPE.AreaOfEffect,
            dice: DICE_TYPE.DICE_6_6
        },
        range: 1,
        light: 10,
        coin: 0,
    },
    {
        // Ax3
        id: 10,
        name: "Electrify",
        powerImageId: 25,
        powerIds: [
            25
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            ultimate: 5,
            stacks: [
                {
                    id : STACKTYPE.Charge,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // Spear1
        id: 11,
        name: "Lance",
        powerImageId: 2,
        powerIds: [
            2, 14, 26
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6,
            perkId: PERKTYPE.Push
        },
        range: 1,
        light: 5,
        coin: 0,
    },
    {
        // Spear2
        id: 12,
        name: "Ice Lance",
        powerImageId: 14,
        powerIds: [
            14, 26
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6_4,
            stacks: [
                {
                    id : STACKTYPE.Freeze,
                    count : 1
                }
            ],
            perkId: PERKTYPE.Push
        },
        range: 1,
        light: 4,
        coin: 0,
    },
    {
        // Spear2
        id: 13,
        name: "Harpoon",
        powerImageId: 14,
        powerIds: [
            14, 26
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 2
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6,
            perkId: PERKTYPE.Pull
        },
        range: 3,
        light: 8,
        coin: 0,
    },
    {
        // Spear3
        id: 14,
        name: "Pole Vault",
        powerImageId: 26,
        powerIds: [
            26
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 2
            },
        ],
        result : {
            items: [
                {
                    id: ITEMTYPE.FEATHER,
                    count : 1
                }
            ]
        },
        range: 1,
        light: 8,
        coin: 0,
    },
    {
        // Spear3
        id: 15,
        name: "Void Spear",
        powerImageId: 26,
        powerIds: [
            26
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 2
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6_6,
            stacks: [
                {
                    id : STACKTYPE.Void,
                    count : 1
                },
                {
                    id : STACKTYPE.Charge,
                    count : 1
                }
            ],
            perkId: PERKTYPE.Push
        },
        range: 1,
        light: 7,
        coin: 0,
    },
    {
        // Shield1
        id: 16,
        name: "Shield Bash",
        powerImageId: 3,
        powerIds: [
            3, 15, 27
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_4,
            stacks: [
                {
                    id : STACKTYPE.Slow,
                    count : 1
                },
            ]
        },
        range: 1,
        light: 6,
        coin: 0,
    },
    {
        // Shield2
        id: 17,
        name: "Reflect",
        powerImageId: 15,
        powerIds: [
            15, 27
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Block,
                    count: 1
                },
                {
                    id : STACKTYPE.Reflect,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 5,
        coin: 0,
    },
    {
        // Shield2
        id: 18,
        name: "Flame Shield",
        powerImageId: 15,
        powerIds: [
            15, 27
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Revenge,
                    count : 1
                }
            ],
            items: [
                {
                    id: ITEMTYPE.FLAME_CHILI,
                    count: 1
                }
            ]
        },
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Shield3
        id: 19,
        name: "Electric Shield",
        powerImageId: 27,
        powerIds: [
            27
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            stacks: [
                {
                    id: STACKTYPE.Dodge,
                    count: 1
                },
                {
                    id: STACKTYPE.Revenge,
                    count: 1
                },
                {
                    id: STACKTYPE.Steady,
                    count: 1
                },
            ]
        },
        range: 0,
        light: 4,
        coin: 0,
    },
    {
        // Shield3
        id: 20,
        name: "Sacred Shield",
        powerImageId: 27,
        powerIds: [
            27
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 2
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Revive,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 20,
        coin: 0,
    },
    {
        // Bow1
        id: 21,
        name: "Arrow Strike",
        powerImageId: 4,
        powerIds: [
            4, 16, 28
        ],
        costList: [
            {
                id: ITEMTYPE.RandomArrow,
                count: 1
            },
        ],
        result : {
            health: -1
        },
        range: 4,
        light: 2,
        coin: 0,
    },
    {
        // Bow2
        id: 22,
        name: "Craft Arrow",
        powerImageId: 16,
        powerIds: [
            16, 28
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.ARROW,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 1,
    },
    {
        // Bow2
        id: 23,
        name: "Hunter Sense",
        powerImageId: 16,
        powerIds: [
            16, 28
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Dodge,
                    count : 1
                },
                {
                    id : STACKTYPE.Reflect,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Bow3
        id: 24,
        name: "Sniper",
        powerImageId: 28,
        powerIds: [
            28
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
            {
                id: ITEMTYPE.RandomArrow,
                count: 1
            },
        ],
        result : {
            health: -2,
            stacks: [
                {
                    id: STACKTYPE.Slow,
                    count: 1
                }
            ]
        },
        range: 8,
        light: 4,
        coin: 0,
    },
    {
        // Bow3
        id: 25,
        name: "Alchemy",
        powerImageId: 28,
        powerIds: [
            28
        ],
        costList: [
            {
                id: ITEMTYPE.ARROW,
                count: 1
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            coin : 2
        },
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // CrossBow1
        id: 26,
        name: "Crossbow Bolt",
        powerImageId: 5,
        powerIds: [
            5, 17, 29
        ],
        costList: [
            {
                id: ITEMTYPE.RandomArrow,
                count: 1
            },
        ],
        result : {
            health: -1
        },
        range: 3,
        light: 2,
        coin: 0,
    },
    {
        // CrossBow2
        id: 27,
        name: "Hook Shot",
        powerImageId: 17,
        powerIds: [
            17, 29
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.RandomArrow,
                count: 1
            }
        ],
        result : {
            health: -2,
            perkId: PERKTYPE.Vampire,
            perkId1: PERKTYPE.Pull
        },
        range: 3,
        light: 4,
        coin: 0,
    },
    {
        // CrossBow2
        id: 28,
        name: "Magic Arrow",
        powerImageId: 17,
        powerIds: [
            17, 29
        ],
        costList: [
            {
                id: ITEMTYPE.ARROW,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Steady,
                    count : 1
                },
                {
                    id : STACKTYPE.Revenge,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },    
    {
        // CrossBow3
        id: 29,
        name: "Bomb Arrow",
        powerImageId: 29,
        powerIds: [
            29
        ],
        costList: [
            {
                id: ITEMTYPE.ARROW,
                count: 1
            },
            {
                id: ITEMTYPE.BOMB,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.BOMB_ARROW,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // CrossBow3
        id: 30,
        name: "Infuse Arrow",
        powerImageId: 29,
        powerIds: [
            29
        ],
        costList: [
            {
                id: ITEMTYPE.ARROW,
                count: 1
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.FIRE_ARROW,
                    count : 1
                },
                {
                    id : ITEMTYPE.ICE_ARROW,
                    count : 1
                },
                {
                    id : ITEMTYPE.VOID_ARROW,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Cannon1
        id: 31,
        name: "Cannonball",
        powerImageId: 6,
        powerIds: [
            6, 18, 30
        ],
        costList: [
            {
                id: ITEMTYPE.RandomBomb,
                count: 1
            },
        ],
        result : {
            health: -1,
            perkId: PERKTYPE.Push
        },
        range: 4,
        light: 5,
        coin: 0,
    },
    {
        // Cannon2
        id: 32,
        name: "Craft Bomb",
        powerImageId: 18,
        powerIds: [
            18, 30
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.BOMB,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 2,
    },
    {
        // Cannon2
        id: 33,
        name: "Infuse Bomb",
        powerImageId: 18,
        powerIds: [
            18, 30
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.BOMB,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.FIRE_BOMB,
                    count : 1
                },
                {
                    id : ITEMTYPE.VOID_BOMB,
                    count : 1
                },
                {
                    id : ITEMTYPE.ICE_BOMB,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Cannon3
        id: 34,
        name: "Transmute",
        powerImageId: 30,
        powerIds: [
            30
        ],
        costList: [
            {
                id: ITEMTYPE.BOMB,
                count: 1
            },
        ],
        result : {
            items: [
                {
                    id : ITEMTYPE.ICE_TEA,
                    count : 1
                },
                {
                    id : ITEMTYPE.FLAME_CHILI,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 0,
        coin: 0,
    },
    {
        // Cannon3
        id: 35,
        name: "Alchemy",
        powerImageId: 30,
        powerIds: [
            30
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.BOMB,
                count: 1
            },
        ],
        result : {
            coin : 3
        },
        range: 0,
        light: 4,
        coin: 0,
    },
    {
        // Armor1
        id: 36,
        name: "Defend",
        powerImageId: 7,
        powerIds: [
            7, 19, 31
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Block,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // Armor2
        id: 37,
        name: "Charge Up",
        powerImageId: 19,
        powerIds: [
            19, 31
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Charge,
                    count : 1
                },
                {
                    id : STACKTYPE.Revenge,
                    count : 1
                },
                {
                    id : STACKTYPE.Steady,
                    count : 1
                },
            ],
        },
        range: 0,
        light: 6,
        coin: 0,
    },
    {
        // Armor2
        id: 38,
        name: "Magic Armor",
        powerImageId: 19,
        powerIds: [
            19, 31
        ],
        costList: [
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks :[
                {
                    id : STACKTYPE.Reflect,
                    count : 1
                },
                {
                    id : STACKTYPE.Block,
                    count : 1
                },
            ],
            items: [
                {
                    id: ITEMTYPE.FLAME_CHILI,
                    count: 1
                }
            ]
        },
        range: 0,
        light: 5,
        coin: 0,
    },
    {
        // Armor3
        id: 39,
        name: "Heal",
        powerImageId: 31,
        powerIds: [
            31
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.POTION,
                    count : 1
                }
            ],
            stacks : [
                {
                    id : STACKTYPE.Cure,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 12,
        coin: 0,
    },
    {
        // Armor3
        id: 40,
        name: "Haste",
        powerImageId: 31,
        powerIds: [
            31
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Dodge,
                    count : 1
                }
            ],
            items: [
                {
                    id : ITEMTYPE.ICE_TEA,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 0,
        coin: 0,
    },
    {
        // Fire1
        id: 41,
        name: "Fireball",
        powerImageId: 8,
        powerIds: [
            8, 20, 32
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6,
            stacks: [
                {
                    id: STACKTYPE.Burn,
                    count: 1
                }
            ],
            perkId: PERKTYPE.Push
        },
        range: 4,
        light: 9,
        coin: 0,
    },
    {
        // Fire2
        id: 42,
        name: "Burn",
        powerImageId: 20,
        powerIds: [
            20, 32
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Burn,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Fire2
        id: 43,
        name: "Ignite",
        powerImageId: 20,
        powerIds: [
            20, 32
        ],
        costList: [
            {
                id: ITEMTYPE.ARROW,
                count: 1
            },
            {
                id: ITEMTYPE.BOMB,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.FIRE_ARROW,
                    count : 1
                },
                {
                    id : ITEMTYPE.FIRE_BOMB,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // Fire3
        id: 44,
        name: "Inferno",
        powerImageId: 32,
        powerIds: [
            32
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 2
            },
            {
                id: ITEMTYPE.BOMB,
                count: 5
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6_6,
            stacks: [
                {
                    id: STACKTYPE.Burn,
                    count: 2
                }
            ],
            perkId: PERKTYPE.AreaOfEffect
        },
        range: 0,
        light: 15,
        coin: 0,
    },
    {
        // Fire3
        id: 45,
        name: "Heart of Fire",
        powerImageId: 32,
        powerIds: [
            32
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 2
            },
            {
                id: ITEMTYPE.BOMB,
                count: 4
            },
        ],
        result : {
            health : 5,
            stacks : [
                {
                    id : STACKTYPE.Steady,
                    count : 1
                },
                {
                    id : STACKTYPE.Cure,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 0,
        coin: 0,
    },
    {
        // Ice1
        id: 46,
        name: "Icicle",
        powerImageId: 9,
        powerIds: [
            9, 21, 33
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6_4,
            stacks: [
                {
                    id: STACKTYPE.Freeze,
                    count: 1
                }
            ]
        },
        range: 0,
        light: 8,
        coin: 0,
    },
    {
        // Ice2
        id: 47,
        name: "Freeze",
        powerImageId: 21,
        powerIds: [
            21, 33
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Freeze,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // Ice2
        id: 48,
        name: "Frost",
        powerImageId: 21,
        powerIds: [
            21, 33
        ],
        costList: [
            {
                id: ITEMTYPE.ARROW,
                count: 1
            },
            {
                id: ITEMTYPE.BOMB,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.ICE_ARROW,
                    count : 1
                },
                {
                    id : ITEMTYPE.ICE_BOMB,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // Ice3
        id: 49,
        name: "Blizzard",
        powerImageId: 33,
        powerIds: [
            33
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 2
            },
            {
                id: ITEMTYPE.ICE_TEA,
                count: 5
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_6_6,
            stacks: [
                {
                    id: STACKTYPE.Freeze,
                    count: 2
                }
            ],
            perkId: PERKTYPE.AreaOfEffect
        },
        range: 0,
        light: 12,
        coin: 0,
    },
    {
        // Ice3
        id: 50,
        name: "Heart of Ice",
        powerImageId: 33,
        powerIds: [
            33
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.ICE_TEA,
                count: 3
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Dodge,
                    count : 1
                },
                {
                    id : STACKTYPE.Charge,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 0,
        coin: 0,
    },
    {
        // Holy1
        id: 51,
        name: "Heal",
        powerImageId: 10,
        powerIds: [
            10, 22, 34
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.POTION,
                    count : 1
                }
            ],
            stacks : [
                {
                    id : STACKTYPE.Cure,
                    count : 1
                }
            ]
        },
        range: 0,
        light: 12,
        coin: 0,
    },
    {
        // Holy2
        id: 52,
        name: "Divine Blessing",
        powerImageId: 22,
        powerIds: [
            22, 34
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 2
            },
            {
                id: ITEMTYPE.POTION,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.ELIXIR,
                    count : 1
                }
            ],
            stacks : [
                {
                    id : STACKTYPE.Cure,
                    count : 2
                }
            ]
        },
        range: 0,
        light: 18,
        coin: 0,
    },
    {
        // Holy2
        id: 53,
        name: "Lightning Bolt",
        powerImageId: 22,
        powerIds: [
            22, 34
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            dice: DICE_TYPE.DICE_4,
            stacks :[
                {
                    id : STACKTYPE.Slow,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 5,
        coin: 0,
    },
    {
        // Holy3
        id: 54,
        name: "Guardian Angel",
        powerImageId: 34,
        powerIds: [
            34
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 2
            },
            {
                id: ITEMTYPE.ELIXIR,
                count: 1
            },
        ],
        result : {
            stacks : [
                {
                    id : STACKTYPE.Revive,
                    count : 1
                },
                {
                    id : STACKTYPE.Cure,
                    count : 3
                },
            ]
        },
        range: 0,
        light: 24,
        coin: 0,
    },
    {
        // Holy3
        id: 55,
        name: "Sacred Halo",
        powerImageId: 34,
        powerIds: [
            34
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 2
            },
        ],
        result : {
            stacks :[
                {
                    id : STACKTYPE.Charge,
                    count : 1
                },
                {
                    id : STACKTYPE.Reflect,
                    count : 1
                },
                {
                    id : STACKTYPE.Steady,
                    count : 1
                },
            ],
            ultimate : 5
        },
        range: 0,
        light: 12,
        coin: 0,
    },
    {
        // Void1
        id: 56,
        name: "Vampire Bite",
        powerImageId: 11,
        powerIds: [
            11, 23, 35
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.MELEE,
                count: 1
            },
        ],
        result : {
            stacks: [
                {
                    id: STACKTYPE.Void,
                    count : 1
                }
            ],
            perkId: PERKTYPE.Vampire
        },
        range: 1,
        light: 8,
        coin: 0,
    },
    {
        // Void2
        id: 57,
        name: "Poison",
        powerImageId: 23,
        powerIds: [
            23, 35
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks: [
                {
                    id: STACKTYPE.Void,
                    count: 1
                }
            ]
        },
        range: 1,
        light: 6,
        coin: 0,
    },
    {
        // Void2
        id: 58,
        name: "Sludge",
        powerImageId: 23,
        powerIds: [
            23, 35
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
            {
                id: ITEMTYPE.ARROW,
                count: 1
            },
        ],
        result : {
            items : [
                {
                    id : ITEMTYPE.VOID_BOMB,
                    count : 1
                },
                {
                    id : ITEMTYPE.VOID_ARROW,
                    count : 1
                },
            ]
        },
        range: 0,
        light: 0,
        coin: 1,
    },
    {
        // Void3
        id: 59,
        name: "Black Hole",
        powerImageId: 35,
        powerIds: [
            35
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 2
            },
            {
                id: ITEMTYPE.VOID_BOMB,
                count: 1
            },
        ],
        result : {
            items: [
                {
                    id: ITEMTYPE.WARP_CRYSTAL,
                    count: 1
                }
            ]            
        },
        range: 3,
        light: 11,
        coin: 0,
    },
    {
        // Void3
        id: 60,
        name: "Drain",
        powerImageId: 35,
        powerIds: [
            35
        ],
        costList: [
            {
                id: ITEMTYPE.MANA,
                count: 1
            },
        ],
        result : {
            stacks: [
                {
                    id: STACKTYPE.Void,
                    count: 2
                },
                {
                    id: STACKTYPE.Slow,
                    count: 1
                },
            ],
            perkId: PERKTYPE.Vampire,
            perkId1: PERKTYPE.Pull
        },
        range: 3,
        light: 6,
        coin: 0,
    },
]

export const MONSTER_BAN_TIEM : {[key : number] : number} = {
    [ITEMTYPE.HEART_PIECE] : 1,
    [ITEMTYPE.HEART_CRYSTAL] : 1,
    [ITEMTYPE.MELEE] : 1,
    [ITEMTYPE.MANA] : 1,
    [ITEMTYPE.ENERGY_SHARD] : 1,
    [ITEMTYPE.ENERGY_CRYSTAL] : 1,
    [ITEMTYPE.QUIVER] : 1,
    [ITEMTYPE.BOMB_BAG] : 1,
}

export const GOOD_STACKS: number[] = [
    STACKTYPE.Dodge,
    STACKTYPE.Cure,
    STACKTYPE.Steady,
    STACKTYPE.Charge,
    STACKTYPE.Revenge,
    STACKTYPE.Block,
    STACKTYPE.Reflect,
    STACKTYPE.Revive
]

export const stacks : { [key: number]: { level: number, name: string, description: string, cost: number, sell: number, anti: number } } = {
    [STACKTYPE.Dodge] : {
        level : 1,
        name : "Dodge",
        description: "Use 1 Dodge stack to avoid being damaged from 1 bomb or arrow.",
        cost: 4,
        sell: 2,
        anti: STACKTYPE.Slow
    },
    [STACKTYPE.Cure] : {
        level : 1,
        name : "Cure",
        description: "At the beginning of your turn, roll a dice to recover health or cancel a void stack.",
        cost: 4,
        sell: 2,
        anti: STACKTYPE.Void
    },
    [STACKTYPE.Steady] : {
        level : 1,
        name : "Steady",
        description: "Use 1 steady stack to avoid 1 push or pull perk.",
        cost: 2,
        sell: 1,
        anti: -1
    },
    [STACKTYPE.Charge] : {
        level : 1,
        name : "Charge",
        description: "Use 1 charge stack with your next attack. Double ultimate move gage.",
        cost: 2,
        sell: 1,
        anti: -1
    },
    [STACKTYPE.Block] : {
        level : 1,
        name : "Block",
        description: "Use 1 block stack to roll 1 dice and subtract damage from the next attack.",
        cost: 4,
        sell: 2,
        anti: -1
    },
    [STACKTYPE.Reflect] : {
        level : 1,
        name : "Reflect",
        description: "When hit with magic, use 1 reflect stack to subtract from the damage and deal it in revenge damage.",
        cost: 6,
        sell: 3,
        anti: -1
    },
    [STACKTYPE.Revive] : {
        level : 1,
        name : "Revive",
        description: "If you are killed, revive on your next turn with 10 HP and all items.",
        cost: 25,
        sell: 12,
        anti: -1
    },
    [STACKTYPE.Void] : {
        level : 1,
        name : "Void",
        description: "At the beginning of your turn, roll a dice to take damage from 1 Void stack.",
        cost: -1,
        sell: -1,
        anti: STACKTYPE.Cure
    },
    [STACKTYPE.Burn] : {
        level : 1,
        name : "Burn",
        description: "At the beginning of your turn, roll a dice to take damage from 1 fire stack.",
        cost: 4,
        sell: -1,
        anti: STACKTYPE.Freeze
    },
    [STACKTYPE.Freeze] : {
        level : 1,
        name : "Freeze",
        description: "At the beginning of your turn, roll a dice to subtract from energy.",
        cost: 4,
        sell: -1,
        anti: STACKTYPE.Burn
    },
    [STACKTYPE.Slow] : {
        level : 1,
        name : "Slow",
        description: "At the beginning of your turni roll a dice to subtract your energy and from your ultimate move gage.",
        cost: -1,
        sell: -1,
        anti: STACKTYPE.Dodge
    },
    [STACKTYPE.Revenge] : {
        level : 1,
        name : "Revenge",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 4,
        sell: 2,
        anti: -1
    },
    [STACKTYPE.Dodge2] : {
        level : 1,
        name : "Revenge2",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 7,
        sell: -1,
        anti: -1
    },
    [STACKTYPE.Cure2] : {
        level : 1,
        name : "Cure2",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 11,
        sell: -1,
        anti: -1
    },
    [STACKTYPE.Charge2] : {
        level : 1,
        name : "Charge2",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 3,
        sell: -1,
        anti: -1
    },
    [STACKTYPE.Barrier2] : {
        level : 1,
        name : "Barrier2",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 7,
        sell: -1,
        anti: -1
    },
    [STACKTYPE.Steady2] : {
        level : 1,
        name : "Steady2",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 3,
        sell: -1,
        anti: -1
    },
    [STACKTYPE.Revenge2] : {
        level : 1,
        name : "Revenge2",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 7,
        sell: -1,
        anti: -1
    },
    [STACKTYPE.Block2] : {
        level : 1,
        name : "Block2",
        description: "When hit with a melee attack, roll 1 dice roll to deal revenge damage.",
        cost: 7,
        sell: -1,
        anti: -1
    },
}

export const perks: {[key : number] : { name : string, description : string }} = {
    [PERKTYPE.Push] : {
        name : "Push",
        description : "Push the defending player 1 square away from the attacking player."
    },
    [PERKTYPE.Pull] : {
        name : "Pull",
        description : "Pull the defending player 1 square toward the attacking player."
    },
    [PERKTYPE.Vampire] : {
        name : "Vampire",
        description : "Recover 1 health for every 1 damage dealt with Vampire."
    },
    [PERKTYPE.XRay] : {
        name : "XRay",
        description : "X-Ray attacks can ignore walls."
    },
    [PERKTYPE.AreaOfEffect] : {
        name : "AreaOfEffect",
        description : "The attack can affect multiple players within a given range."
    },
}

export const powers: { [key: number]: { level: number, name: string} } = {
    [0] : {
        level: 1,
        name: "Sword",
    },
    [12] : {
        level: 2,
        name: "Sword"
    },
    [24] : {
        level: 3,
        name: "Sword"
    },
    [1] : {
        level: 1,
        name: "Axe"
    },
    [13] : {
        level: 2,
        name: "Axe"
    },
    [25] : {
        level: 3,
        name: "Axe"
    },
    [2] : {
        level: 1,
        name: "Spear"
    },
    [14] : {
        level: 2,
        name: "Spear"
    },
    [26] : {
        level: 3,
        name: "Spear"
    },
    [3] : {
        level: 1,
        name: "Shield"
    },
    [15] : {
        level: 2,
        name: "Shield"
    },
    [27] : {
        level: 3,
        name: "Shield"
    },
    [4] : {
        level: 1,
        name: "Bow"
    },
    [16] : {
        level: 2,
        name: "Bow"
    },
    [28] : {
        level: 3,
        name: "Bow"
    },
    [5] : {
        level: 1,
        name: "CrossBow"
    },
    [17] : {
        level: 2,
        name: "CrossBow"
    },
    [29] : {
        level: 3,
        name: "CrossBow"
    },
    [6] : {
        level: 1,
        name: "Cannon"
    },
    [18] : {
        level: 2,
        name: "Cannon"
    },
    [30] : {
        level: 3,
        name: "Cannon"
    },
    [7] : {
        level: 1,
        name: "Armor"
    },
    [19] : {
        level: 2,
        name: "Armor"
    },
    [31] : {
        level: 3,
        name: "Armor"
    },
    [8] : {
        level: 1,
        name: "Fire Crystal"
    },
    [20] : {
        level: 2,
        name: "Fire Crystal"
    },
    [32] : {
        level: 3,
        name: "Fire Crystal"
    },
    [9] : {
        level: 1,
        name: "Ice Crystal"
    },
    [21] : {
        level: 2,
        name: "Ice Crystal"
    },
    [33] : {
        level: 3,
        name: "Ice Crystal"
    },
    [10] : {
        level: 1,
        name: "Holy Crystal"
    },
    [22] : {
        level: 2,
        name: "Holy Crystal"
    },
    [34] : {
        level: 3,
        name: "Holy Crystal"
    },
    [11] : {
        level: 1,
        name: "Void Crystal"
    },
    [23] : {
        level: 2,
        name: "Void Crystal"
    },
    [35] : {
        level: 3,
        name: "Void Crystal"
    },
}

export const itemResults: {[key: number]: {heart?: number, energy?: number, ultimate?: number, stackId?: number, powerId?: number, perkId?: number}} = {
    [ITEMTYPE.BOMB]: {
        heart: -3
    },
    [ITEMTYPE.CALTROP_BOMB]: {
        energy: -4,
        ultimate: -4
    },
    [ITEMTYPE.FIRE_BOMB]: {
        heart: -4,
        stackId: STACKTYPE.Burn
    },
    [ITEMTYPE.ICE_BOMB]: {
        heart: -3,
        energy: -2,
        stackId: STACKTYPE.Freeze
    },
    [ITEMTYPE.VOID_BOMB]: {
        heart: -5,
        stackId: STACKTYPE.Void
    },
    [ITEMTYPE.ARROW] : {
        heart : -2
    },
    [ITEMTYPE.BOMB_ARROW] : {
        heart : -6,
        perkId : PERKTYPE.Push
    },
    [ITEMTYPE.FIRE_ARROW] : {
        heart : -3,
        stackId : STACKTYPE.Burn
    },
    [ITEMTYPE.ICE_ARROW] : {
        energy : -3,
        ultimate : -5,
        stackId : STACKTYPE.Freeze
    },
    [ITEMTYPE.VOID_ARROW] : {
        heart : -4,
        stackId : STACKTYPE.Void
    },
    [ITEMTYPE.POTION] : {
        heart : 5
    },
    [ITEMTYPE.ELIXIR] : {
        energy : 10,
        stackId : STACKTYPE.Dodge
    }
}

export const ITEMDETAIL: {[key: number]: {level: number, cost: number, sell: number, name: string, percent: number, isDouble?: boolean}} = {
    [ITEMTYPE.HEART_PIECE]: {
        level: 1,
        cost: 4,
        sell: -1,
        name: "Heart Piece",
        percent: 7
    },
    [ITEMTYPE.ENERGY_SHARD]: {
        level: 1,
        cost: 4,
        sell: -1,
        name: "Energy Shard",
        percent: 8
    },
    [ITEMTYPE.POTION]: {
        level: 1,
        cost: 6,
        sell: 3,
        name: "Potion",
        percent: 6
    },
    [ITEMTYPE.FEATHER]: {
        level: 1,
        cost: 6,
        sell: 3,
        name: "Feather",
        percent: 7
    },
    [ITEMTYPE.ARROW]: {
        level: 1,
        cost: 4,
        sell: 2,
        name: "Arrow",
        percent: 9.5
    },
    [ITEMTYPE.BOMB]: {
        level: 1,
        cost: 6,
        sell: 3,
        name: "Bomb",
        percent: 8.1
    },
    [ITEMTYPE.HEART_CRYSTAL]: {
        level: 2,
        cost: 12,
        sell: -1,
        name: "Heart Crystal",
        percent: 3.6
    },
    [ITEMTYPE.ENERGY_CRYSTAL]: {
        level: 2,
        cost: 11,
        sell: -1,
        name: "Energy Crystal",
        percent: 3.6
    },
    [ITEMTYPE.MELEE]: {
        level: 2,
        cost: 8,
        sell: -1,
        name: "Melee",
        percent: 4.8
    },
    [ITEMTYPE.MANA]: {
        level: 2,
        cost: 8,
        sell: -1,
        name: "Mana",
        percent: 5
    },
    [ITEMTYPE.WARP_CRYSTAL]: {
        level: 2,
        cost: 12,
        sell: 6,
        name: "Warp Crystal",
        percent: 5
    },
    [ITEMTYPE.ELIXIR]: {
        level: 2,
        cost: 10,
        sell: 5,
        name: "Elixir",
        percent: 5
    },
    [ITEMTYPE.QUIVER]: {
        level: 2,
        cost: 8,
        sell: -1,
        name: "Quiver",
        percent: 5,
    },
    [ITEMTYPE.BOMB_BAG]: {
        level: 2,
        cost: 8,
        sell: -1,
        name: "Bomb Bag",
        percent: 3.6
    },
    [ITEMTYPE.BOMB_ARROW]: {
        level: 2,
        cost: 8,
        sell: 4,
        name: "Bomb Arrow",
        percent: 7.2
    },
    [ITEMTYPE.FIRE_ARROW]: {
        level: 2,
        cost: 8,
        sell: 4,
        name: "Fire Arrow",
        percent: 6
    },
    [ITEMTYPE.ICE_ARROW]: {
        level: 2,
        cost: 8,
        sell: 4,
        name: "Ice Arrow",
        percent: 6
    },
    [ITEMTYPE.VOID_ARROW]: {
        level: 2,
        cost: 8,
        sell: 4,
        name: "Void Arrow",
        percent: 6
    },
    [ITEMTYPE.FIRE_BOMB]: {
        level: 2,
        cost: 10,
        sell: 5,
        name: "Fire Bomb",
        percent: 5
    },
    [ITEMTYPE.ICE_BOMB]: {
        level: 2,
        cost: 10,
        sell: 5,
        name: "Ice Bomb",
        percent: 5
    },
    [ITEMTYPE.VOID_BOMB]: {
        level: 2,
        cost: 10,
        sell: 5,
        name: "Void Bomb",
        percent: 5
    },
    [ITEMTYPE.CALTROP_BOMB]: {
        level: 2,
        cost: 10,
        sell: 5,
        name: "Caltrops",
        percent: 5
    },
    [ITEMTYPE.ICE_TEA]: {
        level: 1,
        cost: 2,
        sell: 1,
        name: "Ice Tea",
        percent: 7
    },
    [ITEMTYPE.FLAME_CHILI]: {
        level: 1,
        cost: 2,
        sell: 1,
        name: "Flame Chili",
        percent: 7,
    },
    [ITEMTYPE.FLAME_CHILI2]: {
        level: 1,
        cost: 3,
        sell: -1,
        name: "Flame Chili2",
        percent: 5,
        isDouble: true
    },
    [ITEMTYPE.FLAME_CHILI3]: {
        level: 1,
        cost: 4,
        sell: -1,
        name: "Flame Chili3",
        percent: 3,
        isDouble: true
    },
    [ITEMTYPE.ICE_TEA2]: {
        level: 1,
        cost: 3,
        sell: -1,
        name: "Ice Tea2",
        percent: 5,
        isDouble: true
    },
    [ITEMTYPE.ICE_TEA3]: {
        level: 1,
        cost: 4,
        sell: -1,
        name: "Ice Tea3",
        percent: 3,
        isDouble: true
    },
    [ITEMTYPE.HEART_PIECE2]: {
        level: 1,
        cost: 7,
        sell: -1,
        name: "Heart Piece3",
        percent: 1,
        isDouble: true
    },
    [ITEMTYPE.POTION2]: {
        level: 1,
        cost: 10,
        sell: -1,
        name: "Potion2",
        percent: 3,
        isDouble: true
    },
    [ITEMTYPE.POTION3]: {
        level: 1,
        cost: 15,
        sell: -1,
        name: "Potion3",
        percent: 1.5,
        isDouble: true
    },
    [ITEMTYPE.FEATHER2]: {
        level: 1,
        cost: 10,
        sell: -1,
        name: "Feather2",
        percent: 3,
        isDouble: true
    },
    [ITEMTYPE.FEATHER3]: {
        level: 1,
        cost: 14,
        sell: -1,
        name: "Feather3",
        percent: 1.5,
        isDouble: true
    },
    [ITEMTYPE.ARROW2]: {
        level: 1,
        cost: 7,
        sell: -1,
        name: "Arrow2",
        percent: 5.1,
        isDouble: true
    },
    [ITEMTYPE.ARROW3]: {
        level: 1,
        cost: 10,
        sell: -1,
        name: "Arrow3",
        percent: 3,
        isDouble: true
    },
    [ITEMTYPE.BOMB2]: {
        level: 1,
        cost: 10,
        sell: -1,
        name: "Bomb 2",
        percent: 3,
        isDouble: true
    },
    [ITEMTYPE.BOMB3]: {
        level: 1,
        cost: 14,
        sell: -1,
        name: "Bomb 3",
        percent: 1.5,
        isDouble: true
    },

    [ITEMTYPE.MELEE2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "Melee + 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.MANA2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "Mana + 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.QUIVER2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "Arrow + 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.BOMB_BAG2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "BOMB + 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.ELIXIR2]: {
        level: 2,
        cost: 17,
        sell: -1,
        name: "Elixir + 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.WARP_CRYSTAL2]: {
        level: 2,
        cost: 17,
        sell: -1,
        name: "Warp Crystal 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.BOMB_ARROW2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "Bomb Arrow 2",
        percent: 2.4,
        isDouble: true
    },
    [ITEMTYPE.FIRE_ARROW2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "Fire Arrow 2",
        percent: 2.4,
        isDouble: true
    },
    [ITEMTYPE.ICE_ARROW2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "Ice Arrow 2",
        percent: 2.4,
        isDouble: true
    },
    [ITEMTYPE.VOID_ARROW2]: {
        level: 2,
        cost: 15,
        sell: -1,
        name: "Void Arrow 2",
        percent: 2.4,
        isDouble: true
    },
    [ITEMTYPE.CALTROP_BOMB2]: {
        level: 2,
        cost: 17,
        sell: -1,
        name: "Caltrop Bomb 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.FIRE_BOMB2]: {
        level: 2,
        cost: 17,
        sell: -1,
        name: "Fire Bomb 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.ICE_BOMB2]: {
        level: 2,
        cost: 17,
        sell: -1,
        name: "Ice Bomb 2",
        percent: 1.2,
        isDouble: true
    },
    [ITEMTYPE.VOID_BOMB2]: {
        level: 2,
        cost: 17,
        sell: -1,
        name: "Void Bomb 2",
        percent: 1.2,
        isDouble: true
    },
}

export const POWERCOSTS: {[key: number]: {cost: number, sell: number}} = {
    [1] : {
        cost: 8,
        sell: 4
    },
    [2] : {
        cost: -1,
        sell: 8
    },
    [3]: {
        cost: -1,
        sell: 15
    }
}

export const QUESTS: {[key: number]: {id: number, title: string, normal: string, hard: string, level: number, condition: Object}} = {
    [QUESTTYPE.SLAYER]: {
        id: QUESTTYPE.SLAYER,
        title: "SLAYERS GONNA SLAY",
        normal: "Get 3 kills",
        hard: "Get 6 kills",
        condition: {},
        level: 1
    },
    [QUESTTYPE.GLITTER]: {
        id: QUESTTYPE.GLITTER,
        title: "ALL THAT GLITTERS",
        normal: "Get 20 gold",
        hard: "Get 40 gold",
        condition: {},
        level: 1
    },
    [QUESTTYPE.KILL]: {
        id: QUESTTYPE.KILL,
        title: "LICENSE TO KILL",
        normal: "Kill a Green Monster",
        hard: "Kill a Yellow Monster",
        condition: {},
        level: 1
    },
    [QUESTTYPE.CRAFTS]: {
        id: QUESTTYPE.CRAFTS,
        title: "ARTS & CRAFTS",
        normal: "Craft 2 items",
        hard: "Craft 4 items",
        condition: {},
        level: 1
    },
    [QUESTTYPE.LUCK]: {
        id: QUESTTYPE.LUCK,
        title: "LUCK OF THE DRAW",
        normal: "Get 4 Treasures/ItemBags",
        hard: "Get 8 Treasures/ItemBags",
        condition: {},
        level: 1
    },
    [QUESTTYPE.ENERGY]: {
        id: QUESTTYPE.ENERGY,
        title: "BUNDLE OF ENERGY",
        normal: "Complete 2 Energy Crystal",
        hard: "Complete 4 Energy Crystal",
        condition: {},
        level: 1
    },
    [QUESTTYPE.STRENGTH]: {
        id: QUESTTYPE.STRENGTH,
        title: "THE STRENGTH WITHIN",
        normal: " Get 7 stacks at once",
        hard: " Get 15 stacks at once",
        condition: {},
        level: 1
    },
    [QUESTTYPE.LIFE]: {
        id: QUESTTYPE.LIFE,
        title: "THE MEANING OF LIFE",
        normal: "Complete 2 Heart Crystal",
        hard: "Complete 4 Heart Crystal",
        condition: {},
        level: 1
    },
}

export const CRAFTS_ITEM: {id: number, item1: number, item2: number, coin: number, result: number}[] = [
    {
        id: 0,
        item1: ITEMTYPE.FLAME_CHILI,
        item2: ITEMTYPE.ARROW,
        coin: 1,
        result: ITEMTYPE.FIRE_ARROW
    },
    {
        id: 1,
        item1: ITEMTYPE.FLAME_CHILI,
        item2: ITEMTYPE.BOMB,
        coin: 1,
        result: ITEMTYPE.FIRE_BOMB
    },
    {
        id: 2,
        item1: ITEMTYPE.ICE_TEA,
        item2: ITEMTYPE.ARROW,
        coin: 1,
        result: ITEMTYPE.ICE_ARROW
    },
    {
        id: 3,
        item1: ITEMTYPE.ICE_TEA,
        item2: ITEMTYPE.BOMB,
        coin: 1,
        result: ITEMTYPE.ICE_BOMB
    },
    {
        id: 4,
        item1: ITEMTYPE.FLAME_CHILI,
        item2: ITEMTYPE.FLAME_CHILI,
        coin: 1,
        result: ITEMTYPE.HEART_PIECE
    },
    {
        id: 5,
        item1: ITEMTYPE.ICE_TEA,
        item2: ITEMTYPE.ICE_TEA,
        coin: 1,
        result: ITEMTYPE.ENERGY_SHARD
    },
    {
        id: 6,
        item1: ITEMTYPE.ARROW,
        item2: ITEMTYPE.BOMB,
        coin: 1,
        result: ITEMTYPE.BOMB_ARROW
    },
]

export const DICE_SIX_PERCENT: {[key: number] : number} = {
    [1] : 1,
    [2] : 9,
    [3] : 25,
    [4] : 25,
    [5] : 25,
    [6] : 15,
}

export const DICE_FOUR_PERCENT: {[key: number] : number} = {
    [1] : 10,
    [2] : 60,
    [3] : 25,
    [4] : 5,
}

export const EQUIP_TURN_BONUS = {
    [POWERTYPE.Sword3] : {
        stacks: [
            {
                id: STACKTYPE.Revenge,
                count : 1
            }
        ]
    },
    [POWERTYPE.Axe3]: {
        stacks: [
            {
                id: STACKTYPE.Steady,
                count : 1
            }
        ]
    },
    [POWERTYPE.Spear3]: {
        stacks: [
            {
                id: STACKTYPE.Charge,
                count : 1
            }
        ]
    },
    [POWERTYPE.Shield2]: {
        stacks: [
            {
                id: STACKTYPE.Reflect,
                count : 1
            }
        ]
    },
    [POWERTYPE.Shield3]: {
        stacks: [
            {
                id: STACKTYPE.Steady,
                count : 1
            },
            {
                id: STACKTYPE.Dodge,
                count : 1
            }
        ]
    },
    [POWERTYPE.Armor3]: {
        stacks: [
            {
                id: STACKTYPE.Block,
                count : 1
            }
        ]
    },
    [POWERTYPE.Fire3]: {
        stacks: [
            {
                id: STACKTYPE.Burn,
                count : 1
            }
        ]
    },
    [POWERTYPE.Ice3]: {
        stacks: [
            {
                id: STACKTYPE.Freeze,
                count : 1
            }
        ]
    },
    [POWERTYPE.Holy3]: {
        stacks: [
            {
                id: STACKTYPE.Cure,
                count : 1
            }
        ]
    },
    [POWERTYPE.Void3]: {
        stacks: [
            {
                id: STACKTYPE.Void,
                count : 1
            }
        ]
    },
    [POWERTYPE.Bow1]: {
        items: [
            {
                id: ITEMTYPE.ARROW,
                count : 1
            }
        ]
    },
    [POWERTYPE.Bow2]: {
        items: [
            {
                id: ITEMTYPE.ARROW,
                count : 2
            }
        ]
    },
    [POWERTYPE.Bow3]: {
        items: [
            {
                id: ITEMTYPE.ARROW,
                count : 3
            }
        ]
    },
    [POWERTYPE.CrossBow1]: {
        items: [
            {
                id: ITEMTYPE.ARROW,
                count : 1
            }
        ]
    },
    [POWERTYPE.CrossBow2]: {
        items: [
            {
                id: ITEMTYPE.ARROW,
                count : 1
            }
        ]
    },
    [POWERTYPE.CrossBow3]: {
        items: [
            {
                id: ITEMTYPE.ARROW,
                count : 1
            }
        ],
        randomItems: [
            {
                id: ITEMTYPE.FIRE_ARROW,
                count: 1
            },
            {
                id: ITEMTYPE.ICE_ARROW,
                count: 1
            },
            {
                id: ITEMTYPE.VOID_ARROW,
                count: 1
            },
        ]
    },
    [POWERTYPE.Cannon1]: {
        items: [
            {
                id: ITEMTYPE.BOMB,
                count : 1
            }
        ]
    },
    [POWERTYPE.Cannon2]: {
        items: [
            {
                id: ITEMTYPE.BOMB,
                count : 1
            }
        ],
        stacks: [
            {
                id: STACKTYPE.Steady,
                count: 1
            }
        ]
    },
    [POWERTYPE.Cannon3]: {
        items: [
            {
                id: ITEMTYPE.BOMB,
                count : 1
            }
        ],
        stacks: [
            {
                id: STACKTYPE.Steady,
                count: 1
            }
        ],
        randomItems: [
            {
                id: ITEMTYPE.FIRE_BOMB,
                count: 1
            },
            {
                id: ITEMTYPE.ICE_BOMB,
                count: 1
            },
            {
                id: ITEMTYPE.VOID_BOMB,
                count: 1
            },
        ]
    },
    [POWERTYPE.Holy2]: {
        stacks: [
            {
                id: STACKTYPE.Cure,
                count : 1
            }
        ]
    },
}

export const BAN_STACKS = {
    [STACKTYPE.Cure] : STACKTYPE.Void,
    [STACKTYPE.Void] : STACKTYPE.Cure,
    [STACKTYPE.Burn] : STACKTYPE.Freeze,
    [STACKTYPE.Freeze] : STACKTYPE.Burn,
    [STACKTYPE.Charge] : STACKTYPE.Slow,
    [STACKTYPE.Slow] : STACKTYPE.Charge,

}

export const TURN_TIME = 180;

export const featherStep = 6;