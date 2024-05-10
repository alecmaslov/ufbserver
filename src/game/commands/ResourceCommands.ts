import { Command } from "@colyseus/command";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getClientCharacter } from "#game/helpers/room-helpers";
import { coordToGameId, fillPathWithCoords, getTileIdByDirection } from "#game/helpers/map-helpers";
import { CharacterMovedMessage } from "#game/message-types";

type OnResourceCommandPayload = {
  client: Client;
  message: any;
  force: boolean;
};

export class ResourceCommand extends Command<UfbRoom, OnResourceCommandPayload> {
  validate({ client, message }: OnResourceCommandPayload) {
      return !isNullOrEmpty(message.tileId);
  }

  execute({ client, message, force }: OnResourceCommandPayload) {
      const character = getClientCharacter(this.room, client);
      if (!character) {
          this.room.notify(client, "error");
      }

      if (!force && character.id !== this.state.currentCharacterId) {
          this.room.notify(client, "error");
          return;
      }

 
    //   character.coordinates.x = destinationTile.coordinates.x;
    //   character.coordinates.y = destinationTile.coordinates.y;
    //   character.currentTileId = message.tileId;


    //   if (character.stats.energy.current == 0) {
    //       this.room.notify(client, "You can't continue.");
    //       this.room.incrementTurn();
    //   }
  }
}
