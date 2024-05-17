import { Command } from "@colyseus/command";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { UfbRoom } from "#game/UfbRoom";
import { UfbRoomOptions } from "#game/types/room-types";
// import { spawnCharacter } from "#game/map-helpers";
import { createId } from "@paralleldrive/cuid2";
import { isNullOrEmpty } from "#util";
import { Client } from "@colyseus/core";

type Payload = { client: Client; sessionId: string; options: UfbRoomOptions };

export class JoinCommand extends Command<UfbRoom, Payload> {
    validate({ sessionId, options }: Payload) {
        // return !isNullOrEmpty(options.joinOptions.playerId);
        return true;
    }

    execute({ client, sessionId, options }: Payload) {

        let playerId = options.joinOptions.playerId ?? "";
        if (isNullOrEmpty(playerId)) {
            playerId = createId();
            client.send("generatedPlayerId", {
                playerId,
            });
        }
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
