import { Command } from "@colyseus/command";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { UfbRoom } from "#game/UfbRoom";
import { Client } from "@colyseus/core";
import { getClientCharacter } from "#game/helpers/room-helpers";
import { SpawnInitMessage } from "#game/message-types";

type Payload = { client: Client; message: any;};

export class JoinCommand extends Command<UfbRoom, Payload> {
    validate({ client, message }: Payload) {
        // return !isNullOrEmpty(options.joinOptions.playerId);
        return true;
    }

    execute({ client, message}: Payload) {

        const character = getClientCharacter(this.room, client);
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

        // this.sessionIdToPlayerId.set(client.sessionId, playerId);

        
        // this.state.players[sessionId] = new Player();

        // this.state.players[sessionId] = new Player();
        // let playerId = options.joinOptions.playerId ?? "";
        // console.log("onJoin options", options);
        // if (isNullOrEmpty(playerId)) {
        //     playerId = createId();
        //     client.send("generatedPlayerId", {
        //         playerId,
        //     });
        // }
        // this.sessionIdToPlayerId.set(client.sessionId, playerId);
        // console.log(client.sessionId, "joined!");
        // const tile = await db.tile.findUnique({
        //     where: {
        //         x_y_mapId: {
        //             x: Math.floor(Math.random() * this.state.map.gridWidth),
        //             y: Math.floor(Math.random() * this.state.map.gridHeight),
        //             mapId: this.state.map.id,
        //         },
        //     },
        // });
        // const character = spawnCharacter(
        //     this.state.characters,
        //     client.sessionId,
        //     tile,
        //     options.joinOptions.characterClass ?? "kirin",
        //     options.joinOptions.characterId,
        //     playerId,
        //     options.joinOptions.displayName
        // );
        // // @change
        // this.state.turnOrder.push(character.id);
        // if (this.state.turnOrder.length === 1) {
        //     this.state.currentCharacterId = playerId;
        //     console.log("first player, setting current player id to", playerId);
        // }
        // this.notify(client, "Welcome to the game, " + playerId + "!");
    }
}
