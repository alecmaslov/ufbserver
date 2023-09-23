import { Schema, type } from "@colyseus/schema";

const DEFAULT_HEALTH = 23;
const DEFAULT_ENERGY = 999;

export class CharacterStats extends Schema {
    @type("number") health: number = DEFAULT_HEALTH;
    @type("number") energy: number = DEFAULT_ENERGY;
}

export class CoordinatesSchema extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
}

export class CharacterState extends Schema {
    @type("string") id: string = "";
    @type("string") displayName: string = "";
    @type("string") sessionId: string = "";
    @type("string") characterId: string = "";
    @type("string") mapName: string = "";
    @type(CoordinatesSchema) coordinates: CoordinatesSchema = new CoordinatesSchema();
    @type(CharacterStats) stats: CharacterStats = new CharacterStats();
}
