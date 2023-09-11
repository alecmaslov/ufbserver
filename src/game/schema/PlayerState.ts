import { Schema, type } from "@colyseus/schema";

const DEFAULT_HEALTH = 23;
const DEFAULT_ENERGY = 999;

export class PlayerStats extends Schema {
    @type("number") health: number = DEFAULT_HEALTH;
    @type("number") energy: number = DEFAULT_ENERGY;
}

export class PlayerState extends Schema {
    @type("string") id: string = "";
    @type("string") displayName: string = "";
    @type("string") sessionId: string = "";
    @type("string") characterId: string = "";
    @type("string") mapName: string = "";
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type(PlayerStats) stats: PlayerStats = new PlayerStats();
}
