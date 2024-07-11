import { UfbRoom } from "#game/UfbRoom";
import { coordToGameId, fillPathWithCoords, getTileIdByDirection } from "#game/helpers/map-helpers";
import { getClientCharacter } from "./helpers/room-helpers";
import { CharacterMovedMessage, GetResourceDataMessage, MoveItemMessage, SetMoveItemMessage, SpawnInitMessage } from "#game/message-types";
import { Client } from "@colyseus/core";
import { MoveCommand } from "#game/commands/MoveCommand";
import { EquipCommand } from "./commands/EquipCommand";
import { ItemCommand } from "./commands/ItemCommand";
import { JoinCommand } from "./commands/JoinCommand";
import { Item, Quest } from "#game/schema/CharacterState";
import { ITEMDETAIL, ITEMTYPE, POWERCOSTS, POWERTYPE, QUESTS, STACKTYPE, itemResults, powermoves, powers, stacks } from "#assets/resources";
import { PowerMove } from "#shared-types";
import { MoveItemEntity } from "./schema/MapState";
import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Dictionary } from "@prisma/client/runtime/library";
import { PowerMoveCommand } from "./commands/PowerMoveCommand";
import { getRandomElements } from "#utils/collections";


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
        //const randomItem = getRandomElements(itemData, 3);

        const powerData : Item[] = [];
        Object.keys(powers).forEach(key => {
            const id: number = Number(key);
            let power = new Item();
            power.id = id;
            power.name = powers[id].name;
            power.level = powers[id].level;
            power.cost = POWERCOSTS[power.level].cost;
            power.sell = POWERCOSTS[power.level].sell;
            powerData.push(power);
        });
        //const randomPower = getRandomElements(powerData, 3);

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
        //const randomStack = getRandomElements(stackData, 3);

        const questData : Quest[] = [];
        const Qarray = Object.keys(QUESTS).map(key => QUESTS[Number(key)]);
        for(let i = 0; i < 3; i++) {
            const quest = new Quest();
            quest.id = Qarray[i].id;
            quest.name = Qarray[i].title;
            quest.level = Qarray[i].level;
            quest.description = Qarray[i].normal;

            const itemKeys = Object.keys(ITEMTYPE);
            let idx = Math.floor(itemKeys.length * Math.random());
            quest.itemId = ITEMTYPE[itemKeys[idx]];

            const powerKeys = Object.keys(POWERTYPE);         
            idx = Math.floor(powerKeys.length * Math.random());
            quest.powerId = POWERTYPE[powerKeys[idx]];
            if(Math.random() > 0.5) {
                quest.melee = 1;
            } else {
                quest.mana = 1;
            }
            quest.coin = 3 + Math.floor(3 * Math.random());

            questData.push(quest);
        }

        const getMerchantDataDataMessage = {
            items: itemData,
            powers: powerData,
            stacks: stackData,
            quests: questData,
            tileId: message.tileId
        };

        client.send("getMerchantData", getMerchantDataDataMessage)
    },

    buyItem: (room, client, message) => {
        const character = getClientCharacter(room, client);

        const type = message.type;
        const id = message.id;
        
        if(type == "item") {
            if(character.stats.coin >= ITEMDETAIL[id].cost) {
                character.stats.coin -= ITEMDETAIL[id].cost;

                const item =  character.items.find(it => it.id == id);
                if(item == null) {
                    const newIt = new Item();
                    newIt.id = id;
                    newIt.count = 1;
                    newIt.cost = ITEMDETAIL[id].cost;
                    newIt.level = ITEMDETAIL[id].level;
                    newIt.sell = ITEMDETAIL[id].sell;
                    newIt.name = ITEMDETAIL[id].name;

                    character.items.push(newIt);
                } else {
                    item.count++;
                }
            } else {
                room.notify(
                    client,
                    "You don't have enough coin to buy item!",
                    "error"
                );
                return;
            }
        } else if(type == "power") {
            if(character.stats.coin >= POWERCOSTS[id].cost) {
                character.stats.coin -= POWERCOSTS[id].cost;

                const power = character.powers.find(p => p.id == id);
                if(power == null) {
                    const newIt = new Item();
                    newIt.id = id;
                    newIt.count = 1;
                    newIt.cost = POWERCOSTS[id].cost;
                    newIt.level = powers[id].level;
                    newIt.sell = POWERCOSTS[id].sell;
                    newIt.name = powers[id].name;
    
                    character.powers.push(newIt);
                } else {
                    power.count++;
                }

            } else {
                room.notify(
                    client,
                    "You don't have enough coin to buy power!",
                    "error"
                );
                return;
            }
        } else if(type == "stack") {
            if(character.stats.coin >= stacks[id].cost) {
                character.stats.coin -= stacks[id].cost;

                const stack = character.stacks.find(s => s.id == id);
                if(stack == null) {
                    const newIt = new Item();
                    newIt.id = id;
                    newIt.count = 1;
                    newIt.cost = stacks[id].cost;
                    newIt.level = stacks[id].level;
                    newIt.sell = stacks[id].sell;
                    newIt.name = stacks[id].name;
                    newIt.description = stacks[id].description;
    
                    character.stacks.push(newIt);
                } else {
                    stack.count++;
                }

            } else {
                room.notify(
                    client,
                    "You don't have enough coin to buy stack!",
                    "error"
                );
                return;
            }
        }
    },

    sellItem: (room, client, message) => {
        const character = getClientCharacter(room, client);

        const type = message.type;
        const id = message.id;

        if(type == "item") {
            character.stats.coin += ITEMDETAIL[id].sell;
            const item =  character.items.find(it => it.id == id);
            if(item == null || item.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to sell item!",
                    "error"
                );
                return;
            } else {
                item.count--;
            }
        } else if(type == "power"){
            character.stats.coin += POWERCOSTS[id].sell;

            const power = character.powers.find(p => p.id == id);
            if(power == null || power.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to sell power!",
                    "error"
                );
                return;
            } else {
                power.count--;
            }

        } else if(type == "stack"){
            character.stats.coin += stacks[id].sell;

            const stack = character.stacks.find(s => s.id == id);
            if(stack == null || stack.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to sell stack!",
                    "error"
                );
                return;
            } else {
                stack.count--;
            }
        }
    },

    leaveMerchant: (room, client, message) => {
        let tileId = "";
        room.state.map.tiles.forEach(tile => {
            if(Math.random() > 0.7) {
                tileId = tile.id;
                return;
            }
        });

        room.broadcast("respawnMerchant", {
            tileId : tileId,
            oldTileId : message.tileId
        })
    },

    setActiveQuest: (room, client, message) => {
        const character = getClientCharacter(room, client);

        const quest = message.quest;
        const newQ = new Quest();
        newQ.id = quest.id;
        newQ.name = quest.name;
        newQ.description = quest.description;
        newQ.level = quest.level;
        newQ.itemId = quest.itemId;
        newQ.powerId = quest.powerId;
        newQ.melee = quest.melee;
        newQ.mana = quest.mana;
        newQ.coin = quest.coin;

        character.quests.push(newQ);

    },

    addCraftItem: (room, client, message) => {
        const character = getClientCharacter(room, client);
        const type = message.type;
        const idx1 = message.idx1;
        const idx2 = message.idx2;
        const idx3 = message.idx3;
        const coin = message.coin;

        if(type == "item") {
            const it1 = character.items.find(item => item.id == idx1);
            const it2 = character.items.find(item => item.id == idx2);
            const it3 = character.items.find(item => item.id == idx3);
            const remainCoin = character.stats.coin;
            if(it1 == null || it1.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to craft item!",
                    "error"
                );
                return;
            } else {
                it1.count--;
            }

            if(it2 == null || it2.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to craft item!",
                    "error"
                );
                return;
            } else {
                it2.count--;
            }

            if(it3 == null) {
                const newIt = new Item();
                newIt.id = idx3;
                newIt.count = 1;
                newIt.cost = ITEMDETAIL[idx3].cost;
                newIt.level = ITEMDETAIL[idx3].level;
                newIt.sell = ITEMDETAIL[idx3].sell;
                newIt.name = ITEMDETAIL[idx3].name;

                character.items.push(newIt);
            } else {
                it3.count++;
            }

            if(remainCoin >= coin) {
                character.stats.coin -= coin;
            } else {
                room.notify(
                    client,
                    "You don't have enough gold to craft item!",
                    "error"
                ); 
                return;
            }

        } else if(type == "power") {
            const it1 = character.powers.find(p => p.id == idx1);
            const it2 = character.powers.find(p => p.id == idx2);
            const it3 = character.powers.find(p => p.id == idx3);
            const remainCoin = character.stats.coin;
            if(it1 == null || it1.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to craft item!",
                    "error"
                );
                return;
            } else {
                it1.count--;
            }

            if(it2 == null || it2.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to craft item!",
                    "error"
                );
                return;
            } else {
                it2.count--;
            }

            if(it3 == null) {
                const newIt = new Item();
                newIt.id = idx3;
                newIt.count = 1;
                newIt.cost = POWERCOSTS[idx3].cost;
                newIt.level = powers[idx3].level;
                newIt.sell = POWERCOSTS[idx3].sell;
                newIt.name = powers[idx3].name;

                character.powers.push(newIt);
            } else {
                it3.count++;
            }

            if(remainCoin >= coin) {
                character.stats.coin -= coin;
            } else {
                room.notify(
                    client,
                    "You don't have enough gold to craft item!",
                    "error"
                ); 
                return;
            }
        }

        room.notify(
            client,
            "Add Craft Item!",
            "success"
        );
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
