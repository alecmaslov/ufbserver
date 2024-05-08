import { UfbRoom } from "#game/UfbRoom";
import { coordToGameId, fillPathWithCoords } from "#game/helpers/map-helpers";
import { getClientCharacter } from "./helpers/room-helpers";
import { CharacterMovedMessage, SpawnInitMessage } from "#game/message-types";
import { Client } from "@colyseus/core";
import { MoveCommand } from "#game/commands/MoveCommand";
import { Item } from "./schema/CharacterState";

type MessageHandler<TMessage> = (
    room: UfbRoom,
    client: Client,
    message: TMessage
) => void | Promise<void>;

export interface MessageHandlers {
    [key: string]: MessageHandler<any>;
}

const getTileCoord = (room: UfbRoom, tileId: string) => {};

export const messageHandlers: MessageHandlers = {
    move: (room, client, message) => {
        room.dispatcher.dispatch(new MoveCommand(), {
            client,
            message,
            force: false,
        });
    },

    // we can add some sort of key to this, so only admins can do this
    forceMove: (room, client, message) => {
        room.dispatcher.dispatch(new MoveCommand(), {
            client,
            message,
            force: true,
        });
    },

    cancelMove: (room, client, message) => {
        room.dispatcher.dispatch(new MoveCommand(), {
            client, 
            message, 
            force: true,
        });
    },

    useItem: (room, client, message) => {
        ////
        room.dispatcher.dispatch(new MoveCommand(), {
            client,
            message,
            force: true,
        });
    },

    useAbility: (room, client, message) => {
        ////
        room.dispatcher.dispatch(new MoveCommand(), {
            client,
            message,
            force: false,
        });
    },

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

        ////
        const fromTileId = coordToGameId(message.from);
        const toTileId = coordToGameId(message.to);
        const { path, cost } = room.pathfinder.find(fromTileId, toTileId);
        client.send("foundPath", {
            from: message.from,
            to: message.to,
            path,
            cost,
        });
    },

    changeMap: async (room, client, message) => {
        await room.initMap(message.mapName);
    },

    spawnMove: (room, client, message) => {
        console.log(`Tile id: ${message.tileId}, destination: ${message.destination}, playerId: ${message.playerId}`);

        let coinCount = 2 + Math.round(4 * (0.5 - Math.random()));

        let itemId = 0 + Math.round(3 * (0.5 - Math.random()));
        let powerId = 0 + Math.round(3 * (0.5 - Math.random()));

        const spawnMessage : SpawnInitMessage = {
            characterId: message.playerId,
            spawnId: "default",
            item: itemId,
            power: powerId,
            coin: coinCount,
            tileId: message.tileId
        }

        client.send("spawnInit", spawnMessage);

        const character = getClientCharacter(room, client);
        character.coordinates.x = message.coordinates.x;
        character.coordinates.y = message.coordinates.y;
        character.currentTileId = message.tileId;

    },

    getSpawn: (room, client, message) => {
        console.log(`Get items : `);

        const character = getClientCharacter(room, client);

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
    },

    getEquipList: (room, client, message) => {
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
    }
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
