
type _PowerCategory = "Melee" | "Neutral" | "Magic"; 

type _Power = {
    id : string,
    name : string,
    class : string,   // like "Bow", or "Sword"
    category : PowerCategory,
}


type _PowerCost = {
    type: "token" | "item" | "health" | "energy" | "melee" | "mana",
    value: number,
}

type _PowerResult = {
    target: "player" | "opponent",
    type: "cost" | "action",

}


type _PowerMove = {
    id : string,
    name : string,
    // results : PowerResult[],
}


// type Token = {}


// health, energy, melee, and mana call all be tokens