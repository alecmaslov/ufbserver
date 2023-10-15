import { UfbRoom } from "#game/UfbRoom";
import { coordToGameId, fillPathWithCoords } from "#game/map-helpers";
import { CharacterMovedMessage } from "#game/message-types";
import { Client } from "@colyseus/core";

type MessageHandler<TMessage> = (
    room: UfbRoom,
    client: Client,
    message: TMessage
) => void | Promise<void>;

export interface MessageHandlers {
    [key: string]: MessageHandler<any>;
}

const getClientCharacter = (room: UfbRoom, client: Client) => {
    const playerId = room.sessionIdToPlayerId.get(client.sessionId);
    return room.state.characters.get(playerId);
};

const getTileCoord = (room: UfbRoom, tileId: string) => {};

// @kyle - we should put some sort of safety net, so that when it can't pathfind,
// it doesn't crash the server and close the socket
export const messageHandlers: MessageHandlers = {
    move: (room, client, message) => {
        const character = getClientCharacter(room, client);

        if (!character) {
            room.notify(client, "You are not in room game!", "error");
        }

        if (character.id !== room.state.currentCharacterId) {
            room.notify(client, "It's not your turn!", "error");
            return;
        }

        const currentTile = room.state.map.tiles.get(character.currentTileId);
        const destinationTile = room.state.map.tiles.get(message.tileId);
        
        console.log(
            `Character moving from ${coordToGameId(
                currentTile.coordinates
            )} -> ${coordToGameId(destinationTile.coordinates)}`
        );

        const { path, cost } = room.pathfinder.find(
            character.currentTileId,
            message.tileId
        );

        // player must have enough energy to move along the path
        if (character.stats.energy.current < cost) {
            room.notify(
                client,
                "You don't have enough energy to move there!",
                "error"
            );
            return;
        }

        
        character.coordinates.x = destinationTile.coordinates.x;
        character.coordinates.y = destinationTile.coordinates.y;
        character.currentTileId = message.tileId;
        // character.stats.energy.current -= cost;
        character.stats.energy.add(-cost);

        // add the readable game coordinates to the path
        fillPathWithCoords(path, room.state.map);

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
        room.broadcast("characterMoved", characterMovedMessage);

        if (character.stats.energy.current == 0) {
            room.notify(client, "You are too tired to continue.");
            room.incrementTurn();
        }
    },

    // we can add some sort of key to this, so only admins can do this
    forceMove: (room, client, message) => {
        const character = getClientCharacter(room, client);
        if (!character) {
            room.notify(client, "You are not in room game!", "error");
        }
        const { path, cost } = room.pathfinder.find(
            character.currentTileId,
            message.tileId
        );
        character.coordinates.x = message.destination.x;
        character.coordinates.y = message.destination.y;
        character.currentTileId = message.tileId;

        const characterMovedMessage: CharacterMovedMessage = {
            characterId: character.id,
            path,
        };

        room.broadcast("characterMoved", characterMovedMessage);
    },

    useItem: (room, client, message) => {},

    useAbility: (room, client, message) => {},

    findPath: (room, client, message) => {
        const fromTileId = coordToGameId(message.from);
        const toTileId = coordToGameId(message.to);

        const { path, cost } = room.pathfinder.find(fromTileId, toTileId);

        if (!path || path.length === 0) {
            room.notify(client, "No path found", "error");
            return;
        }

        client.send("foundPath", {
            from: message.from,
            to: message.to,
            path,
            cost,
        });
    },

    endTurn: (room, client, message) => {
        const playerId = room.sessionIdToPlayerId.get(client.sessionId);
        const player = room.state.characters.get(playerId);
        if (player.id !== room.state.currentCharacterId) {
            room.notify(client, "It's not your turn!", "error");
            return;
        }
        room.incrementTurn();
    },

    changeMap: async (room, client, message) => {
        await room.initMap(message.mapName);
    },
};

export function registerMessageHandlers(room: UfbRoom) {
    for (const messageType in messageHandlers) {
        const handler = messageHandlers[messageType];
        room.onMessage<any>(messageType, (client, message) => {
            console.log(
                `Handling message '${messageType}' from client ${
                    client.sessionId
                }\n${JSON.stringify(message, null, 2)}`
            );
            handler(room, client, message);
        });
    }
}
