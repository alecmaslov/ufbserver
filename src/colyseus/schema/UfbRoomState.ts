import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { MapState } from "./MapState";

export class UfbRoomState extends Schema {
  @type("string") mapName: string = "Kraken!";
  @type("number") boardWidth: number = 10;
  @type("number") boardHeight: number = 10;
  @type("number") turn: number = 0;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  /** array of player ids */
  @type(MapState) map = new MapState();
  
  @type(["string"]) turnOrder = new ArraySchema<string>();
  @type("string") currentPlayerId = "";
}
