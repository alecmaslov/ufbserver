import { Schema, type } from "@colyseus/schema";

export class PlayerStats extends Schema {
    @type("number") health: number = 23;
    @type("number") energy: number = 20;
}

export class PlayerState extends Schema {
    @type("string") id: string;
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type(PlayerStats) stats: PlayerStats;

    // @type("number") health: number = 23;
    // @type("number") energy: number = 20;
}
