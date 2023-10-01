import { Schema, type } from "@colyseus/schema";

const DEFAULT_HEALTH = 23;
const DEFAULT_ENERGY = 23;

export class RangedValueState extends Schema {
    @type("number") current: number = 0;
    @type("number") max: number = 0;
    @type("number") min: number = 0;

    add(amount: number) {
        this.current += amount;
        this.current = Math.max(this.min, Math.min(this.current, this.max));
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
}

export class CoordinatesState extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
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
}
