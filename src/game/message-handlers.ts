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
import { ITEMTYPE, STACKTYPE, itemResults, powermoves, powers, stacks } from "#assets/resources";
import { PowerMove } from "#shared-types";
import { MoveItemEntity } from "./schema/MapState";
import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Dictionary } from "@prisma/client/runtime/library";


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
                newStack.level = 1;

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
                newStack.level = 1;

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
        const powerMoveId = message.powerMoveId;
        const character = getClientCharacter(room, client);

        const powermove = powermoves.find(pm => pm.id == powerMoveId);
        let isResult = true;

        console.log(powermove)
        Object.keys(powermove).forEach(key => {
            if(isResult) {
                if(key == "range") {
                    isResult = character.stats.range >= powermove.range;
                    console.log("range", isResult);
                    if(!isResult) return;
                } else if(key == "light") {
                    isResult = character.stats.energy.current >= powermove.light;
                    console.log("light", isResult);
                    if(!isResult) return;
                } else if(key == "coin") {
                    isResult = character.stats.coin >= powermove.coin;
                    console.log("coin", isResult);
                    if(!isResult) return;
                } else if(key == "costList") {
                    powermove.costList.forEach(item => {
                        if(isResult) {
                            const idx = character.items.findIndex(ii => ii.id == item.id);
                            if(idx > -1) {
                                isResult = character.items[idx].count >= item.count;
                                if(!isResult) return;
                            } else {
                                isResult = false;
                                return;
                            }
                        }
                    });
                    if(!isResult) return;
                }
            }

        });
        console.log("------ check logic======", isResult)
        if(!isResult) {
            room.notify(
                client,
                "Your item is not enough!",
                "error"
            );
            return;
        }

        // REDUCE COST PART
        Object.keys(powermove).forEach(key => {
            if(key == "range") {
                 character.stats.range -= powermove.range;
                 client.send("addExtraScore", {
                    score: -powermove.range,
                    type: "range",
                });
            } else if(key == "light") {
                character.stats.energy.add(-powermove.light);
                client.send("addExtraScore", {
                    score: -powermove.light,
                    type: "energy",
                });
            } else if(key == "coin") {
                character.stats.coin -= powermove.coin;
                client.send("addExtraScore", {
                    score: -powermove.coin,
                    type: "coin",
                });
            } else if(key == "costList") {
                powermove.costList.forEach(item => {
                    const idx = character.items.findIndex(ii => ii.id == item.id);
                    character.items[idx].count -= item.count;

                    if(item.id == ITEMTYPE.MELEE) {
                        client.send("addExtraScore", {
                            score: -item.count,
                            type: "melee",
                        });
                    } else if(item.id == ITEMTYPE.MANA) {
                        client.send("addExtraScore", {
                            score: -item.count,
                            type: "mana",
                        });
                    }
                });
            }
        });

        console.log("------ check cost ppart======")

        // ADD RESOULT PART
        Object.keys(powermove.result).forEach(key => {
            if(key == "health") {
                character.stats.health.add(powermove.result.health);
                client.send("addExtraScore", {
                    score: powermove.result.health,
                    type: "heart",
                });
            } else if(key == "energy") {
                character.stats.energy.add(powermove.result.energy);
                client.send("addExtraScore", {
                    score: powermove.result.energy,
                    type: "energy",
                });
            } else if(key == "coin") {
                character.stats.coin += powermove.result.coin;
                client.send("addExtraScore", {
                    score: powermove.result.coin,
                    type: "coin",
                });
            } else if(key == "ultimate") {
                character.stats.ultimate.add(powermove.result.ultimate);
                client.send("addExtraScore", {
                    score: powermove.result.ultimate,
                    type: "ultimate",
                });
            } else if(key == "perkId") {

            } else if(key == "items") {
                powermove.result.items.forEach(item => {
                    const id = character.items.findIndex(ii => ii.id == item.id);
                    if(id > -1) {
                        character.items[id].count += item.count;                        
                    } else {
                        const newItem = new Item();
                        newItem.id = item.id;
                        newItem.count = item.count;
                        newItem.level = 1;
                        newItem.name = "item" + item.id;
                        newItem.cost = 1;

                        character.items.push(newItem);
                    }

                    if(id == ITEMTYPE.MELEE) {
                        client.send("addExtraScore", {
                            score: item.count,
                            type: "melee",
                        });
                    } else if(id == ITEMTYPE.MANA) {
                        client.send("addExtraScore", {
                            score: item.count,
                            type: "mana",
                        });
                    }
                })
            } else if(key == "stacks") {
                powermove.result.stacks.forEach(stack => {
                    const id = character.stacks.findIndex(ii => ii.id == stack.id);
                    if(id > -1) {
                        character.stacks[id].count += stack.count;
                    } else {
                        const newStack = new Item();
                        newStack.id = stack.id;
                        newStack.count = stack.count;
                        newStack.cost = 1;
                        newStack.name = stacks[stack.id].name;
                        newStack.description = stacks[stack.id].description;
                        newStack.level = 1;

                        character.stacks.push(newStack);
                    }
                })
            }
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
