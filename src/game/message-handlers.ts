import { Client } from "@colyseus/core";
import { UfbRoom } from "./UfbRoom";
import { coordToTileId } from "./map-helpers";
import { CharacterMovedMessage } from "./message-types";

type MessageHandler<TMessage> = (room: UfbRoom, client: Client, message: TMessage) => void | Promise<void>;

export interface MessageHandlers {
    [key: string]: MessageHandler<any>;
};

// @kyle - we should put some sort of safety net, so that when it can't pathfind,
// it doesn't crash the server and close the socket
export const messageHandlers: MessageHandlers = {
    move: (room, client, message) => {
        const playerId = room.sessionIdToPlayerId.get(client.sessionId);
        const characterId = room.state.playerCharacters.get(playerId);
        const character = room.state.characters.get(playerId);

        if (!character) {
            room.notify(client, "You are not in room game!", "error");
        }

        if (characterId !== room.state.currentCharacterId) {
            room.notify(client, "It's not your turn!", "error");
            return;
        }

        const playerTileId = coordToTileId(character.coordinates);
        const toTileId = coordToTileId(message.destination);

        const {
            path,
            cost
        } = room.pathfinder.find(playerTileId, toTileId);

        // player must have enough energy to move along the path
        if (character.stats.energy < cost) {
            room.notify(client, "You don't have enough energy to move there!", "error");
            return;
        }

        character.coordinates.x = message.destination.x;
        character.coordinates.y = message.destination.y;
        character.stats.energy -= cost;

        const characterMovedMessage: CharacterMovedMessage = {
            characterId,
            path
        };

        console.log(`Sending playerMoved message ${JSON.stringify(characterMovedMessage, null, 2)}`);
        room.broadcast("characterMoved", characterMovedMessage);

        if (character.stats.energy == 0) {
            room.notify(client, "You are too tired to continue.");
            room.incrementTurn();
        }
    },

    useItem: (room, client, message) => {
    },

    useAbility: (room, client, message) => {
    },

    findPath: (room, client, message) => {
        const fromTileId = coordToTileId(message.from);
        const toTileId = coordToTileId(message.to);

        const {
            path,
            cost
         } = room.pathfinder.find(fromTileId, toTileId);

        if (!path || path.length === 0) {
            room.notify(client, "No path found", "error");
            return;
        }

        client.send("foundPath", {
            from: message.from,
            to: message.to,
            path,
            cost
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
            console.log(`Handling message '${messageType}' from client ${client.sessionId}\n${JSON.stringify(message, null, 2)}`);
            handler(room, client, message);
        });
    }
}