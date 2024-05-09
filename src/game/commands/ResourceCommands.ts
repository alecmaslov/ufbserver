import { Command } from "@colyseus/command";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getClientCharacter } from "#game/helpers/room-helpers";
import { coordToGameId, fillPathWithCoords, getTileIdByDirection } from "#game/helpers/map-helpers";
import { CharacterMovedMessage } from "#game/message-types";
import { Item } from "#game/schema/CharacterState";

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

      const item : Item = character.items.find(item => item.id == message.itemId);
      if(item == null) {
          const newItem = new Item();
          newItem.id = message.itemId;
          newItem.count = 1;
          newItem.name = "item0";
          newItem.description = "description";
          newItem.level = 1;

          character.items.push(newItem);
      } else {
          item.count++;
      }

      const power : Item = character.powers.find(p => p.id == message.powerId);
      if(power == null) {
          const newPower = new Item();
          newPower.id = message.powerId;
          newPower.count = 1;
          newPower.name = "power0";
          newPower.description = "description";
          newPower.level = 1;
          character.items.push(newPower);
      } else {
          power.count++;
      }

      character.stats.energy.add(3);
      character.stats.health.add(3);
      character.stats.coin += message.coinCount;
      character.stats.bags++;
 
    //   character.coordinates.x = destinationTile.coordinates.x;
    //   character.coordinates.y = destinationTile.coordinates.y;
    //   character.currentTileId = message.tileId;


    //   if (character.stats.energy.current == 0) {
    //       this.room.notify(client, "You can't continue.");
    //       this.room.incrementTurn();
    //   }
  }
}
