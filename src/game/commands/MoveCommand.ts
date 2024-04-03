import { Command } from "@colyseus/command";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { UfbRoom } from "#game/UfbRoom";
import { UfbRoomOptions } from "#game/types/room-types";
import { createId } from "@paralleldrive/cuid2";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getClientCharacter } from "#game/helpers/room-helpers";
import { coordToGameId, fillPathWithCoords } from "#game/helpers/map-helpers";
import { CharacterMovedMessage } from "#game/message-types";

type OnMoveCommandPayload = {
    client: Client;
    message: any;
    force: boolean;
};
export class MoveCommand extends Command<UfbRoom, OnMoveCommandPayload> {
    validate({ client, message }: OnMoveCommandPayload) {
        return !isNullOrEmpty(message.tileId);
    }

    execute({ client, message, force }: OnMoveCommandPayload) {
        const character = getClientCharacter(this.room, client);
        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }

        if (!force && character.id !== this.state.currentCharacterId) {
            this.room.notify(client, "It's not your turn!", "error");
            return;
        }

        const currentTile = this.state.map.tiles.get(character.currentTileId);
        const destinationTile = this.room.state.map.tiles.get(message.tileId);

        console.log(
            `Character moving from ${coordToGameId(
                currentTile.coordinates
            )} -> ${coordToGameId(destinationTile.coordinates)}`
        );

        const { path, cost } = this.room.pathfinder.find(
            character.currentTileId,
            message.tileId
        );

        if (!force && character.stats.energy.current < cost) {
            this.room.notify(
                client,
                "You don't have enough energy to move there!",
                "error"
            );
            return;
        }

        character.coordinates.x = destinationTile.coordinates.x;
        character.coordinates.y = destinationTile.coordinates.y;
        character.currentTileId = message.tileId;
        console.log("character::::", character)
        if(!force) character.stats.energy.add(-cost)
        fillPathWithCoords(path, this.room.state.map);

        const characterMovedMessage: CharacterMovedMessage = {
            characterId: character.id,
            path,
        };

        console.log(
            `Sending playerMoved message ${JSON.stringify(
                characterMovedMessage,
                null,
                2
            )}`
        );

        this.room.broadcast("characterMoved", characterMovedMessage);

        if (character.stats.energy.current == 0) {
            this.room.notify(client, "You are too tired to continue.");
            this.room.incrementTurn();
        }
    }
}
