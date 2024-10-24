import { UfbRoom } from "#game/UfbRoom";
import { addItemToCharacter, addStackToCharacter, coordToGameId, fillPathWithCoords, getDiceCount, getPowerMoveFromId, getTileIdByDirection, IsEnemyAdjacent, IsEquipPower, setCharacterHealth } from "#game/helpers/map-helpers";
import { getCharacterById, getClientCharacter, getHighLightTileIds, getItemIdsByLevel, getPowerIdsByLevel } from "./helpers/room-helpers";
import { CharacterMovedMessage, GetResourceDataMessage, MoveItemMessage, SetMoveItemMessage, SpawnInitMessage } from "#game/message-types";
import { Client } from "@colyseus/core";
import { MoveCommand } from "#game/commands/MoveCommand";
import { EquipCommand } from "./commands/EquipCommand";
import { ItemCommand } from "./commands/ItemCommand";
import { JoinCommand } from "./commands/JoinCommand";
import { Item, Quest } from "#game/schema/CharacterState";
import { DICE_TYPE, EDGE_TYPE, EQUIP_TURN_BONUS, GOOD_STACKS, ITEMDETAIL, ITEMTYPE, PERKTYPE, POWERCOSTS, POWERTYPE, QUESTS, STACKTYPE, itemResults, powermoves, powers, stacks } from "#assets/resources";
import { PowerMove } from "#shared-types";
import { MoveItemEntity } from "./schema/MapState";
import { Schema, type, ArraySchema } from "@colyseus/schema";
import { Dictionary } from "@prisma/client/runtime/library";
import { PowerMoveCommand } from "./commands/PowerMoveCommand";
import { getRandomElements } from "#utils/collections";
import { CLIENT_SERVER_MESSAGE, SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";


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

    [CLIENT_SERVER_MESSAGE.END_TURN]: (room, client, message) => {
        // const playerId = room.sessionIdToPlayerId.get(client.sessionId);
        const playerId = message.characterId;
        const player = room.state.characters.get(playerId);
        if (player.id !== room.state.currentCharacterId) {
            room.notify(client, "It's not your turn!", "error");
            return;
        }
        room.incrementTurn();

        // END TURN,,, remain energy will convert ultimate value
        player.stats.ultimate.add(player.stats.energy.current);


        ////
        // const fromTileId = coordToGameId(message.from);
        // const toTileId = coordToGameId(message.to);
        // const { path, cost } = room.pathfinder.find(fromTileId, toTileId);
        // client.send("foundPath", {
        //     from: message.from,
        //     to: message.to,
        //     path,
        //     cost,
        // });
    },

    changeMap: async (room, client, message) => {
        await room.initMap(message.mapName);
    },

    spawnMove: (room, client, message) => {
        console.log(`Tile id: ${message.tileId}, destination: ${message.destination}, playerId: ${message.playerId}, itemBag: ${message.isItemBag}`);

        let coinCount = 2 + Math.round(4 * ( Math.random()));

        const lvl1Items = getItemIdsByLevel(1, false);
        const lvl1Powers = getPowerIdsByLevel(1, false);

        const idxItem = Math.ceil(Math.random() * lvl1Items.length) % lvl1Items.length;
        const idxPower = Math.ceil(Math.random() * lvl1Powers.length) % lvl1Powers.length;

        let itemId = lvl1Items[idxItem].id;
        let powerId = lvl1Powers[idxPower].id;

        if(message.isItemBag) {
            coinCount = 2 + Math.round(4 * ( Math.random()));

            const lvl2Items = getItemIdsByLevel(2, false);
            const idx2 = Math.ceil(Math.random() * lvl2Items.length) % lvl2Items.length;
            itemId = lvl2Items[idx2].id;

            const idx = Math.ceil(Math.random() * GOOD_STACKS.length) % GOOD_STACKS.length;
            powerId = GOOD_STACKS[idx];
        }

        const spawnMessage : SpawnInitMessage = {
            characterId: message.playerId,
            spawnId: message.isItemBag? "itemBag" : "default",
            item: itemId,
            power: powerId,
            coin: coinCount,
            tileId: message.tileId
        }

        client.send(SERVER_TO_CLIENT_MESSAGE.SPAWN_INIT, spawnMessage);

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

    [CLIENT_SERVER_MESSAGE.EQUIP_POWER]: (room, client, message) => {
        room.dispatcher.dispatch(new EquipCommand(), {
            client,
            message
        });        
    },

    [CLIENT_SERVER_MESSAGE.UN_EQUIP_POWER]: (room, client, message) => {
        const powerId = message.powerId;
        const character = getCharacterById(room, message.characterId);

        if(character.stats.energy.current <= 2) {
            console.log("energy less");
            room.notify(client, "You are not enough in energy!", "error");
            return;
        }

        character.stats.energy.add(-2);
        
        const power : Item = character.powers.find(p => p.id == powerId);
        if(power == null) {
            const newPower = new Item();
            newPower.id = powerId;
            newPower.count = 1;
            newPower.name = powers[powerId].name;
            newPower.description = "description";
            newPower.level = powers[powerId].level;
            newPower.cost = POWERCOSTS[newPower.level].cost;
            newPower.sell = POWERCOSTS[newPower.level].sell;

            character.powers.push(newPower);
        } else {
            power.count++;
        }

        // DELETE SLOTS SYSTEM
        const idx = character.equipSlots.findIndex(p => p.id == power.id);
        character.equipSlots.deleteAt(idx);

        client.send(SERVER_TO_CLIENT_MESSAGE.UNEQUIP_POWER_RECEIVED, {playerId: character.id});
    },

    // MOVE DETAIL INFO
    getMoveItem: (room, client, message) => {
        const itemId = message.itemId;
        const character = getCharacterById(room, message.characterId);
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
                if((currentTile.walls[i] == EDGE_TYPE.WALL || currentTile.walls[i] == EDGE_TYPE.RAVINE || currentTile.walls[i] == EDGE_TYPE.CLIFF) 
                    && room.state.map.spawnEntities.findIndex(entity => entity.tileId == id) == -1 
                    && id != "") {
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

        client.send(SERVER_TO_CLIENT_MESSAGE.RECEIVE_MOVEITEM, movemessage);
    },

    [CLIENT_SERVER_MESSAGE.SET_MOVE_ITEM]:(room, client, message) => {
        const itemId = message.itemId;
        const tileId = message.tileId;
        const character = getCharacterById(room, message.characterId);
        const desTile = room.state.map.tiles.get(message.tileId);
        
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
        } else if(itemId == ITEMTYPE.POTION) {
            let extra = character.stats.health.add(5);
            if(extra > 0) {
                character.stats.coin += extra;
            }

        } else if(itemId == ITEMTYPE.ELIXIR) {
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
        } else if(itemId == ITEMTYPE.FEATHER) {
        } else if(itemId == ITEMTYPE.WARP_CRYSTAL) {
            if(desTile.walls[0] == EDGE_TYPE.BASIC) {   //TOP
                message.tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "top");
            } else if(desTile.walls[1] == EDGE_TYPE.BASIC) {   //RIGHT
                message.tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "right");
            } else if(desTile.walls[2] == EDGE_TYPE.BASIC) {   //DOWN
                message.tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "down");
            } else if(desTile.walls[3] == EDGE_TYPE.BASIC) {   //LEFT
                message.tileId = getTileIdByDirection(room.state.map.tiles, desTile.coordinates, "left");
            }
        } 

        const setmoveitemMessage : SetMoveItemMessage = {
            itemId: itemId,
            tileId: message.tileId
        }

        client.send(SERVER_TO_CLIENT_MESSAGE.SET_MOVEITEM, setmoveitemMessage);

    },

    [CLIENT_SERVER_MESSAGE.SET_POWER_MOVE_ITEM]: (room, client, message) => {
        room.dispatcher.dispatch(new PowerMoveCommand(), {
            client,
            message
        });
    },

    [CLIENT_SERVER_MESSAGE.END_POWER_MOVE_ITEM]: (room, client, message) => {
        const {enemyId, characterId, powerMoveId, diceCount, enemyDiceCount, extraItemId} = message;

        const enemy = getCharacterById(room, enemyId);
        const character = getCharacterById(room, characterId);
        const pm = getPowerMoveFromId(powerMoveId, extraItemId);
        const health = !!pm.result.health? pm.result.health : 0;

        let deltaCount = diceCount - health - enemyDiceCount;

        // REVENGE STACK ACTIVE
        if(!!enemy.stacks[STACKTYPE.Revenge] && enemy.stacks[STACKTYPE.Revenge].count > 0 && IsEnemyAdjacent(character, enemy, room)) {
            if(message.stackId == STACKTYPE.Revenge) {
                enemy.stacks[STACKTYPE.Revenge].count--;
                setCharacterHealth(character, -enemyDiceCount, room, client, "heart");
                enemy.stats.ultimate.add(enemyDiceCount);

                deltaCount += enemyDiceCount;
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: -enemyDiceCount,
                    type: "heart",
                });
            } else {
                client.send(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, {
                    enemyId: enemy.id,
                    characterId: character.id,
                    powerMoveId: powerMoveId,
                    stackId: STACKTYPE.Revenge,
                    diceCount: 0,
                    enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                });
            }

        }

        if(deltaCount > 0) {
            setCharacterHealth(enemy, -deltaCount, room, client, "heart");
            character.stats.ultimate.add(deltaCount);

            if(enemy.stats.health.current == 0) {
                console.log("----reward.. monster")
                room.RewardFromMonster(character, enemy, client);
            }

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -deltaCount,
                type: "heart_e",
            });

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -deltaCount,
                type: "ultimate_e",
            });
            if(pm != null && !!pm.result.stacks && pm.result.stacks.length > 0){
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: 1,
                    type: "stack_e",
                });
            }
        }

    },

    [CLIENT_SERVER_MESSAGE.END_REVENGER_STACK]: (room, client, message) => {

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
        const Qarray = getRandomElements(Object.keys(QUESTS).map(key => QUESTS[Number(key)]), 3);
        
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

        client.send(SERVER_TO_CLIENT_MESSAGE.GET_MERCHANT_DATA, getMerchantDataDataMessage)
    },

    buyItem: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

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
        const character = getCharacterById(room, message.characterId);

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

        room.broadcast(SERVER_TO_CLIENT_MESSAGE.RESPAWN_MERCHANT, {
            tileId : tileId,
            oldTileId : message.tileId
        })
    },

    setActiveQuest: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

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
        const character = getCharacterById(room, message.characterId);
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

    testHealth: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        setCharacterHealth(character, -4, room, client, "heart");
        client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
            score: -4,
            type: "heart",
        });
    },

    [CLIENT_SERVER_MESSAGE.GET_HIGHLIGHT_RECT] : (room, client, message) => {
        console.log("-----power move message - test range")
        const character = getCharacterById(room, message.characterId);
        
        const powermove = powermoves.find((pm : any) => pm.id == message.powerMoveId);

        client.send( SERVER_TO_CLIENT_MESSAGE.SET_HIGHLIGHT_RECT, {
            tileIds : getHighLightTileIds(room, character.currentTileId, powermove != null? powermove.range : 1)
        });
    },

    [CLIENT_SERVER_MESSAGE.SET_DICE_ROLL]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        const powermove = getPowerMoveFromId(message.powerMoveId, message.extraItemId);

        if(powermove == null) {
            return;
        }
        const setDiceRollMessage: any = {
            diceData : []
        }
        if(!!powermove.result.dice && message.diceTimes == 1) {

            if(powermove.result.dice == DICE_TYPE.DICE_4 || powermove.result.dice == DICE_TYPE.DICE_6) {
                setDiceRollMessage.diceData.push({
                    type: powermove.result.dice,
                    diceCount: getDiceCount(Math.random(), powermove.result.dice)
                })
            } else if(powermove.result.dice == DICE_TYPE.DICE_6_4) {
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_6,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                })
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_4,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                })
            } else if(powermove.result.dice == DICE_TYPE.DICE_6_6) {
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_6,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                })
                setDiceRollMessage.diceData.push({
                    type: DICE_TYPE.DICE_6,
                    diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                })
            }

        }
        
        if(!!powermove.result.perkId && powermove.result.perkId == PERKTYPE.Vampire) {
            setDiceRollMessage.diceData.push({
                type: DICE_TYPE.DICE_6,
                diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
            })
            setDiceRollMessage.diceData.push({
                type: DICE_TYPE.DICE_4,
                diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
            })
        }

        client.send( SERVER_TO_CLIENT_MESSAGE.SET_DICE_ROLL, setDiceRollMessage);
    },

    [CLIENT_SERVER_MESSAGE.SET_DICE_STACK_TURN_ROLL]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        const diceType = message.diceType;
        
        const setDiceRollMessage: any = {
            diceData : []
        }
        if(diceType == DICE_TYPE.DICE_6_4) {
            setDiceRollMessage.diceData.push({
                type: DICE_TYPE.DICE_6,
                diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
            })
            setDiceRollMessage.diceData.push({
                type: DICE_TYPE.DICE_4,
                diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
            })
        } else if(diceType == DICE_TYPE.DICE_4) {
            setDiceRollMessage.diceData.push({
                type: DICE_TYPE.DICE_4,
                diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
            })
        }

        client.send( SERVER_TO_CLIENT_MESSAGE.SET_DICE_ROLL, setDiceRollMessage);
    },

    [CLIENT_SERVER_MESSAGE.TURN_START_EQUIP]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        if(room.state.currentCharacterId == character.id) {
            let bonuses: any = [];
            character.equipSlots.forEach(slot => {
                // ADD BONUS in CHARACTER..
                const bonus = {
                    ...EQUIP_TURN_BONUS[slot.id],
                    id: slot.id,
                }

                if(!!bonus.items) {
                    bonus.items.forEach(item => {
                        addItemToCharacter(item.id, item.count, character);
                    })
                }

                if(!!bonus.stacks) {
                    bonus.stacks.forEach(stack => {
                        addStackToCharacter(stack.id, stack.count, character, client);
                    });
                }

                if(!!bonus.randomItems) {
                    const idx = Math.floor(bonus.randomItems.length * Math.random())
                    const item = bonus.randomItems[idx];
                    delete bonus.randomItems;
                    bonus.items.push(item);
                    addItemToCharacter(item.id, item.count, character);
                }

                bonuses.push(bonus);
            })

            if(bonuses.length > 0) {
                client.send( SERVER_TO_CLIENT_MESSAGE.GET_TURN_START_EQUIP, { bonuses });
            }
        }
    },

    [CLIENT_SERVER_MESSAGE.GET_STACK_ON_TURN_START]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

        if(character.stats.isRevive) {
            character.stats.isRevive = false;
            return;
        }

        let stackList: any[] = [];
        character.stacks.forEach(stack => {
            if(
                (stack.id == STACKTYPE.Void && stack.count > 0 && !IsEquipPower(character, POWERTYPE.Void2) && !IsEquipPower(character, POWERTYPE.Void3)) ||
                (stack.id == STACKTYPE.Burn && stack.count > 0 && !IsEquipPower(character, POWERTYPE.Fire2) && !IsEquipPower(character, POWERTYPE.Fire3)) ||
                (stack.id == STACKTYPE.Freeze && stack.count > 0 && !IsEquipPower(character, POWERTYPE.Ice2) && !IsEquipPower(character, POWERTYPE.Ice3)) ||
                (stack.id == STACKTYPE.Cure && stack.count > 0) ||
                (stack.id == STACKTYPE.Slow && stack.count > 0)
            
            ) {
                stackList.push({
                    id : stack.id,
                    count: 1
                });
            }
        });

        client.send( SERVER_TO_CLIENT_MESSAGE.GET_STACK_ON_TURN_START, {
            characterId : character.id,
            stackList: stackList
        });

    },

    [CLIENT_SERVER_MESSAGE.SET_STACK_ON_START]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        const stackId = message.stackId;
        const diceData = message.diceData;

        character.stacks.forEach(stack => {
            if(stack.id == stackId) {
                stack.count--;
            }
        });

        if(stackId == STACKTYPE.Cure) {
            
            let extra = character.stats.health.add(diceData[0].diceCount);
            if(extra > 0) {
                character.stats.coin += extra;
            }
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: diceData[0].diceCount,
                type: "heart"
            });

        } else if(stackId == STACKTYPE.Void) {
            setCharacterHealth(character, -diceData[1].diceCount, room, client, "heart");
            character.stats.ultimate.add(-diceData[0].diceCount);
            
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[1].diceCount,
                type: "heart"
            });

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[0].diceCount,
                type: "ultimate"
            });

        } else if(stackId == STACKTYPE.Burn) {
            setCharacterHealth(character, -diceData[0].diceCount, room, client, "heart");
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[0].diceCount,
                type: "heart"
            });

        } else if(stackId == STACKTYPE.Freeze) {

            character.stats.energy.add(diceData[0].diceCount);
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: diceData[0].diceCount,
                type: "energy"
            });

        } else if(stackId == STACKTYPE.Charge) {

            character.stats.energy.add(-diceData[0].diceCount);
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[0].diceCount,
                type: "energy"
            });
            
        } else if(stackId == STACKTYPE.Slow) {

            character.stats.energy.add(-diceData[1].diceCount);
            character.stats.ultimate.add(-diceData[0].diceCount);
            
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[1].diceCount,
                type: "energy"
            });

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[0].diceCount,
                type: "ultimate"
            });

        }
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
