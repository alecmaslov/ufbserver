import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { MapState } from "./MapState";

export class UfbRoomState extends Schema {
  @type({ map: PlayerState }) players: MapSchema<PlayerState> = new MapSchema<PlayerState>();
  /** array of player ids */
  @type(MapState) map: MapState = new MapState();
  @type("number") turn: number = 0;
  @type(["string"]) turnOrder: ArraySchema<string> = new ArraySchema<string>();
  @type("string") currentPlayerId: string = "";
}
