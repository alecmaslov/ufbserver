// some items are equippable.
// that means they can be considered "powers"
type ResourceType = "Health" | "Energy" | "Mana" | "Melee" | "Gold" | "Item";

type TargetType = "Self" | "Enemy" | "Ally" | "Area";

// setMax is for things like setting the max energy or health higher
type ActionType =
    // | "Damage"
    // | "Heal"
    | "Buff"
    | "Debuff" // reduces a stat
    | "SetMax" // sets the max value of a stat (like health or energy)
    | "Summon"
    | "Utility"// for things like teleporting or moving
    | "Bonus"
    | "PowerBoost"; // powerboost modifies the attack

type AmountModifier = "Roll" | "Random" | "Max"; // roll = 1-6; random = range of target value

// an item can be collected from the world in different places
type Item = {
    id: string;
    name: string;
    prototype?: string; // here's how we can inherit from other items
    description?: string;
    category: string;
    isEquippable: boolean;
    behaviors: ItemBehavior[];
};

type ItemBehavior = {
    name: string; // @default("Default"), covers things like "Ice Arrow", "Poison Arrow", "Fire Arrow", etc
    behaviorType: "Hold" | "Equip" | "Use";
    requiredStates: string[];
    costs?: Cost[];
    effects?: ItemEffect[];
    range?: {
        type: "Linear" | "Radius";
        distance: number;
    };
};

// defines how the application will react to the use of an item
type ItemEffect = {
    action: ActionType;
    target: TargetType;
    stat?: string;
    description?: string;
    amount?: number; // Optional, used for quantifiable effects like damage or heal
    amountModifier?: AmountModifier; // roll = 1-6; random = range of target value
    duration?: number; // For effects with a time component, sets a timeout
    isRecurring?: boolean; // Any effect that is applied every turn
};

type Cost = {
    resource: ResourceType;
    amount: number;
    amountModifier?: AmountModifier; // roll = 1-6; random = range of target value
};

// type StateChange = {
//     action: ActionType;
//     target: TargetType;
//     description?: string;
//     amount?: number;
//     amountModifier?: "Roll" | "Random" | "Max";
//     duration?: number;
//     isRecurring?: boolean;
//     range?: {
//         type: "Linear" | "Radius";
//         distance: number;
//     };
// };

// effects: ItemEffect[];

// {
//     "name": "Fighter Stance",
//     "costs": [
//         { "resource": "Melee", "amount": -2 },
//         { "resource": "Energy", "amount": -1 }
//     ],
//     "effects": [
//         {
//             "action": "Buff",
//             "target": "Self",
//             "description": "Increases defense",
//             "amount": 1,
//             "duration": 1
//         }
//     ]
// },
// {
//     "name": "Holy Sword",
//     "costs": [
//         { "resource": "Melee", "amount": -5 },
//         { "resource": "Energy", "amount": -1 }
//     ],
//     "effects": [
//         {
//             "action": "Damage",
//             "target": "Enemy",
//             "amount": 5,
//             "range": { "type": "Linear", "distance": 1 }
//         },
//         { "action": "Heal", "target": "Self", "amount": 1 }
//     ]
// }

// model Power {
//   id         String      @id @default(cuid())
//   name       String
//   level      Int
//   powerMoves PowerMove[]

//   @@unique([name, level])
// }

// model PowerMove {
//   id       String @id @default(cuid())
//   powerId  String
//   moveName String
//   cost     Json // should be a list of jsons but mysql doesn't support that
//   result   Json
//   range    Json?
//   bonus    Json?

//   power Power @relation(fields: [powerId], references: [id])
// }

// // model PowerMoveCost {

// // }

// model PowerResult {
//   id String @id @default(cuid())
// }