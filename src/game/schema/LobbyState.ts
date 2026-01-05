import { Schema, MapSchema, type } from "@colyseus/schema";
import { RoomData } from "./RoomData";

export class LobbyState extends Schema {
  @type({ map: RoomData })
  rooms = new MapSchema<RoomData>();
}
