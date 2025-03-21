import { Command } from "@colyseus/command";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { UfbRoom } from "#game/UfbRoom";
import { Client } from "@colyseus/core";
import { getCharacterById, getClientCharacter, getItemIdsByLevel, getPowerIdsByLevel } from "#game/helpers/room-helpers";
import { SpawnInitMessage } from "#game/message-types";
import { TURN_TIME } from "#assets/resources";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";

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

        const lvl1Items = getItemIdsByLevel(1, false);
        const lvl1Powers = getPowerIdsByLevel(1, false);

        const idxItem = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
        const idxPower = Math.ceil(Math.random() * lvl1Powers.length) % lvl1Powers.length;

        let itemId = lvl1Items[idxItem].id;
        let powerId = lvl1Powers[idxPower].id;

        const spawnMessage : SpawnInitMessage = {
            characterId: message.playerId,
            spawnId: "default",
            item: itemId,
            power: powerId,
            coin: coinCount,
            tileId: message.tileId
        }

        console.log(`itemid: ${itemId}, powerId: ${powerId}, coin: ${coinCount}`);

        client.send(SERVER_TO_CLIENT_MESSAGE.SPAWN_INIT, spawnMessage);
        
        // Turn start....
        client.send(SERVER_TO_CLIENT_MESSAGE.INIT_TURN, {
            characterId : message.playerId,
            curTime : TURN_TIME
        });

        character.coordinates.x = message.destination.x;
        character.coordinates.y = message.destination.y;
        character.currentTileId = message.tileId;
    }
}
