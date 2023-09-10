import { Schema, type } from "@colyseus/schema";

const DEFAULT_HEALTH = 23;
const DEFAULT_ENERGY = 20;

export class PlayerStats extends Schema {
    constructor() {
        super();
        this.health = DEFAULT_HEALTH;
        this.energy = DEFAULT_ENERGY;
    }
    @type("number") health: number;
    @type("number") energy: number;
}

export class PlayerState extends Schema {
    constructor() {
        super();
        this.id = "";
        this.x = 0;
        this.y = 0;
        this.stats = new PlayerStats();
    }
    @type("string") id: string;
    @type("number") x: number;
    @type("number") y: number;
    @type(PlayerStats) stats: PlayerStats;

    // @type("number") health: number = 23;
    // @type("number") energy: number = 20;
}
