export const ITEMTYPE: {[key: string] : number} = {
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
}

export const powermoves = [
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
                id: 8,
                count: 1
            },
        ],
        range: 1,
        light: 3,
        coin: 0,
    },
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
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
        ],
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
                id: 8,
                count: 3
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 2
            },
        ],
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
                id: 8,
                count: 2
            },
        ],
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
                id: 8,
                count: 2
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
        ],
        range: 1,
        light: 4,
        coin: 0,
    },
    {
        // Shield2
        id: 17,
        name: "Magic Shield",
        powerImageId: 15,
        powerIds: [
            15, 27
        ],
        costList: [
            {
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
        range: 0,
        light: 7,
        coin: 0,
    },
    {
        // Shield2
        id: 18,
        name: "Trap Shield",
        powerImageId: 15,
        powerIds: [
            15, 27
        ],
        costList: [
            {
                id: 5,
                count: 1
            },
        ],
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Shield3
        id: 19,
        name: "Shield Charge",
        powerImageId: 27,
        powerIds: [
            27
        ],
        costList: [
            {
                id: 8,
                count: 2
            },
        ],
        range: 1,
        light: 7,
        coin: 0,
    },
    {
        // Shield3
        id: 20,
        name: "Shield Slam",
        powerImageId: 27,
        powerIds: [
            27
        ],
        costList: [
            {
                id: 8,
                count: 2
            },
        ],
        range: 1,
        light: 10,
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
                id: 4,
                count: 1
            },
        ],
        range: 5,
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
                id: 8,
                count: 1
            },
        ],
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
                id: 9,
                count: 1
            },
        ],
        range: 0,
        light: 2,
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
                id: 8,
                count: 1
            },
            {
                id: 4,
                count: 1
            },
        ],
        range: 8,
        light: 8,
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
                id: 9,
                count: 1
            },
            {
                id: 4,
                count: 1
            },
        ],
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
                id: 4,
                count: 1
            },
        ],
        range: 2,
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
                id: 8,
                count: 1
            },
            {
                id: 4,
                count: 1
            },
        ],
        range: 3,
        light: 2,
        coin: 0,
    },
    {
        // CrossBow2
        id: 28,
        name: "Stake",
        powerImageId: 17,
        powerIds: [
            17, 29
        ],
        costList: [
            {
                id: 4,
                count: 1
            },
        ],
        range: 0,
        light: 4,
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
                id: 4,
                count: 1
            },
            {
                id: 5,
                count: 1
            },
        ],
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
                id: 4,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Cannon1
        id: 31,
        name: "Cannoball",
        powerImageId: 6,
        powerIds: [
            6, 18, 30
        ],
        costList: [
            {
                id: 5,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
        ],
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
                id: 9,
                count: 1
            },
            {
                id: 5,
                count: 1
            },
        ],
        range: 0,
        light: 3,
        coin: 0,
    },
    {
        // Cannon3
        id: 34,
        name: "Artillery Strike",
        powerImageId: 30,
        powerIds: [
            30
        ],
        costList: [
            {
                id: 8,
                count: 3
            },
            {
                id: 5,
                count: 3
            },
        ],
        range: 8,
        light: 15,
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
                id: 9,
                count: 1
            },
            {
                id: 5,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
        ],
        range: 0,
        light: 2,
        coin: 0,
    },
    {
        // Armor2
        id: 37,
        name: "Electrify",
        powerImageId: 19,
        powerIds: [
            19, 31
        ],
        costList: [
            {
                id: 9,
                count: 1
            },
        ],
        range: 0,
        light: 2,
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
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 9,
                count: 1
            },
        ],
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
                id: 8,
                count: 1
            },
            {
                id: 9,
                count: 1
            },
        ],
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
                id: 9,
                count: 1
            },
        ],
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
                id: 9,
                count: 1
            },
        ],
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
                id: 5,
                count: 1
            },
            {
                id: 4,
                count: 1
            },
        ],
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
                id: 9,
                count: 2
            },
            {
                id: 4,
                count: 5
            },
        ],
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
                id: 9,
                count: 2
            },
            {
                id: 4,
                count: 4
            },
        ],
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
                id: 9,
                count: 2
            },
        ],
        range: 0,
        light: 5,
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
                id: 9,
                count: 1
            },
        ],
        range: 0,
        light: 5,
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
                id: 9,
                count: 1
            },
            {
                id: 4,
                count: 1
            },
        ],
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
                id: 9,
                count: 2
            },
            {
                id: 4,
                count: 5
            },
        ],
        range: 0,
        light: 15,
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
                id: 9,
                count: 1
            },
            {
                id: 4,
                count: 3
            },
        ],
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
                id: 9,
                count: 1
            },
        ],
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
                id: 9,
                count: 2
            },
            {
                id: 2,
                count: 1
            },
        ],
        range: 0,
        light: 18,
        coin: 0,
    },
    {
        // Holy2
        id: 53,
        name: "Sacred Halo",
        powerImageId: 22,
        powerIds: [
            22, 34
        ],
        costList: [
            {
                id: 9,
                count: 2
            },
        ],
        range: 0,
        light: 8,
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
                id: 9,
                count: 3
            },
            {
                id: 13,
                count: 1
            },
        ],
        range: 0,
        light: 24,
        coin: 0,
    },
    {
        // Holy3
        id: 55,
        name: "Holy Light",
        powerImageId: 34,
        powerIds: [
            34
        ],
        costList: [
            {
                id: 9,
                count: 1
            },
        ],
        range: 0,
        light: 10,
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
                id: 9,
                count: 1
            },
            {
                id: 8,
                count: 1
            },
        ],
        range: 1,
        light: 8,
        coin: 0,
    },
    {
        // Void2
        id: 57,
        name: "Drain",
        powerImageId: 23,
        powerIds: [
            23, 35
        ],
        costList: [
            {
                id: 9,
                count: 2
            },
        ],
        range: 3,
        light: 10,
        coin: 0,
    },
    {
        // Void2
        id: 58,
        name: "Poison",
        powerImageId: 23,
        powerIds: [
            23, 35
        ],
        costList: [
            {
                id: 9,
                count: 1
            },
            {
                id: 5,
                count: 1
            },
        ],
        range: 0,
        light: 10,
        coin: 1,
    },
    {
        // Void3
        id: 59,
        name: "Void Ray",
        powerImageId: 35,
        powerIds: [
            35
        ],
        costList: [
            {
                id: 9,
                count: 3
            },
            {
                id: 5,
                count: 1
            },
        ],
        range: 3,
        light: 13,
        coin: 2,
    },
    {
        // Void3
        id: 60,
        name: "Steal",
        powerImageId: 35,
        powerIds: [
            35
        ],
        costList: [
            {
                id: 8,
                count: 2
            },
        ],
        range: 1,
        light: 7,
        coin: 0,
    },
]

export const powers: { [key: number]: { level: number, name: string } } = {
    [0] : {
        level: 1,
        name: "Sword"
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

export const itemResults: {[key: number]: {heart?: number, energy?: number, ultimate?: number, stackId?: number, powerId?: number}} = {
    [ITEMTYPE.BOMB]: {
        heart: -3
    },
    [ITEMTYPE.CALTROP_BOMB]: {
        energy: -4,
        ultimate: -4
    },
    [ITEMTYPE.FIRE_BOMB]: {
        heart: -4,
        stackId: 1
    },
    [ITEMTYPE.ICE_BOMB]: {
        heart: -3,
        energy: -2,
        stackId: 3
    },
    [ITEMTYPE.VOID_BOMB]: {
        heart: -5,
        stackId: 4
    }
}
