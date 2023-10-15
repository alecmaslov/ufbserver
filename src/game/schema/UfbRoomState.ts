import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";
import { CharacterState } from "#game/schema/CharacterState";
import { MapState } from "#game/schema/MapState";

export class UfbRoomState extends Schema {
  // maps characterId to CharacterState
  @type({ map: CharacterState }) characters: MapSchema<CharacterState> = new MapSchema<CharacterState>();
  // maps playerId to characterId
  @type({ map: "string" }) playerCharacters: MapSchema<string> = new MapSchema<string>();
  /** array of player ids */
  @type(MapState) map: MapState = new MapState();
  @type("number") turn: number = 0;
  /** turnOrder contains character ids */
  @type(["string"]) turnOrder: ArraySchema<string> = new ArraySchema<string>();
  @type("string") currentCharacterId: string = "";
}
