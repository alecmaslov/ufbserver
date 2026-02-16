import { UfbRoom } from "#game/UfbRoom";
import { addItemToCharacter, addPowerToCharacter, addStackToCharacter, coordToGameId, fillPathWithCoords, getCountFromItem, getDiceCount, getDiceTypeFromStack, getEquipBonusDamage, getItemCountFromCharacter, getNextPortalTilePosition, getOpenTilePosition, getPerkEffectDamage, getPortalPosition, getPowerMoveFromId, GetRandomFreeTileId, getTileIdByDirection, IsEnemyAdjacent, IsEquipPower, setCharacterEnergy, setCharacterHealth, setPerkEffectDamage, setQuestResult } from "#game/helpers/map-helpers";
import { getCharacterById, getClientCharacter, getHighLightTileIds, getItemIdsByLevel, getPowerIdsByLevel, getQuestTargetValue } from "./helpers/room-helpers";
import { CharacterMovedMessage, GetResourceDataMessage, MoveItemMessage, SetMoveItemMessage, SpawnInitMessage } from "#game/message-types";
import { Client } from "@colyseus/core";
import { MoveCommand } from "#game/commands/MoveCommand";
import { EquipCommand } from "./commands/EquipCommand";
import { ItemCommand } from "./commands/ItemCommand";
import { JoinCommand } from "./commands/JoinCommand";
import { Item, Quest } from "#game/schema/CharacterState";
import { DICE_TYPE, EDGE_TYPE, EQUIP_TURN_BONUS, GOOD_STACKS, ITEMDETAIL, ITEMTYPE, PERKTYPE, POWERCOSTS, POWERTYPE, QUESTS, QUESTTYPE, STACKTYPE, TURN_TIME, featherStep, itemResults, powermoves, powers, stacks } from "#assets/resources";
import { PathStep, PowerMove } from "#shared-types";
import { MoveItemEntity, SpawnEntity } from "./schema/MapState";
import { PowerMoveCommand } from "./commands/PowerMoveCommand";
import { getRandomElements } from "#utils/collections";
import { CLIENT_SERVER_MESSAGE, SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { UnEquipCommand } from "./commands/UnEquipCommand";
import { SpawnZoneType } from "@prisma/client";


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

        const { path, cost } = room.getPathFinder().find(fromTileId, toTileId);

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
        // let itemId = ITEMTYPE.FLAME_CHILI;
        let powerId = lvl1Powers[idxPower].id;

        if(message.isItemBag) {
            coinCount = 2 + Math.round(4 * ( Math.random()));

            const lvl2Items = getItemIdsByLevel(2, false);
            const idx2 = Math.ceil(Math.random() * lvl2Items.length) % lvl2Items.length;
            itemId = lvl2Items[idx2].id;
            // itemId = ITEMTYPE.HEART_PIECE;

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
        console.log(`Init spawn Tile id: ${message.tileId}, destination: ${message.destination}, playerId: ${message.playerId}`);
        console.log("init spawn logic.....")
        room.startTurnTime = Date.now();
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
        room.dispatcher.dispatch(new UnEquipCommand(), {
            client,
            message
        });
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
        
        const itemCount = getItemCountFromCharacter(itemId, character);

        if(character.stats.energy.current == 0) {
            room.notify(
                client,
                "You don't have enough energy",
                "error"
            );
            return;
        }

        if(itemCount == 0) {
            room.notify(
                client,
                "You don't have enough item to move there!",
                "error"
            );
            return;
        }

        addItemToCharacter(itemId, -1, character, client);

        // const idx = character.items.findIndex(it => it.id == itemId && it.count > 0);
        // if(idx != -1) {
        //     character.items[idx].count--;
        // } else {
        //     room.notify(
        //         client,
        //         "Your item is not enough!",
        //         "error"
        //     );
        //     return;
        // }

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

            setCharacterEnergy(character, -1, room, client);
        } else if(itemId == ITEMTYPE.POTION) {

            let extra = setCharacterHealth(character, 5, room, client, "health", character);

            if(extra > 0) {
                character.stats.coin += extra;
                setQuestResult(QUESTTYPE.GLITTER, extra, character);
            }

        } else if(itemId == ITEMTYPE.ELIXIR) {
            setCharacterEnergy(character, 10, room, client);
            character.stats.ultimate.add(10);
            addStackToCharacter(STACKTYPE.Cure, 1, character, client, room)
            addStackToCharacter(STACKTYPE.Charge, 1, character, client, room)

        } else if(itemId == ITEMTYPE.FLAME_CHILI) {
            character.stats.ultimate.add(10);
            addStackToCharacter(STACKTYPE.Burn, 1, character, client, room);
            
        } else if(itemId == ITEMTYPE.ICE_TEA) {

            character.stats.ultimate.add(10);
            addStackToCharacter(STACKTYPE.Freeze, 1, character, client, room);

        } else if(itemId == ITEMTYPE.FEATHER) {

        } else if(itemId == ITEMTYPE.WARP_CRYSTAL) {
            room.state.map.spawnEntities.forEach(entity => {
                if(entity.tileId == message.tileId && entity.type == "Portal") {
                    message.tileId = getOpenTilePosition(entity.tileId, room);
                }
            })
        } 

        const setmoveitemMessage : SetMoveItemMessage = {
            itemId: itemId,
            tileId: message.tileId
        }

        client.send(SERVER_TO_CLIENT_MESSAGE.SET_MOVEITEM, setmoveitemMessage);

    },

    // SET STAB ATTACK PART
    [CLIENT_SERVER_MESSAGE.SET_STAB_ATTACK]:(room, client, message) => {
        const itemId = message.itemId;
        const character = getCharacterById(room, message.characterId);
        const enemy = getCharacterById(room, message.enemyId);

        const itemCount = getItemCountFromCharacter(itemId, character);

        if(character == null) {
            room.notify(
                client,
                "Character is not in the room.",
                "error"
            );
            return;
        }

        if(itemCount == 0) {
            room.notify(
                client,
                "You don't have enough item to move there!",
                "error"
            );
            return;
        }

        room.broadcast(CLIENT_SERVER_MESSAGE.SET_STAB_ATTACK, {
            characterId: character.id,
            itemType: itemId
        })


        addItemToCharacter(itemId, -1, character, client);

        if(itemId == ITEMTYPE.ARROW){
            setCharacterHealth(enemy, -2, room, client, "heart", character);

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -2,
                type: "heart_e",
            });
        } else if(itemId == ITEMTYPE.BOMB_ARROW){
            setCharacterHealth(enemy, -6, room, client, "heart", character);

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -6,
                type: "heart_e",
            });

            // PERK PART
            setPerkEffectDamage(character, enemy, room, client, PERKTYPE.Push);

        } else if(itemId == ITEMTYPE.FIRE_ARROW){
            setCharacterHealth(enemy, -3, room, client, "heart", character);

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -3,
                type: "heart_e",
            });

            addStackToCharacter(STACKTYPE.Burn, 1, enemy, client);

        } else if(itemId == ITEMTYPE.ICE_ARROW){
            setCharacterHealth(enemy, -3, room, client, "heart", character);

            enemy.stats.ultimate.current -= 3;
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -3,
                type: "heart_e",
            });
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -3,
                type: "ultimate_e",
            });

            addStackToCharacter(STACKTYPE.Freeze, 1, enemy, client);


        } else if(itemId == ITEMTYPE.VOID_ARROW){
            setCharacterHealth(enemy, -4, room, client, "heart", character);

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -4,
                type: "heart_e",
            });

            addStackToCharacter(STACKTYPE.Void, 1, enemy, client);
        }

        if(enemy.stats.health.current <= 0) {
            room.RewardFromMonster(character, enemy, client);
        }
    },

    [CLIENT_SERVER_MESSAGE.SET_MOVE_POINT] : (room, client, message) => {
        const tileId = message.tileId;
        const character = getCharacterById(room, message.characterId);
        const desTile = room.state.map.tiles.get(message.tileId);

        let portalNextTileId = "";

        room.state.map.spawnEntities.forEach(entity => {
            if(entity.tileId == desTile.id && entity.type == "Portal") {
                portalNextTileId = getNextPortalTilePosition(entity, room);
            }
        })

        if(character.stats.energy.current == 0) {
            room.notify(
                client,
                "You don't have enough energy to move there!",
                "error"
            );
            return;
        }

        const { path, cost, featherCount } = room.getPathFinder(message.isFeather).find(
            character.currentTileId,
            tileId
        );
        console.log("ai move : ", path.length, cost, featherCount, message.isFeather);

        client.send(SERVER_TO_CLIENT_MESSAGE.SET_MOVE_POINT, {
            characterId: character.id,
            path,
            cost: cost - featherStep * featherCount,
            featherCount,
            portalNextTileId
        });
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

        let extraDamage = getEquipBonusDamage(pm.powerImageId, character);

        const health = !!pm.result.health? (pm.result.health - extraDamage.damage) : 0;

        let deltaCount = diceCount - health - enemyDiceCount;

        if(enemy == null) {
            room.notify(
                client,
                "Enemy missed!",
                "error"
            );
            return;
        }
        if(character == null){
            room.notify(
                client,
                "Character missed!",
                "error"
            );
            return;
        }

        // REVENGE STACK ACTIVE
        if(getCountFromItem(STACKTYPE.Revenge, enemy.stacks) > 0 && IsEnemyAdjacent(character, enemy, room)) {
            if(message.stackId == STACKTYPE.Revenge) {
                addStackToCharacter(STACKTYPE.Revenge, -1, enemy, client, room);
                setCharacterHealth(character, -enemyDiceCount, room, client, "heart", enemy);
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
            setCharacterHealth(enemy, -deltaCount, room, client, "heart", enemy);
            character.stats.ultimate.add(deltaCount);

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

        if(enemy.stats.health.current <= 0) {
            console.log("----reward.. monster")
            room.RewardFromMonster(character, enemy, client);
        }
    },

    [CLIENT_SERVER_MESSAGE.END_REVENGER_STACK]: (room, client, message) => {

    },

    getMerchantData: (room, client, message) => {
        const itemData1 : Item[] = [];
        const itemData2 : Item[] = [];
        const itemData : Item[] = [];
        Object.keys(ITEMTYPE).forEach(key => {
            const id: number = ITEMTYPE[key];
            if(!!ITEMDETAIL[id] && id != ITEMTYPE.BOMB_BAG && id != ITEMTYPE.QUIVER && id != ITEMTYPE.QUIVER2 && id != ITEMTYPE.BOMB_BAG2) {
                let item = new Item();
                item.id = id;
                item.name = ITEMDETAIL[id].name;
                item.level = ITEMDETAIL[id].level;
                item.cost = ITEMDETAIL[id].cost;
                item.sell = ITEMDETAIL[id].sell;
                if(item.level == 1) {
                    itemData1.push(item);
                } else if(item.level == 2) {
                    itemData2.push(item);
                }
                itemData.push(item);
            }
        });
        const randomItem1 = getRandomElements(itemData1, 3);
        const randomItem2 = getRandomElements(itemData2, 3);

        const powerData : Item[] = [];
        Object.keys(powers).forEach(key => {
            const id: number = Number(key);
            let power = new Item();
            power.id = id;
            power.name = powers[id].name;
            power.level = powers[id].level;
            power.cost = POWERCOSTS[power.level].cost;
            power.sell = POWERCOSTS[power.level].sell;
            if(power.level == 1) {
                powerData.push(power);
            }
        });
        const randomPower = getRandomElements(powerData, 3);

        const stackData : Item[] = [];
        Object.keys(stacks).forEach(key => {

            const id: number = Number(key);
            if(id != STACKTYPE.Revive) {
                let stack = new Item();
                stack.id = id;
                stack.name = stacks[id].name;
                stack.level = stacks[id].level;
                stack.cost = stacks[id].cost;
                stack.sell = stacks[id].sell;
                stackData.push(stack);
            }
        });
        const randomStack = getRandomElements(stackData, 3);

        const questData : Quest[] = [];
        const Qarray = getRandomElements(Object.keys(QUESTS).map(key => QUESTS[Number(key)]), 3);
        
        for(let i = 0; i < 3; i++) {
            const quest = new Quest();
            quest.id = Qarray[i].id;
            quest.name = Qarray[i].title;
            quest.level = Qarray[i].level;
            quest.description = Qarray[i].normal;

            const itemKeys = Object.keys(ITEMTYPE);
            let idx = Math.ceil(itemKeys.length * Math.random()) % itemKeys.length;
            quest.itemId = ITEMTYPE[itemKeys[idx]];

            const powerKeys = Object.keys(POWERTYPE);         
            idx = Math.ceil(powerKeys.length * Math.random());
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
            items1: randomItem1,
            items2: randomItem2,
            powers: randomPower,
            stacks: randomStack,
            quests: questData,
            tileId: message.tileId
        };

        client.send(SERVER_TO_CLIENT_MESSAGE.GET_MERCHANT_DATA, getMerchantDataDataMessage)
    },

    [CLIENT_SERVER_MESSAGE.MERCHANT_BUY_ITEM]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

        const type = message.type;
        const id = message.id;
        
        let msg: any = {
            items: [],
            powers: [],
            stacks: [],
            coin: 0
        }

        if(type == "item") {
            if(character.stats.coin >= ITEMDETAIL[id].cost) {
                character.stats.coin -= ITEMDETAIL[id].cost;
                addItemToCharacter(id, 1, character, client);

                msg = {
                    items: [{
                        id : id,
                        count : 1
                    }],
                    powers: [],
                    stacks: [],
                    coin: -ITEMDETAIL[id].cost
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

            const lvl = powers[id].level;

            if(character.stats.coin >= POWERCOSTS[lvl].cost) {
                character.stats.coin -= POWERCOSTS[lvl].cost;
                addPowerToCharacter(id, 1, character);

                msg = {
                    items: [],
                    powers: [{
                        id,
                        count : 1
                    }],
                    stacks: [],
                    coin: -POWERCOSTS[lvl].cost
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
                addStackToCharacter(id, 1, character, client);

                msg = {
                    items: [],
                    powers: [],
                    stacks: [{
                        id,
                        count : 1
                    }],
                    coin: -stacks[id].cost
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

        client.send(SERVER_TO_CLIENT_MESSAGE.MERCHANT_RESULT, msg);

    },

    [CLIENT_SERVER_MESSAGE.MERCHANT_SELL_ITEM]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

        const type = message.type;
        const id = message.id;

        console.log(type, id);
        let msg: any = {
            items: [],
            powers: [],
            stacks: [],
            coin: 0
        }

        if(type == "item") {
            const item =  character.items.find(it => it.id == id);
            if(item == null || item.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to sell item!",
                    "error"
                );
                return;
            } else {
                addItemToCharacter(id, -1, character);
                character.stats.coin += ITEMDETAIL[id].sell;

                setQuestResult(QUESTTYPE.GLITTER, ITEMDETAIL[id].sell, character);

                msg = {
                    items: [{
                        id,
                        count: -1
                    }],
                    powers: [],
                    stacks: [],
                    coin: ITEMDETAIL[id].sell
                }
            }
        } else if(type == "power"){
            const power = character.powers.find(p => p.id == id);
            if(power == null || power.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to sell power!",
                    "error"
                );
                return;
            } else {
                addPowerToCharacter(id, -1, character);
                character.stats.coin += POWERCOSTS[power.level].sell;
                
                setQuestResult(QUESTTYPE.GLITTER, POWERCOSTS[power.level].sell, character);

                msg = {
                    items: [],
                    powers: [{
                        id,
                        count: -1
                    }],
                    stacks: [],
                    coin: POWERCOSTS[power.level].sell
                }
            }

        } else if(type == "stack"){
            const stack = character.stacks.find(s => s.id == id);
            if(stack == null || stack.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to sell stack!",
                    "error"
                );
                return;
            } else {
                addStackToCharacter(id, -1, character, client, room);
                character.stats.coin += stacks[id].sell;

                setQuestResult(QUESTTYPE.GLITTER, stacks[id].sell, character);


                msg = {
                    items: [],
                    powers: [],
                    stacks: [{
                        id,
                        count: -1
                    }],
                    coin: stacks[id].sell
                }
            }
        }

        client.send(SERVER_TO_CLIENT_MESSAGE.MERCHANT_RESULT, msg);
    },

    leaveMerchant: (room, client, message) => {
        let randomTileId = GetRandomFreeTileId(message.tileId, room, SpawnZoneType.Merchant);
        // CHANGE ENTITY POSITION.
        room.state.map.spawnEntities.map((entity: SpawnEntity, id) =>  {
            if(entity.tileId == message.tileId && entity.type == SpawnZoneType.Merchant && randomTileId != "") {
                entity.tileId = randomTileId;
            }
        });
    },

    setActiveQuest: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

        character.quests.forEach(q => {
            
        })

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
        newQ.target = getQuestTargetValue(quest.id, quest.level);
        character.quests.push(newQ);

    },

    [CLIENT_SERVER_MESSAGE.COMPLETE_QUEST]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        if(character == null) {
            room.notify(
                client,
                "It's not your turn!",
                "error"
            );
            return;
        }

        character.quests.forEach(q => {
            if(q.id == message.questId){
                addItemToCharacter(q.itemId, 1, character, client);
                addPowerToCharacter(q.powerId, 1, character);
                if(q.melee > 0){
                    character.stats.maxMelee++;
                    // addItemToCharacter(ITEMTYPE.MELEE, 1, character);
                }
                if(q.mana > 0){
                    character.stats.maxMana++;
                    // addItemToCharacter(ITEMTYPE.MANA, 1, character);
                }
                character.stats.coin += q.coin;

                q.complete = 0;
            }
        });
    },

    [CLIENT_SERVER_MESSAGE.MERCHANT_ADDCRAFTITEM]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        const type = message.type;
        const idx1 = message.idx1;
        const idx2 = message.idx2;
        const idx3 = message.idx3;
        const coin = message.coin;

        let msg: any = {
            items: [],
            powers: [],
            stacks: [],
            coin: -coin
        }

        if(type == "item") {
            const it1 = character.items.find(item => item.id == idx1);
            const it2 = character.items.find(item => item.id == idx2);
            const remainCoin = character.stats.coin;

            if(remainCoin < coin || it1 == null || it1.count == 0 || it2 == null || it2.count == 0) {
                room.notify(
                    client,
                    `You don't have enough ${remainCoin < coin? "gold" : "count"} to craft item!`,
                    "error"
                );
                return;
            } else {

                if(it1.id == it2.id && it1.count < 2) {
                    room.notify(
                        client,
                        `You don't have enough ${remainCoin < coin? "gold" : "count"} to craft item!`,
                        "error"
                    );
                    return;
                }

                character.stats.coin -= coin;
                addItemToCharacter(idx1, -1, character);
                addItemToCharacter(idx2, -1, character);
                addItemToCharacter(idx3, 1, character, client);
                msg.items = [
                    {
                        id: idx1,
                        count: -1
                    },
                    {
                        id: idx2,
                        count: -1
                    },
                    {
                        id: idx3,
                        count: 1
                    },
                ];
            }

        } else if(type == "power") {
            const it1 = character.powers.find(p => p.id == idx1);
            const it2 = character.powers.find(p => p.id == idx2);
            const remainCoin = character.stats.coin;
            if(remainCoin < coin || it1 == null || it1.count == 0 || it2 == null || it2.count == 0) {
                room.notify(
                    client,
                    "You don't have enough count to craft item!",
                    "error"
                );
                return;
            } else {
                if(it1.id == it2.id && it1.count < 2) {
                    room.notify(
                        client,
                        `You don't have enough ${remainCoin < coin? "gold" : "count"} to craft item!`,
                        "error"
                    );
                    return;
                }

                character.stats.coin -= coin;
                addPowerToCharacter(idx1, -1, character);
                addPowerToCharacter(idx2, -1, character);
                addPowerToCharacter(idx3, 1, character);

                msg.powers = [
                    {
                        id: idx1,
                        count: -1
                    },
                    {
                        id: idx2,
                        count: -1
                    },
                    {
                        id: idx3,
                        count: 1
                    },
                ];
            }

        }

        room.notify(
            client,
            "Add Craft Item!",
            "success"
        );

        setQuestResult(QUESTTYPE.CRAFTS, 1, character);
        
        client.send(SERVER_TO_CLIENT_MESSAGE.MERCHANT_RESULT, msg);
    },

    testHealth: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        setCharacterHealth(character, -4, room, client, "heart", null);
        client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
            score: -4,
            type: "heart",
        });
    },

    [CLIENT_SERVER_MESSAGE.GET_ROOM_DATA] : (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

        if(character != null) {
            console.log((Date.now() - room.startTurnTime) / 1000, " room time")
            client.send(
                SERVER_TO_CLIENT_MESSAGE.RECONNECT_ROOM,
                { turn: room.state.turn, characterId: room.state.currentCharacterId, curTime : TURN_TIME - (Date.now() - room.startTurnTime) / 1000 },
            );
        }
    },

    [CLIENT_SERVER_MESSAGE.GET_HIGHLIGHT_RECT] : (room, client, message) => {
        console.log("-----power move message - test range")
        const character = getCharacterById(room, message.characterId);

        const powermove = powermoves.find((pm : any) => pm.id == message.powerMoveId);

        let extraDamage = {damage: 0, range: 1};
        if(powermove != null){
            extraDamage = getEquipBonusDamage(powermove.powerImageId, character);
        }

        client.send( SERVER_TO_CLIENT_MESSAGE.SET_HIGHLIGHT_RECT, {
            tileIds : getHighLightTileIds(room, character.currentTileId, powermove != null? Math.max(powermove.range + extraDamage.range, 1) : 1)
        });
    },

    [CLIENT_SERVER_MESSAGE.SET_DICE_ROLL]: (room, client, message) => {
        const target = getCharacterById(room, message.characterId);
        const character = getClientCharacter(room, client);
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

        // client.send( SERVER_TO_CLIENT_MESSAGE.SET_DICE_ROLL, setDiceRollMessage);
        room.broadcast( SERVER_TO_CLIENT_MESSAGE.SET_DICE_ROLL, setDiceRollMessage);
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
                console.log("equip bouns item", slot.id, EQUIP_TURN_BONUS[slot.id])
                // ADD BONUS in CHARACTER..
                const bonus = {
                    ...EQUIP_TURN_BONUS[slot.id],
                    id: slot.id,
                }

                if(!!bonus.items) {
                    bonus.items.forEach(item => {
                        addItemToCharacter(item.id, item.count, character, client);
                    })
                }

                if(!!bonus.stacks) {
                    bonus.stacks.forEach(stack => {
                        addStackToCharacter(stack.id, stack.count, character, client);
                    });
                }

                // if(!!bonus.randomItems) {
                //     const idx = Math.floor(bonus.randomItems.length * Math.random())
                //     const item = bonus.randomItems[idx];
                //     delete bonus.randomItems;
                //     bonus.items.push(item);
                //     addItemToCharacter(item.id, item.count, character);
                // }

                if(EQUIP_TURN_BONUS[slot.id] != null) {
                    bonuses.push(bonus);
                }
            })

            if(bonuses.length > 0) {
                client.send( SERVER_TO_CLIENT_MESSAGE.GET_TURN_START_EQUIP, { bonuses });
            }
        }
    },

    
    [CLIENT_SERVER_MESSAGE.EQUIP_BONUS_LIST]: (room, client, message) => {
        console.log("equip bonus list.....")
        const character = getCharacterById(room, message.characterId);
        if(room.state.currentCharacterId == character.id) {
            const powerId = message.powerId;
            let bonuses: any = [];
            character.equipSlots.forEach(slot => {
                if(slot.id == powerId) {
                    // ADD BONUS in CHARACTER..
                    if(EQUIP_TURN_BONUS[slot.id] != null) {
                        const bonus = {
                            ...EQUIP_TURN_BONUS[slot.id],
                            id: slot.id,
                        }
                        bonuses.push(bonus);
                    } 
                }
            })

            if(bonuses.length > 0) {
                client.send( SERVER_TO_CLIENT_MESSAGE.EQUIP_BONUS_LIST, { bonuses });
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
        let diceResult: any[] = [];
        character.stacks.forEach(stack => {
            if(
                (stack.id == STACKTYPE.Void && stack.count > 0 && !IsEquipPower(character, POWERTYPE.Void2) && !IsEquipPower(character, POWERTYPE.Void3)) ||
                (stack.id == STACKTYPE.Burn && stack.count > 0 && !IsEquipPower(character, POWERTYPE.Fire2) && !IsEquipPower(character, POWERTYPE.Fire3)) ||
                (stack.id == STACKTYPE.Freeze && stack.count > 0 && !IsEquipPower(character, POWERTYPE.Ice2) && !IsEquipPower(character, POWERTYPE.Ice3)) ||
                (stack.id == STACKTYPE.Cure && stack.count > 0) ||
                (stack.id == STACKTYPE.Slow && stack.count > 0) || 
                (stack.id == STACKTYPE.Pump && stack.count > 0)
            ) {
                if(stackList.length < 3) {
                    stackList.push({
                        id : stack.id,
                        count: 1
                    });

                    const diceType = getDiceTypeFromStack(stack.id);
            
                    const dice: any = {
                        diceData : []
                    }
                    if(diceType == DICE_TYPE.DICE_6_4) {
                        dice.diceData.push({
                            type: DICE_TYPE.DICE_6,
                            diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                        })
                        dice.diceData.push({
                            type: DICE_TYPE.DICE_4,
                            diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                        })
                    } else if(diceType == DICE_TYPE.DICE_4) {
                        dice.diceData.push({
                            type: DICE_TYPE.DICE_4,
                            diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                        })
                    } else if(diceType == DICE_TYPE.DICE_6_6){
                        dice.diceData.push({
                            type: DICE_TYPE.DICE_6,
                            diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                        });
                        dice.diceData.push({
                            type: DICE_TYPE.DICE_6,
                            diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_6)
                        });
                    } else{
                        dice.diceData.push({
                            type: diceType,
                            diceCount: getDiceCount(Math.random(), diceType)
                        });
                    }
                    diceResult.push(dice);
                }
                
            }
        });

        
        client.send( SERVER_TO_CLIENT_MESSAGE.GET_STACK_ON_TURN_START, {
            characterId : character.id,
            stackList: stackList,
            diceResult: diceResult
        });
        console.log("------------------turn stack of mine........")
    },

    [CLIENT_SERVER_MESSAGE.SET_STACK_ON_START]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);
        const stackId = message.stackId;
        const diceData = message.diceData;

        character.stacks.forEach(stack => {
            if(stack.id == stackId) {
                addStackToCharacter(stack.id, -1, character, client, room);
            }
        });

        if(stackId == STACKTYPE.Cure) {
            
            let extra = character.stats.health.add(diceData[0].diceCount);
            if(extra > 0) {
                character.stats.coin += extra;
                setQuestResult(QUESTTYPE.GLITTER, extra, character);

            }
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: diceData[0].diceCount,
                type: "heart"
            });

        } else if(stackId == STACKTYPE.Void) {
            setCharacterHealth(character, -diceData[1].diceCount, room, client, "heart", null);
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
            setCharacterHealth(character, -diceData[0].diceCount, room, client, "heart", null);
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[0].diceCount,
                type: "heart"
            });

        } else if(stackId == STACKTYPE.Freeze) {
            setCharacterEnergy(character, diceData[0].diceCount, room, client);

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: diceData[0].diceCount,
                type: "energy"
            });

        } else if(stackId == STACKTYPE.Charge) {
            setCharacterEnergy(character, -diceData[0].diceCount, room, client);

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[0].diceCount,
                type: "energy"
            });
            
        } else if(stackId == STACKTYPE.Slow) {
            setCharacterEnergy(character, -diceData[1].diceCount, room, client);

            character.stats.ultimate.add(-diceData[0].diceCount);
            
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[1].diceCount,
                type: "energy"
            });

            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -diceData[0].diceCount,
                type: "ultimate"
            });
        } else if(stackId == STACKTYPE.Pump) {
            character.stats.ultimate.add(diceData[0].diceCount);
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: diceData[0].diceCount,
                type: "ultimate"
            });
        }
    },

    [CLIENT_SERVER_MESSAGE.GET_EQUIP_SLOT_LIST]: (room, client, message) => {
        const character = getCharacterById(room, message.characterId);

        let clientMessage: any = {
            data: []
            // data: [
            //     {
            //         power: power,
            //         powermoves: []
            //     }
            // ]
        }


        character.equipSlots.forEach(slot => {
            const slotData : any = {};
            slotData.power = slot;
            slotData.powermoves = [];

            powermoves.forEach((move : any) => {
                if(move.powerIds.indexOf(slot.id) > -1) {
                    const powermove : PowerMove = {
                        id : move.id,
                        name : move.name,
                        powerImageId : move.powerImageId,
                        light : move.light,
                        range : move.range,
                        coin : move.coin,
                        powerIds: [],
                        costList: [],
                        stackCostList: [],
                        result: move.result
                    };
    
                    move.powerIds.forEach((pid : number) => {
                        powermove.powerIds.push(pid);
                    })
                    move.costList.forEach((cost : any) => {
                        const item = new Item();
                        item.id = cost.id;
                        item.count = cost.count;
                        powermove.costList.push(
                            item
                        )
                    });
                    move.stackCostList.forEach((stack:any) => {
                        const item = new Item();
                        item.id = stack.id;
                        item.count = stack.count;
                        powermove.stackCostList.push(
                            item
                        )
                    });
                    slotData.powermoves.push(powermove);
                }
            })

            clientMessage.data.push(slotData);
        })


        client.send(SERVER_TO_CLIENT_MESSAGE.GET_EQUIP_SLOT_LIST, clientMessage);
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
