import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import { CharacterState } from "./CharacterState";
import { MapState } from "./MapState";

export class UfbRoomState extends Schema {
  @type({ map: CharacterState }) players: MapSchema<CharacterState> = new MapSchema<CharacterState>();
  /** array of player ids */
  @type(MapState) map: MapState = new MapState();
  @type("number") turn: number = 0;
  @type(["string"]) turnOrder: ArraySchema<string> = new ArraySchema<string>();
  @type("string") currentPlayerId: string = "";
}
