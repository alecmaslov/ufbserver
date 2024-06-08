import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getClientCharacter } from "#game/helpers/room-helpers";
import { coordToGameId, fillPathWithCoords, getTileIdByDirection } from "#game/helpers/map-helpers";
import { CharacterMovedMessage } from "#game/message-types";
import { PathStep } from "#shared-types";

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
        console.log("move message execute")
        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }

        if (!force && character.id !== this.state.currentCharacterId) {
            this.room.notify(client, "It's not your turn!", "error");
            return;
        }

        const currentTile = this.state.map.tiles.get(character.currentTileId);
        const destinationTile = this.room.state.map.tiles.get(message.tileId);

        let directionData = {
            left: 1,
            right: 1,
            top: 1,
            down: 1
        }
        // LEFT
        {
            const id = getTileIdByDirection(this.room.state.map.tiles, destinationTile.coordinates, "left")

            if(id == "") {
                directionData.left = 0;
            } else {
                directionData.left = destinationTile.walls[3] == 1? 0 : 1;
            }
        }
        // RIGHT
        {
            const id = getTileIdByDirection(this.room.state.map.tiles, destinationTile.coordinates, "right")

            if(id == "") {
                directionData.right = 0;
            } else {
                directionData.right = destinationTile.walls[1] == 1? 0 : 1;
            }
        }
        // TOP
        {
            const id = getTileIdByDirection(this.room.state.map.tiles, destinationTile.coordinates, "top")

            if(id == "") {
                directionData.top = 0;
            } else {
                directionData.top = destinationTile.walls[0] == 1? 0 : 1;
            }
        }
        // DOWN
        {
            const id = getTileIdByDirection(this.room.state.map.tiles, destinationTile.coordinates, "down")

            if(id == "") {
                directionData.down = 0;
            } else {
                directionData.down = destinationTile.walls[2] == 1? 0 : 1;
            }
        }

        // console.log(
        //     `Character moving from ${coordToGameId(
        //         currentTile.coordinates
        //     )} -> ${coordToGameId(destinationTile.coordinates)}`
        // );

        // const { path, cost } = this.room.pathfinder.find(
        //     character.currentTileId,
        //     message.tileId
        // );
        const path: PathStep[] = [{
            tileId: message.tileId
        }];

        if (!force && character.stats.energy.current < 1) {
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

        const cost = message.tileId == destinationTile.id? 0 : -1;

        if(force) {
            const originEnergy = message.originEnergy;
            character.stats.energy.add(originEnergy - character.stats.energy.current);
        } else {
            character.stats.energy.add(cost);
        }
        fillPathWithCoords(path, this.room.state.map);

        const characterMovedMessage: CharacterMovedMessage = {
            characterId: character.id,
            path,
            left: directionData.left,
            right: directionData.right,
            top: directionData.top,
            down: directionData.down,
        };

        // console.log(
        //     `Sending playerMoved message ${JSON.stringify(
        //         characterMovedMessage,
        //         null,
        //         2
        //     )}`
        // );

        this.room.broadcast("characterMoved", characterMovedMessage);

        if (character.stats.energy.current == 0) {
            this.room.notify(client, "You are too tired to continue.");
            this.room.incrementTurn();
        }
    }
}
