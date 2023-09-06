import { Schema, MapSchema, Context, type } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";

export class UfbRoomState extends Schema {
  @type("string") mapName: string = "Kraken!";
  @type("number") boardWidth: number = 10;
  @type("number") boardHeight: number = 10;
  @type("number") turn: number = 0;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
