// type PowerCategory = "Melee" | "Neutral" | "Magic";

// type ResourceType = "Health" | "Energy" | "Mana" | "Melee" | "Gold" | "Item";

// type TargetType = "Self" | "Enemy" | "Ally" | "Area";

// type ActionType = "Damage" | "Heal" | "Buff" | "Debuff" | "Summon" | "Utility";

// type BonusAbility = ""

// one time use vs stack

type Power = {
    // id: string;
    // name: string;
    category: string;
    moves: PowerMove[];
    // equipBonus?: null;
};

type PowerRange = {
    isArea?: boolean;
    min?: number;
    max: number;
};

type PowerMove = {
    id: string;
    name: string;
    description: string;
    cost: PowerCost[];
    effects: PowerEffect[];
    range?: PowerRange;
};

type PowerCost = {
    resource: ResourceType;
    amount: number;
};

type PowerEffect = {
    action: ActionType;
    target: TargetType;
    description?: string;
    magnitude?: number; // Optional, used for quantifiable effects like damage or heal
    magnitudeModifier?: "Roll" | "Random" | "Max"; // roll is 6 vs random which is range of target value or whatever it may be
    duration?: number; // Optional, for effects with a time component
};

type PowerBonus = {
    // type: 
    isRecurring: boolean;
    isStackable: boolean;
}

// some items come with powers. For instance, sword
// sword comes with a set of powers and perks