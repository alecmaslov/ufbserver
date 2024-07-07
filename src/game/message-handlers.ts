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
import { ITEMDETAIL, ITEMTYPE, POWERCOSTS, STACKTYPE, itemResults, powermoves, powers, stacks } from "#assets/resources";
import { PowerMove } from "#shared-types";
import { MoveItemEntity } from "./schema/MapState";
import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Dictionary } from "@prisma/client/runtime/library";
import { PowerMoveCommand } from "./commands/PowerMoveCommand";


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
        const items = message.items;
        const playerId = room.sessionIdToPlayerId.get(client.sessionId);
        const player = room.state.characters.get(playerId);

        items.forEach((item : Item) => {
            const pId = player.items.findIndex((ii: Item) => ii.id == item.id);
            if(pId > 0) {
                player.items[pId].count = item.count;
            }
        })

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
            newPower.cost = POWERCOSTS[newPower.id].cost;
            newPower.sell = POWERCOSTS[newPower.id].sell;

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
        if(itemId == ITEMTYPE.BOMB) {
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
        if(itemId == ITEMTYPE.FEATHER) {
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
        if(itemId == ITEMTYPE.WARP_CRYSTAL) {

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
        const tileId = message.tileId;
        const character = getClientCharacter(room, client);
        const currentTile = room.state.map.tiles.get(character.currentTileId);

        if(character.stats.energy.current == 0) {
            room.notify(
                client,
                "You don't have enough energy to move there!",
                "error"
            );
            return;
        }

        const idx = character.items.findIndex(it => it.id == itemId && it.count > 0);
        if(idx != -1) {
            character.items[idx].count--;
        } else {
            room.notify(
                client,
                "Your item is not enough!",
                "error"
            );
            return;
        }

        if(itemId == ITEMTYPE.BOMB || itemId == ITEMTYPE.ICE_BOMB || itemId == ITEMTYPE.FIRE_BOMB || itemId == ITEMTYPE.VOID_BOMB || itemId == ITEMTYPE.CALTROP_BOMB) {
            const idx = room.state.map.moveItemEntities.findIndex(mItem => mItem.tileId == tileId)
            if(idx == -1) {
                const entity : MoveItemEntity = new MoveItemEntity();
                entity.itemId = itemId;
                entity.tileId = tileId;
                entity.playerId = client.id;
                room.state.map.moveItemEntities.push(entity);
            } else {
                room.state.map.moveItemEntities.deleteAt(idx);
            }

            character.stats.energy.add(-1);
        }
        
        if(itemId == ITEMTYPE.POTION) {
            character.stats.health.add(5);
        }
        else if(itemId == ITEMTYPE.ELIXIR) {
            character.stats.energy.add(10);

            const CureStack : Item = character.stacks.find(stack => stack.id == STACKTYPE.Cure);
            if(CureStack == null) {
                const newStack = new Item();
                newStack.id = STACKTYPE.Cure;
                newStack.count = 1;
                newStack.name = stacks[STACKTYPE.Cure].name;
                newStack.description = stacks[STACKTYPE.Cure].description;
                newStack.level = stacks[STACKTYPE.Cure].level;
                newStack.cost = stacks[STACKTYPE.Cure].cost;
                newStack.sell = stacks[STACKTYPE.Cure].sell;

                character.stacks.push(newStack);
            } else {
                CureStack.count++;
            }

            const DodgeStack : Item = character.stacks.find(stack => stack.id == STACKTYPE.Dodge);
            if(DodgeStack == null) {
                const newStack = new Item();
                newStack.id = STACKTYPE.Dodge;
                newStack.count = 1;
                newStack.name = stacks[STACKTYPE.Dodge].name;
                newStack.description = stacks[STACKTYPE.Dodge].description;
                newStack.level = stacks[STACKTYPE.Dodge].level;
                newStack.cost = stacks[STACKTYPE.Dodge].cost;
                newStack.sell = stacks[STACKTYPE.Dodge].sell;

                character.stacks.push(newStack);
            } else {
                DodgeStack.count++;
            }
        }


        const setmoveitemMessage : SetMoveItemMessage = {
            itemId: itemId,
            tileId: message.tileId
        }

        client.send("SetMoveItem", setmoveitemMessage);

    },

    setPowerMove: (room, client, message) => {
        room.dispatcher.dispatch(new PowerMoveCommand(), {
            client,
            message
        });
    },

    getMerchantData: (room, client, message) => {
        const character = getClientCharacter(room, client);


        const itemData : Item[] = [];
        Object.keys(ITEMTYPE).forEach(key => {
            const id: number = ITEMTYPE[key];
            let item = new Item();
            item.id = id;
            item.name = ITEMDETAIL[id].name;
            item.level = ITEMDETAIL[id].level;
            item.cost = ITEMDETAIL[id].cost;
            item.sell = ITEMDETAIL[id].sell;
            itemData.push(item);
        });

        const powerData : Item[] = [];
        Object.keys(POWERCOSTS).forEach(key => {
            const id: number = Number(key);
            let power = new Item();
            power.id = id;
            power.name = powers[id].name;
            power.level = powers[id].level;
            power.cost = POWERCOSTS[id].cost;
            power.sell = POWERCOSTS[id].sell;
            powerData.push(power);
        });

        const stackData : Item[] = [];
        Object.keys(stacks).forEach(key => {
            const id: number = Number(key);
            let stack = new Item();
            stack.id = id;
            stack.name = stacks[id].name;
            stack.level = stacks[id].level;
            stack.cost = stacks[id].cost;
            stack.sell = stacks[id].sell;
            stackData.push(stack);
        });

        const getMerchantDataDataMessage = {
            items: itemData,
            powers: powerData,
            stacks: stackData
        };

        client.send("getMerchantData", getMerchantDataDataMessage)
    },

    buyItem: (room, client, message) => {

    },

    sellItem: (room, client, message) => {
        
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
