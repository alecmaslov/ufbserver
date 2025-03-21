import { Schema, type, ArraySchema } from "@colyseus/schema";

const DEFAULT_HEALTH = 40;
const DEFAULT_ENERGY = 20;
const DEFAULT_ULTIMATE = 100;

export class RangedValueState extends Schema {
    @type("number") current: number = 0;
    @type("number") max: number = 0;
    @type("number") min: number = 0;

    add(amount: number) {
        this.current += amount;
        let total = this.current;
        this.current = Math.max(this.min, Math.min(this.current, this.max));
        return total = this.current;
    }

    setToMax() {
        this.current = this.max;   
    }

    setMaxValue(val : number) {
        this.max = val;
    }

    constructor(current: number, max: number, min: number = 0) {
        super();
        this.current = current;
        this.max = max;
        this.min = min;
    }
}

export class CharacterStatsState extends Schema {
    @type(RangedValueState) health: RangedValueState = new RangedValueState(
        DEFAULT_HEALTH,
        DEFAULT_HEALTH
    );
    @type(RangedValueState) energy: RangedValueState = new RangedValueState(
        DEFAULT_ENERGY,
        DEFAULT_ENERGY
    );
    @type(RangedValueState) ultimate: RangedValueState = new RangedValueState(
        0,
        DEFAULT_ULTIMATE
    );
    @type("boolean") isRevive = false;
    @type("int32") coin: number = 0;
    @type("int32") range: number = 0;
    @type("int32") bags: number = 0;
    @type("int16") arrowLimit: number = 3;
    @type("int16") bombLimit: number = 3;
    @type("int8") maxMelee: number = 2;
    @type("int8") maxMana: number = 2;
}

export class CoordinatesState extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
}

export class Item extends Schema {
    @type("int32") id: number = 0;
    @type("string") name: string = "";
    @type("string") description: string = "";
    @type("int16") count: number = 0;
    @type("int16") level: number = 1;
    @type("int16") cost: number = -1;
    @type("int16") sell: number = -1;
}

export class Quest extends Schema {
    @type("int32") id: number = 0;
    @type("string") name: string = "";
    @type("string") description: string = "";
    @type("int16") level: number = 1;
    @type("int32") itemId: number = 0;
    @type("int32") powerId: number = 0;
    @type("int32") melee: number = 0;
    @type("int32") mana: number = 0;
    @type("int32") coin: number = 0;
}

export class CharacterState extends Schema {
    @type("string") id: string = "";
    @type("string") displayName: string = "";
    @type("string") sessionId: string = "";
    @type("string") characterId: string = "";
    @type("string") characterClass: string = "";
    @type("boolean") connected: boolean = false;
    @type("string") mapName: string = "";
    // @kyle - What if instead of sending CoordinatesState, we send tileId?
    @type("string") currentTileId: string = "";
    @type("int8") type: number = 1;
    @type(CoordinatesState) coordinates: CoordinatesState =
        new CoordinatesState();
    @type(CharacterStatsState) stats: CharacterStatsState =
        new CharacterStatsState();
    @type([Item]) items : ArraySchema<Item> = new ArraySchema<Item>();
    @type([Item]) powers : ArraySchema<Item> = new ArraySchema<Item>();
    @type([Item]) stacks : ArraySchema<Item> = new ArraySchema<Item>();
    @type([Item]) equipSlots: ArraySchema<Item> = new ArraySchema<Item>();
    @type([Quest]) quests : ArraySchema<Quest> = new ArraySchema<Quest>();

}


