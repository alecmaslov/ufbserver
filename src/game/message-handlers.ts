import { UfbRoom } from "#game/UfbRoom";
import { coordToGameId, fillPathWithCoords } from "#game/helpers/map-helpers";
import { getClientCharacter } from "./helpers/room-helpers";
import { CharacterMovedMessage, GetResourceDataMessage, PowerMoveListMessage, SpawnInitMessage } from "#game/message-types";
import { Client } from "@colyseus/core";
import { MoveCommand } from "#game/commands/MoveCommand";
import { EquipCommand } from "./commands/EquipCommand";
import { Item } from "#game/schema/CharacterState";
import { powermoves, powers } from "#assets/resources";
import { PowerMove } from "#shared-types";

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

    testPath: (room, client, message) => {
        room.dispatcher.dispatch(new EquipCommand(), {
            client,
            message
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

        let coinCount = 2 + Math.round(4 * ( Math.random()));

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

        client.send("spawnInit", spawnMessage);

        // const character = getClientCharacter(room, client);
        // character.coordinates.x = message.destination.x;
        // character.coordinates.y = message.destination.y;
        // character.currentTileId = message.tileId;

    },

    initSpawnMove: (room, client, message) => {
        console.log(`Tile id: ${message.tileId}, destination: ${message.destination}, playerId: ${message.playerId}`);

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

        const character = getClientCharacter(room, client);
        character.coordinates.x = message.destination.x;
        character.coordinates.y = message.destination.y;
        character.currentTileId = message.tileId;

    },

    getSpawn: (room, client, message) => {

        // room.dispatcher.dispatch(new ResourceCommand(), {
        //     client,
        //     message,
        //     force: false,
        // });
        console.log(`Get items : `);
        
        const character = getClientCharacter(room, client);

        const item : Item = character.items.find(item => item.id == message.itemId);
        if(item == null) {
            const newItem = new Item();
            newItem.id = message.itemId;
            newItem.count = 1;
            newItem.name = `item${message.itemId}`;
            newItem.description = "description";
            newItem.level = 1;

            character.items.push(newItem);
        } else {
            item.count++;
        }

        const power : Item = character.powers.find(p => p.id == message.powerId);
        if(power == null) {
            const newPower = new Item();
            const id : number = message.powerId;
            newPower.id = id;
            newPower.count = 1;
            newPower.name = powers[id].name;
            newPower.description = "description";
            newPower.level = powers[id].level;
            character.powers.push(newPower);
        } else {
            power.count++;
        }

        character.stats.energy.add(3);
        character.stats.health.add(3);
        character.stats.coin += message.coinCount;
        character.stats.bags++;
        console.log(`itemid : ${message.itemId}, powerId: ${message.powerId}, coinCount: ${message.coinCount}`);

        client.send("sss", {});

    },

    getResourceList: (room, client, message) => {
        const character = getClientCharacter(room, client);

        const getResourceDataMessage: GetResourceDataMessage = {
            characterState: character
        };

        client.send("sendResourceList", getResourceDataMessage)
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
    },

    getPowerMoveList: (room, client, message) => {
        const powerId = message.powerId;
        let clientMessage: PowerMoveListMessage = {
            powermoves: []
        }
        powermoves.forEach(move => {
            if(move.powerIds.indexOf(powerId) > -1) {
                const powermove : PowerMove = {
                    id : move.id,
                    name : move.name,
                    powerImageId : move.powerImageId,
                    light : move.light,
                    range : move.range,
                    coin : move.coin,
                    powerIds: [],
                    costList: []
                };

                move.powerIds.forEach(pid => {
                    powermove.powerIds.push(pid);
                })
                move.costList.forEach(cost => {
                    const item = new Item();
                    item.id = cost.id;
                    item.count = cost.count;
                    powermove.costList.push(
                        item
                    )
                })
                console.log(move.powerIds, move.costList)
                clientMessage.powermoves.push(powermove);
            }
        })
        console.log(
            clientMessage.powermoves[0].id, 
            clientMessage.powermoves[0].name,
            clientMessage.powermoves[0].powerIds
        );
        client.send("ReceivePowerMoveList", clientMessage);
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
