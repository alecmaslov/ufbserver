// LobbyState.ts
import { Schema, MapSchema, type } from "@colyseus/schema";

export class LobbyRoomInfo extends Schema {
  @type("string") roomId: string;
  @type("string") name : string;
  @type("number") maxPlayers : number;
  @type("number") playerCount : number;
}

export class LobbyState extends Schema {
  @type({ map: LobbyRoomInfo }) rooms = new MapSchema<LobbyRoomInfo>();
}
