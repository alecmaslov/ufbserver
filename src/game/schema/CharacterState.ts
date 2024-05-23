import { Schema, type, ArraySchema } from "@colyseus/schema";

const DEFAULT_HEALTH = 23;
const DEFAULT_ENERGY = 23;
const DEFAULT_ULTIMATE = 23;

export class RangedValueState extends Schema {
    @type("number") current: number = 0;
    @type("number") max: number = 0;
    @type("number") min: number = 0;

    add(amount: number) {
        this.current += amount;
        this.current = Math.max(this.min, Math.min(this.current, this.max));
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
    @type("int32") coin: number = 0;
    @type("int32") bags: number = 0;
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
    @type("int16") cost: number = 1;
}

export class CharacterState extends Schema {
    @type("string") id: string = "";
    @type("string") displayName: string = "";
    @type("string") sessionId: string = "";
    @type("string") characterId: string = "";
    @type("string") characterClass: string = "";
    @type("string") mapName: string = "";
    // @kyle - What if instead of sending CoordinatesState, we send tileId?
    @type("string") currentTileId: string = "";
    @type(CoordinatesState) coordinates: CoordinatesState =
        new CoordinatesState();
    @type(CharacterStatsState) stats: CharacterStatsState =
        new CharacterStatsState();
    @type([Item]) items : ArraySchema<Item> = new ArraySchema<Item>();
    @type([Item]) powers : ArraySchema<Item> = new ArraySchema<Item>();
    @type([Item]) stacks : ArraySchema<Item> = new ArraySchema<Item>();
    @type([Item]) equipSlots: ArraySchema<Item> = new ArraySchema<Item>();
}


