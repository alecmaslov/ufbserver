// WaitingState.ts
import { Schema, ArraySchema, type } from "@colyseus/schema";

export class Player extends Schema {
    @type("string") id: string;
    @type("string") sessionId: string;
    @type("string") characterClass: string;
    @type("string") displayName: string;
    @type("number") joinIndex: number;
}

export class WaitingState extends Schema {
    @type("string") roomId : string;
    @type("string") ownerId : string;
    @type("string") mapName: string;
    @type("number") maxPlayers : number;
    @type([Player]) players = new ArraySchema<Player>();
}
