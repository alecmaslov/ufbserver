import { UfbRoom } from "#game/UfbRoom";
import { coordToGameId, fillPathWithCoords, getTileIdByDirection } from "#game/helpers/map-helpers";
import { getClientCharacter } from "./helpers/room-helpers";
import { CharacterMovedMessage, GetResourceDataMessage, MoveItemMessage, SetMoveItemMessage, SpawnInitMessage } from "#game/message-types";
import { Client } from "@colyseus/core";
import { MoveCommand } from "#game/commands/MoveCommand";
import { EquipCommand } from "./commands/EquipCommand";
import { ItemCommand } from "./commands/ItemCommand";
import { JoinCommand } from "./commands/JoinCommand";
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

    testPathMove: (room, client, message) => {
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
        console.log(`Tile id: ${message.tileId}, destination: ${message.destination}, playerId: ${message.playerId}, itemBag: ${message.isItemBag}`);

        let coinCount = 2 + Math.round(4 * ( Math.random()));

        let itemId = 0 + Math.round(5 * (Math.random()));
        let powerId = 0 + Math.round(11 * (Math.random()));

        if(message.isItemBag) {
            coinCount = 2 + Math.round(4 * ( Math.random()));

            itemId = 6 + Math.round(13 * (Math.random()));
            powerId = 12 + Math.round(22 * (Math.random()));
        }

        const spawnMessage : SpawnInitMessage = {
            characterId: message.playerId,
            spawnId: message.isItemBag? "itemBag" : "default",
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

        room.dispatcher.dispatch(new JoinCommand(), {
            client, message
        });
    },

    getSpawn: (room, client, message) => {

        // room.dispatcher.dispatch(new ResourceCommand(), {
        //     client,
        //     message,
        //     force: false,
        // });
        room.dispatcher.dispatch(new ItemCommand(), {
            client,
            message
        });
    },

    getResourceList: (room, client, message) => {
        const character = getClientCharacter(room, client);

        const getResourceDataMessage: GetResourceDataMessage = {
            characterState: character
        };

        client.send("sendResourceList", getResourceDataMessage)
    },


    getPowerMoveList: (room, client, message) => {

        room.dispatcher.dispatch(new EquipCommand(), {
            client,
            message
        });

        
    },

    equipPower: (room, client, message) => {

    },

    unEquipPower: (room, client, message) => {
        const powerId = message.powerId;
        const character = getClientCharacter(room, client);
        character.stats.energy.add(-2);
        
        const power : Item = character.powers.find(p => p.id == powerId);
        if(power == null) {
            const newPower = new Item();
            newPower.id = powerId;
            newPower.count = 1;
            newPower.name = powers[powerId].name;
            newPower.description = "description";
            newPower.level = powers[powerId].level;
            character.powers.push(newPower);
        } else {
            power.count++;
        }
        client.send("unEquipPowerReceived", {playerId: character.id});
    },

    // MOVE DETAIL INFO
    getMoveItem: (room, client, message) => {
        const itemId = message.itemId;
        const character = getClientCharacter(room, client);
        const currentTile = room.state.map.tiles.get(character.currentTileId);

        const directions = [0, 0, 0, 0];

        // BOMB....
        if(itemId == 5) {
            const conditions = [
                "top",
                "right",
                "down",
                "left"
            ];
            conditions.forEach((cond, i) => {
                const id = getTileIdByDirection(room.state.map.tiles, currentTile.coordinates, cond)
                if(currentTile.walls[i] == 0 && room.state.map.spawnEntities.findIndex(entity => entity.tileId == id) == -1) {
                    directions[i] = 1;
                }
            })
        }

        // FEATHER
        if(itemId == 3) {
            const conditions = [
                "top",
                "right",
                "down",
                "left"
            ];
            conditions.forEach((cond, i) => {
                const id = getTileIdByDirection(room.state.map.tiles, currentTile.coordinates, cond)
                if(currentTile.walls[i] == 1 && room.state.map.spawnEntities.findIndex(entity => entity.tileId == id) == -1 && id != "") {
                    directions[i] = 1;
                }
            })
        }

        // CRYSTAL
        if(itemId == 10) {

        }

        let directionData = {
            left: directions[3],
            right: directions[1],
            top: directions[0],
            down: directions[2],
            itemId: itemId
        }

        const movemessage: MoveItemMessage = {
            ...directionData
        }

        client.send("ReceiveMoveItem", movemessage);
    },

     setMoveItem:(room, client, message) => {
        const itemId = message.itemId;
        const character = getClientCharacter(room, client);
        const currentTile = room.state.map.tiles.get(character.currentTileId);

        if(character.stats.energy.current == 0) {
            room.notify(
                client,
                "You don't have enough energy to move there!",
                "error"
            );
        }

        if(!!character.items[itemId] && character.items[itemId].count > 0) {
            character.items[itemId].count--;
        }

        character.stats.energy.add(-1);

        const setmoveitemMessage : SetMoveItemMessage = {
            itemId: itemId,
            tileId: message.tileId
        }

        client.send("SetMoveItem", setmoveitemMessage);

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
