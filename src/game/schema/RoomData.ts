import { Schema, type } from "@colyseus/schema";

export class RoomData extends Schema {
  @type("string") id!: string;
  @type("string") name!: string;
  @type("number") maxPlayers!: number;
  @type("number") playerCount: number = 0;
  @type("string") ownerId!: string;
  @type("string") inviteToken?: string;
  @type("boolean") isPrivate: boolean = false;
}
