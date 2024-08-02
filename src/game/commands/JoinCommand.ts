import { Command } from "@colyseus/command";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { UfbRoom } from "#game/UfbRoom";
import { Client } from "@colyseus/core";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { SpawnInitMessage } from "#game/message-types";

type Payload = { client: Client; message: any;};

export class JoinCommand extends Command<UfbRoom, Payload> {
    validate({ client, message }: Payload) {
        // return !isNullOrEmpty(options.joinOptions.playerId);
        return true;
    }

    execute({ client, message}: Payload) {

        const character = getCharacterById(this.room, message.playerId);
        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }


        let coinCount = 2 + Math.round(4 * (Math.random()));

        let itemId = 0 + Math.round(5 * (Math.random()));
        let powerId = 0 + Math.round(11 * (Math.random()));

        const spawnMessage : SpawnInitMessage = {
            characterId: message.playerId,
            spawnId: "default",
            item: itemId,
            power: powerId,
            coin: coinCount,
            tileId: message.tileId
        }

        console.log(`itemid: ${itemId}, powerId: ${powerId}, coin: ${coinCount}`);

        client.send("spawnInit", spawnMessage);

        character.coordinates.x = message.destination.x;
        character.coordinates.y = message.destination.y;
        character.currentTileId = message.tileId;
    }
}
