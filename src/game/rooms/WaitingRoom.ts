// WaitingRoom.ts
import { Room, Client, matchMaker } from "@colyseus/core";
import { WaitingState, Player } from "#game/schema/WaitingState";
import { UfbRoomOptions } from "#game/types/room-types";

export class WaitingRoom extends Room<WaitingState> {
    onCreate(options: any) {
        this.setState(new WaitingState());
        this.state.ownerId = options.ownerId;
        this.state.roomId = options.roomId;
        this.state.maxPlayers = options.maxPlayers;
        this.state.mapName = options.mapName;
        this.roomId = options.roomId;

        this.onMessage("start_game", async (client, ownerId) => {
            if (ownerId !== this.state.ownerId) return;
            if (this.state.players.length < 1) return;

            console.log("create game room", this.roomId);

            // const gameRoom = await matchMaker.createRoom("ufbRoom", {
            //     roomId: this.roomId,
            //     players: this.state.players.map(p => p.id)
            // });

            this.clients.forEach(c => {
                c.send("go_to_game", this.roomId);
            });

            //this.disconnect(); // destroy waiting room
        });
    }

    onJoin(client: Client, options: UfbRoomOptions) {
        const player = new Player();
        player.id = options.joinOptions.playerId;
        player.sessionId = client.sessionId;
        player.characterClass = options.joinOptions.characterClass;
        player.displayName = options.joinOptions.displayName;
        player.joinIndex = this.state.players.length;

        console.log("player : ", player.id, ", name : ", player.displayName);

        this.state.players.push(player);
    }

    onLeave(client: Client) {
        console.log("leave client : ", client.sessionId);
        this.state.players = this.state.players.filter(p => p.sessionId !== client.sessionId);
    }

    onDispose(): void | Promise<any> {
        console.log("waiting room", this.roomId, "disposing...");
    }
}
