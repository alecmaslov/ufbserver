import { UfbRoom } from "#game/UfbRoom";
import { canMelee } from "#game/line-of-sight";
import { sightChecker, addItemToCharacter, addPowerToCharacter, addStackToCharacter, updateStrengthQuest, coordToGameId, fillPathWithCoords, getCountFromItem, getDiceCount, getDiceTypeFromStack, getEquipBonusDamage, getItemCountFromCharacter, getNextPortalTilePosition, getOpenTilePosition, getPortalPosition, getPowerMoveFromId, GetRandomFreeTileId, getTileIdByDirection, IsEnemyAdjacent, IsEquipPower, sendStatsToClient, setCharacterEnergy, setCharacterHealth, setPerkEffectDamage, setQuestResult } from "#game/helpers/map-helpers";
import { getCharacterById, getClientCharacter, getHighLightTileIds, getItemIdsByLevel, getPowerIdsByLevel, getQuestTargetValue } from "./helpers/room-helpers";
import { CharacterMovedMessage, GetResourceDataMessage, MoveItemMessage, SetMoveItemMessage, SpawnInitMessage } from "#game/message-types";
import { Client } from "@colyseus/core";
import { MoveCommand } from "#game/commands/MoveCommand";
import { EquipCommand } from "./commands/EquipCommand";
import { ItemCommand } from "./commands/ItemCommand";
import { JoinCommand } from "./commands/JoinCommand";
import { CharacterState, Item, Quest } from "#game/schema/CharacterState";
import { ADD_EXTRA_TYPE, CRAFTS_ITEM, DICE_TYPE, EDGE_TYPE, EQUIP_TURN_BONUS, GOOD_STACKS, ITEMDETAIL, ITEMTYPE, PERKTYPE, POWERCOSTS, POWERTYPE, QUESTS, QUESTTYPE, STACKTYPE, TURN_TIME, featherStep, itemResults, powermoves, powers, stacks } from "#assets/resources";
import { PathStep, PowerMove } from "#shared-types";
import { MoveItemEntity, SpawnEntity } from "./schema/MapState";
import { PowerMoveCommand } from "./commands/PowerMoveCommand";
import { getRandomElements } from "#utils/collections";
import { CLIENT_SERVER_MESSAGE, SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { UnEquipCommand } from "./commands/UnEquipCommand";
import { SpawnZoneType } from "@prisma/client";
import { breakAmbush, isInvisible, useUltimate } from "./ultimates";
import { applyTurnStartStack } from "./turn-stacks";
import { DEV_MODE } from "#config";


/** The character this connection controls. Refuses a message that names someone else's character. */
function actor(room: UfbRoom, client: Client, message: any) {
    const c = getClientCharacter(room, client);
    if (!c || (message?.characterId && message.characterId !== c.id)) {
        room.notify(client, "That isn't your character.", "error");
        return null;
    }
    return c;
}
export const MAX_ACTIVE_QUESTS = 3;
/** A merchant visit: that merchant, on this turn. Players may accept one quest per visit. */
const merchantVisit = (room: UfbRoom, c: { currentTileId: string }) => {
    const m = room.state.map.spawnEntities.find((e) => e.tileId === c.currentTileId && e.type === SpawnZoneType.Merchant);
    return m ? `${room.state.turn}:${m.id}` : "";
};
/**
 * The merchant takes a job before it does business: buying, selling and crafting are closed until the shopper
 * has accepted a quest on this visit.
 *
 * Returns the refusal, or "" when trade is allowed. It lets them straight through whenever taking a quest is
 * not actually possible — already holding the maximum, or nothing on offer they don't already have — so the
 * gate can never lock someone out of the shop entirely.
 */
export const questGateFor = (room: UfbRoom, c: CharacterState): string => {
    const visit = merchantVisit(room, c);
    if (!visit) return "";                                       // not standing on a merchant; other checks cover that
    if (room.questVisit.get(c.id) === visit) return "";          // took one on this visit
    if (c.quests.length >= MAX_ACTIVE_QUESTS) return "";         // can't take another
    const takeable = (room.questOffers.get(c.id) ?? []).some((q) => !c.quests.some((h) => h.id === q.id));
    if (!takeable) return "";                                    // nothing left to take
    return "The merchant wants a job taken before any trading.";
};

/** Is there a merchant on the character's tile? */
const atMerchant = (room: UfbRoom, c: { currentTileId: string }) =>
    room.state.map.spawnEntities.some((e) => e.tileId === c.currentTileId && e.type === SpawnZoneType.Merchant);
const merchantOn = (room: UfbRoom, c: { currentTileId: string }) =>
    room.state.map.spawnEntities.find((e) => e.tileId === c.currentTileId && e.type === SpawnZoneType.Merchant);

/**
 * A merchant's stock.
 *
 * Alec's rule (2026-09-29): what a merchant carries is single use. It is drawn once, the first time anyone
 * opens the shop, and a line that is bought is gone — for everyone, and for good, including after the
 * merchant packs up and reappears somewhere else. So the stock lives on the entity (its `inventory`
 * parameter, which is schema state and therefore survives a solo save) rather than being rolled fresh on
 * every visit, which is what let the same Elixir be bought over and over.
 */
export type StockLine = { kind: "item" | "power" | "stack"; id: number };
/**
 * The shelf as recorded, or null when this merchant has never been opened.
 *
 * An empty array is a real answer — a merchant that has been bought out stays bought out. Treating empty
 * as "not recorded yet" would have quietly restocked it on the next visit, which is the opposite of the rule.
 */
const readStock = (e: SpawnEntity): StockLine[] | null => {
    try { const p = JSON.parse(e.parameters || "{}"); return Array.isArray(p.inventory) ? p.inventory : null; }
    catch { return null; }
};
const writeStock = (e: SpawnEntity, stock: StockLine[]) => {
    let p: any = {};
    try { p = JSON.parse(e.parameters || "{}"); } catch { p = {}; }
    p.inventory = stock;
    e.parameters = JSON.stringify(p);
};
/** Is the line still on the shelf? Asked before the price is checked, so "sold out" beats "can't afford". */
const inStock = (e: SpawnEntity | undefined, kind: StockLine["kind"], id: number): boolean => {
    if (!e) return false;
    const stock = readStock(e);
    if (!stock) return true;   // an old merchant with no stock recorded: don't refuse the sale
    return stock.some((x) => x.kind === kind && x.id === id);
};
/** Take the line off the shelf, once the sale is certain. */
const takeFromStock = (e: SpawnEntity | undefined, kind: StockLine["kind"], id: number) => {
    if (!e) return;
    const stock = readStock(e);
    if (!stock) return;
    const i = stock.findIndex((x) => x.kind === kind && x.id === id);
    if (i < 0) return;
    stock.splice(i, 1);
    writeStock(e, stock);
};

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
        room.incrementTurn();   // converts the leftover energy to ultimate
    },

    changeMap: async (room, client, message) => {
        await room.initMap(message.mapName);
    },

    spawnMove: (room, client, message) => {
        console.log(`Tile id: ${message.tileId}, destination: ${message.destination}, playerId: ${message.playerId}, itemBag: ${message.isItemBag}`);
        const looter = actor(room, client, { characterId: message.playerId });
        if (!looter) return;
        const chest = room.state.map.spawnEntities.find((e) => e.tileId === message.tileId && e.type === "Chest");
        if (!chest || looter.currentTileId !== message.tileId) {
            room.notify(client, "There's no chest here to open.", "error");
            return;
        }
        message.isItemBag = /ItemBag/i.test(chest.prefabAddress);   // the chest decides, not the client

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
            characterId: looter.id,
            spawnId: message.isItemBag? "itemBag" : "default",
            item: itemId,
            power: powerId,
            coin: coinCount,
            tileId: message.tileId
        }
        room.pendingLoot.set(looter.id, { spawnId: spawnMessage.spawnId, item: itemId, power: powerId, coin: coinCount, tileId: message.tileId });

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
        room.spawnedIds.add(message.playerId);
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

        // BOMB — and every other bomb. The use handler below accepts all five kinds, but this
        // "where can I put it" query only ever answered for the plain one, so an ice, fire, void or
        // caltrop bomb came back with no legal direction and could not be placed anywhere.
        if(itemId == ITEMTYPE.BOMB || itemId == ITEMTYPE.ICE_BOMB || itemId == ITEMTYPE.FIRE_BOMB
            || itemId == ITEMTYPE.VOID_BOMB || itemId == ITEMTYPE.CALTROP_BOMB) {
            const conditions = [
                "top",
                "right",
                "down",
                "left"
            ];
            conditions.forEach((cond, i) => {
                const id = getTileIdByDirection(room.state.map.tiles, currentTile.coordinates, cond)
                const target = id ? room.state.map.tiles.get(id) : undefined;
                // A bomb goes where you could reach to put one down: an adjacent tile on your own
                // level with nothing solid in between. Without the `id` test this offered placement
                // off the edge of the board, since an empty id matches no spawn entity either.
                if(target
                    && canMelee(currentTile as any, target as any)
                    && room.state.map.spawnEntities.findIndex(entity => entity.tileId == id) == -1) {
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

        if(itemId == ITEMTYPE.BOMB || itemId == ITEMTYPE.ICE_BOMB || itemId == ITEMTYPE.FIRE_BOMB || itemId == ITEMTYPE.VOID_BOMB || itemId == ITEMTYPE.CALTROP_BOMB) {
            const idx = room.state.map.moveItemEntities.findIndex(mItem => mItem.tileId == tileId)
            if(idx == -1) {
                const entity : MoveItemEntity = new MoveItemEntity();
                entity.itemId = itemId;
                entity.tileId = tileId;
                entity.playerId = character.id;
                room.state.map.moveItemEntities.push(entity);
            } else {
                room.state.map.moveItemEntities.deleteAt(idx);
            }

            setCharacterEnergy(character, -1, room, client);
            sendStatsToClient(-1, ADD_EXTRA_TYPE.ENERGY, client);

        } else if(itemId == ITEMTYPE.POTION) {
            console.log("user posion item")
            // Healing past max health pays the overflow as gold. setCharacterHealth returns the new HP, not the
            // overflow, so work the overheal out before healing (it used to pay the whole HP as gold).
            const hp = character.stats.health;
            const extra = Math.max(0, hp.current + 5 - hp.max);
            setCharacterHealth(character, 5, room, client, "heart", character);

            sendStatsToClient(5, ADD_EXTRA_TYPE.HEART, client);

            if(extra > 0) {
                character.stats.coin += extra;
                setQuestResult(QUESTTYPE.GLITTER, extra, character);
            }

        } else if(itemId == ITEMTYPE.ELIXIR) {
            setCharacterEnergy(character, 10, room, client);
            character.stats.ultimate.add(10);

            sendStatsToClient(10, ADD_EXTRA_TYPE.ENERGY, client);
            sendStatsToClient(10, ADD_EXTRA_TYPE.ULTIMATE, client);

            addStackToCharacter(STACKTYPE.Cure, 1, character, client, room)
            addStackToCharacter(STACKTYPE.Charge, 1, character, client, room)

        } else if(itemId == ITEMTYPE.FLAME_CHILI) {
            // Rules: +1 Burn stack and +10 ultimate
            character.stats.ultimate.add(10);
            sendStatsToClient(10, ADD_EXTRA_TYPE.ULTIMATE, client);

            addStackToCharacter(STACKTYPE.Burn, 1, character, client, room);
        } else if(itemId == ITEMTYPE.ICE_TEA) {
            // Rules: +1 Freeze stack and +5 energy (it used to give +10 ultimate, like the Flame Chili)
            character.stats.energy.add(5);
            sendStatsToClient(5, ADD_EXTRA_TYPE.ENERGY, client);

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

    // HERO ULTIMATES (ultimates.ts)
    [CLIENT_SERVER_MESSAGE.USE_ULTIMATE]: (room, client, message) => {
        useUltimate(room, client, message);
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

        if(isInvisible(enemy)) {
            room.notify(client, "{name} is invisible — you can't target them.", "error", { name: enemy.displayName });
            return;
        }

        if(!IsEnemyAdjacent(character, enemy, room)) {
            room.notify(
                client,
                "You can't attack because of position!",
                "error"
            );
            return;
        }

        const powermove = getPowerMoveFromId(-100, itemId);

        room.broadcast(SERVER_TO_CLIENT_MESSAGE.DEFENCE_ATTACK, {
            pm: powermove,
            originId: character.id,
            targetId: enemy.id
        }, {except: client});

        room.broadcast(CLIENT_SERVER_MESSAGE.SET_STAB_ATTACK, {
            characterId: character.id,
            enemyId: enemy.id,
            itemType: itemId
        })


        addItemToCharacter(itemId, -1, character, client);

        if(itemId == ITEMTYPE.ARROW){
            setCharacterHealth(enemy, -2, room, client, "heart", character);

            room.sendBroadcastStats(-2, ADD_EXTRA_TYPE.HEART_ENEMY, null, enemy.id);
        } else if(itemId == ITEMTYPE.BOMB_ARROW){
            setCharacterHealth(enemy, -6, room, client, "heart", character);

            room.sendBroadcastStats(-6, ADD_EXTRA_TYPE.HEART_ENEMY, null, enemy.id);

            // PERK PART
            setPerkEffectDamage(character, enemy, room, client, PERKTYPE.Push);

        } else if(itemId == ITEMTYPE.FIRE_ARROW){
            setCharacterHealth(enemy, -3, room, client, "heart", character);
            room.sendBroadcastStats(-3, ADD_EXTRA_TYPE.HEART_ENEMY, null, enemy.id);
            addStackToCharacter(STACKTYPE.Burn, 1, enemy, client);

        } else if(itemId == ITEMTYPE.ICE_ARROW){
            setCharacterHealth(enemy, -3, room, client, "heart", character);

            enemy.stats.ultimate.current -= 3;
            room.sendBroadcastStats(-3, ADD_EXTRA_TYPE.HEART_ENEMY, null, enemy.id);
            room.sendBroadcastStats(-3, ADD_EXTRA_TYPE.ULTIMATE_ENEMY, null, enemy.id);
            addStackToCharacter(STACKTYPE.Freeze, 1, enemy, client);
        } else if(itemId == ITEMTYPE.VOID_ARROW){
            setCharacterHealth(enemy, -4, room, client, "heart", character);
            room.sendBroadcastStats(-4, ADD_EXTRA_TYPE.HEART_ENEMY, null, enemy.id);
            addStackToCharacter(STACKTYPE.Void, 1, enemy, client);
        }

        if(enemy.stats.health.current <= 0) {
            room.RewardFromMonster(character, enemy, client);
        }
        breakAmbush(character);

        setTimeout(() => {
            room.broadcast(SERVER_TO_CLIENT_MESSAGE.AI_END_ATTACK, {characterId: character.id}, {except: client})
        }, 1500);

    },

    [CLIENT_SERVER_MESSAGE.SET_MOVE_POINT] : (room, client, message) => {
        const tileId = message.tileId;
        const character = getCharacterById(room, message.characterId);
        const desTile = room.state.map.tiles.get(message.tileId);

        let portalNextTileId = "";

        room.state.map.spawnEntities.forEach(entity => {
            if(entity.tileId == desTile.id && entity.type == "Portal") {
                portalNextTileId = getPortalPosition(entity, room, character.currentTileId) || "blocked";
            }
        })

        // A refusal is still answered, with `blocked` set: the client puts the move panel up with Move greyed
        // out and says why. Returning nothing left it stuck in its "preview" phase with no panel on screen.
        const refuse = (reason: string) => {
            client.send(SERVER_TO_CLIENT_MESSAGE.SET_MOVE_POINT, {
                characterId: character.id, path: [{ tileId: tileId }], cost: 0, featherCount: 0,
                portalNextTileId: "", blocked: reason,
            });
        };

        if(portalNextTileId == "blocked") {
            refuse("The portal exit is blocked — there is nowhere to come out.");
            return;
        }

        if(character.stats.energy.current == 0) {
            refuse("You don't have enough energy to move there!");
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

        // Only the dice are blocked here: the move's fixed damage (and equip bonus / Charge) already landed in
        // PowerMoveCommand. This used to subtract the fixed part again, counting it twice.
        let deltaCount = diceCount - enemyDiceCount;

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
                setCharacterHealth(character, -enemyDiceCount, room, client, "heart", enemy);   // charges enemy's ultimate

                deltaCount += enemyDiceCount;

                room.sendBroadcastStats(-enemyDiceCount, ADD_EXTRA_TYPE.HEART, null, character.id);

            } else {
                room.broadcast(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, {
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
            setCharacterHealth(enemy, -deltaCount, room, client, "heart", character);   // the attacker is `character` (was `enemy`); charges its ultimate

            room.sendBroadcastStats(-deltaCount, ADD_EXTRA_TYPE.HEART_ENEMY, null, enemy.id);
            room.sendBroadcastStats(-deltaCount, ADD_EXTRA_TYPE.ULTIMATE_ENEMY, null, enemy.id);

            if(pm != null && !!pm.result.stacks && pm.result.stacks.length > 0){
                room.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    characterId: enemy.id,
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
        const shopperNow = getClientCharacter(room, client);
        const entity = shopperNow ? merchantOn(room, shopperNow) : undefined;

        // Alec's rule (2026-09-29): powers come off at the door. You walk into the shop with everything in
        // your bag, so it can all be sold or forged, and you choose what to put back on when you leave.
        // Free — the usual 2 energy to unequip would be a toll for shopping.
        if (shopperNow && entity && shopperNow.equipSlots.length > 0) {
            const taken = [...shopperNow.equipSlots].map((p) => p.id);
            while (shopperNow.equipSlots.length > 0) shopperNow.equipSlots.deleteAt(0);
            taken.forEach((id) => addPowerToCharacter(id, 1, shopperNow));
            taken.forEach((id) => client.send(SERVER_TO_CLIENT_MESSAGE.UNEQUIP_POWER_RECEIVED, { playerId: shopperNow.id, powerId: id }));
        }

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
        let randomItem1 = getRandomElements(itemData1, 3);
        let randomItem2 = getRandomElements(itemData2, 3);

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
        let randomPower = getRandomElements(powerData, 3);

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
        let randomStack = getRandomElements(stackData, 3);

        // First opening of this merchant writes the shelf down; every opening after that reads it back, minus
        // whatever has been bought (sellFromStock).
        if (entity) {
            const recorded = readStock(entity);
            if (recorded) {
                const pick = <T extends { id: number }>(all: T[], kind: StockLine["kind"]) =>
                    recorded.filter((x) => x.kind === kind).map((x) => all.find((c) => c.id === x.id)).filter((x): x is T => !!x);
                randomItem1 = pick(itemData1, "item");
                randomItem2 = pick(itemData2, "item");
                randomPower = pick(powerData, "power");
                randomStack = pick(stackData, "stack");
            } else {
                writeStock(entity, [
                    ...[...randomItem1, ...randomItem2].map((i) => ({ kind: "item" as const, id: i.id })),
                    ...randomPower.map((i) => ({ kind: "power" as const, id: i.id })),
                    ...randomStack.map((i) => ({ kind: "stack" as const, id: i.id })),
                ]);
            }
        }

        // The three jobs are drawn once per visit and then held: the shop front is redrawn after every
        // purchase, and a fresh roll each time would shuffle the board under the shopper's finger.
        const visitNow = shopperNow ? merchantVisit(room, shopperNow) : "";
        const heldOffers = shopperNow && visitNow && room.questOfferVisit.get(shopperNow.id) === visitNow
            ? room.questOffers.get(shopperNow.id) : undefined;

        const questData : Quest[] = heldOffers ?? [];
        // Difficulty ladder (per match): 0 completed → 3 normal, 1 → 2 normal + 1 hard, 2 → 1 + 2, 3+ → 3 hard.
        const hardOffers = Math.min(3, getClientCharacter(room, client)?.questsCompleted ?? 0);
        const Qarray = getRandomElements(Object.keys(QUESTS).map(key => QUESTS[Number(key)]), 3);
        
        for(let i = 0; heldOffers === undefined && i < 3; i++) {
            const quest = new Quest();
            quest.id = Qarray[i].id;
            quest.name = Qarray[i].title;
            quest.level = Qarray[i].level;
            quest.description = Qarray[i].normal;

            // Rewards: normal = a level-1 item, a level-1 power, +1 melee or mana, 3-5 gold.
            // Hard (roughly double) = a level-2 (rarer) item, a level-2 power, 2 melee / 2 mana / 1+1, 6-10 gold.
            const hard = i < hardOffers;
            if (hard) { quest.level = 2; quest.description = Qarray[i].hard.trim(); }
            const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
            // LICENSE TO KILL is the hardest quest to finish, so it pays a tier up: normal at the hard tier, hard at a
            // level-3 tier (a level-3 item and power, 3 melee/mana, 12-20 gold).
            const tier = (hard ? 2 : 1) + (quest.id == QUESTTYPE.KILL ? 1 : 0);   // 1 normal, 2 hard, 3 kill-hard
            quest.itemId = pick(getItemIdsByLevel(tier, false)).id;
            quest.powerId = pick(getPowerIdsByLevel(tier, false)).id;
            const points = tier;   // melee/mana points: 1, 2 or 3, split at random between the two
            quest.melee = Math.floor(Math.random() * (points + 1)); quest.mana = points - quest.melee;
            quest.coin = tier == 1 ? 3 + Math.floor(3 * Math.random()) : tier == 2 ? 6 + Math.floor(5 * Math.random()) : 12 + Math.floor(9 * Math.random());

            questData.push(quest);
        }
        const shopper = shopperNow;
        if (shopper) { room.questOffers.set(shopper.id, questData); if (visitNow) room.questOfferVisit.set(shopper.id, visitNow); }

        const getMerchantDataDataMessage = {
            items: itemData,
            items1: randomItem1,
            items2: randomItem2,
            powers: randomPower,
            stacks: randomStack,
            quests: questData,
            tileId: message.tileId,
            questRules: shopper ? {
                completed: shopper.questsCompleted,
                max: MAX_ACTIVE_QUESTS,
                active: shopper.quests.length,
                acceptedThisVisit: room.questVisit.get(shopper.id) === merchantVisit(room, shopper),
                // Buying, selling and crafting are closed until a job is taken. Computed by the same questGate the
                // trade handlers enforce, so the shop front and the server can never disagree about what is open.
                locked: !!questGateFor(room, shopper),
            } : undefined,
        };

        client.send(SERVER_TO_CLIENT_MESSAGE.GET_MERCHANT_DATA, getMerchantDataDataMessage)
    },

    [CLIENT_SERVER_MESSAGE.MERCHANT_BUY_ITEM]: (room, client, message) => {
        const character = actor(room, client, message);
        if (!character) return;
        const gate = questGateFor(room, character);
        if (gate) { room.notify(client, gate, "error"); return; }
        const type = message.type;
        const id = message.id;
        if (!atMerchant(room, character) || room.state.currentCharacterId !== character.id) {
            room.notify(client, "You can only trade with a merchant you're standing on, on your turn.", "error");
            return;
        }
        const price = type == "item" ? ITEMDETAIL[id]?.cost : type == "power" ? POWERCOSTS[powers[id]?.level]?.cost : type == "stack" ? stacks[id]?.cost : undefined;
        if (!(price > 0)) {   // unknown ids and the -1 "not for sale" prices used to pay the buyer
            room.notify(client, "The merchant doesn't sell that.", "error");
            return;
        }
        // Alec's rule (2026-09-29): stock is single use. Sold out is checked before the price, so a shopper who
        // is also short of gold is told the real reason; the line only leaves the shelf once the sale is certain,
        // so a refused purchase never eats it and two taps on one row can't buy it twice.
        const stall = merchantOn(room, character);
        if (!inStock(stall, type as StockLine["kind"], id)) {
            room.notify(client, "That one is sold — the merchant has no more.", "error");
            return;
        }
        if (character.stats.coin < price) {
            room.notify(client, "You don't have enough gold for that.", "error");
            return;
        }
        takeFromStock(stall, type as StockLine["kind"], id);
        
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
        // and redraw the shop, so the row that was just bought is gone rather than sitting there tappable
        messageHandlers.getMerchantData(room, client, { characterId: character.id, tileId: character.currentTileId });

    },

    [CLIENT_SERVER_MESSAGE.MERCHANT_SELL_ITEM]: (room, client, message) => {
        const character = actor(room, client, message);
        if (!character) return;
        const gate = questGateFor(room, character);
        if (gate) { room.notify(client, gate, "error"); return; }
        const type = message.type;
        const id = message.id;
        if (!atMerchant(room, character) || room.state.currentCharacterId !== character.id) {
            room.notify(client, "You can only trade with a merchant you're standing on, on your turn.", "error");
            return;
        }

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
        const character = actor(room, client, message);
        if (!character) return;
        // Only a quest the merchant actually offered this character; its rewards come from the server's copy.
        const offer = (room.questOffers.get(character.id) ?? []).find((q) => q.id === message.quest?.id);
        if (!offer || character.quests.some((q) => q.id === offer.id)) {
            room.notify(client, "That quest isn't on offer.", "error");
            return;
        }
        const visit = merchantVisit(room, character);
        if (!visit || room.state.currentCharacterId !== character.id) {
            room.notify(client, "Quests are taken from a merchant you're standing on, on your turn.", "error");
            return;
        }
        if (character.quests.length >= MAX_ACTIVE_QUESTS) {
            room.notify(client, "You already have {n} quests — finish one first.", "error", { n: MAX_ACTIVE_QUESTS });
            return;
        }
        if (room.questVisit.get(character.id) === visit) {
            room.notify(client, "You can take one quest per merchant visit.", "error");
            return;
        }
        room.questVisit.set(character.id, visit);
        message = { ...message, quest: offer };

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
        updateStrengthQuest(character);   // stacks already held count toward "get N stacks at once"
        setQuestResult(QUESTTYPE.GLITTER, 0, character);   // and gold already held toward ALL THAT GLITTERS

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

        if (getClientCharacter(room, client)?.id !== character.id) {
            room.notify(client, "That isn't your character.", "error");
            return;
        }
        let claimed: Quest | null = null;
        character.quests.forEach(q => {
            if(q.id == message.questId){
                const progress = q.id == QUESTTYPE.GLITTER ? character.stats.coin : q.complete;   // gold held right now
                if (!(q.target > 0) || progress < q.target) {
                    if (q.id == QUESTTYPE.GLITTER) room.notify(client, "You need {n} gold in your purse to cash this in.", "error", { n: q.target });
                    else room.notify(client, "That quest isn't finished yet.", "error");
                    return;
                }
                if (ITEMDETAIL[q.itemId]) addItemToCharacter(q.itemId, 1, character, client);
                if (powers[q.powerId]) addPowerToCharacter(q.powerId, 1, character);
                // permanent melee / mana capacity, as many points as the quest lists (hard quests give 2)
                if (q.melee > 0) character.stats.maxMelee += q.melee;
                if (q.mana > 0) character.stats.maxMana += q.mana;
                character.stats.coin += q.coin;
                claimed = q;
                character.questsCompleted += 1;
            }
        });
        if (claimed) {   // a claimed quest leaves the list, freeing one of the MAX_ACTIVE_QUESTS slots
            const i = character.quests.indexOf(claimed);
            if (i >= 0) character.quests.splice(i, 1);
        }
    },

    [CLIENT_SERVER_MESSAGE.MERCHANT_ADDCRAFTITEM]: (room, client, message) => {
        const character = actor(room, client, message);
        if (!character) return;
        const gate = questGateFor(room, character);
        if (gate) { room.notify(client, gate, "error"); return; }
        if (!atMerchant(room, character) || room.state.currentCharacterId !== character.id) {
            room.notify(client, "You can only craft at a merchant you're standing on, on your turn.", "error");
            return;
        }
        const type = message.type;
        const idx1 = message.idx1;
        const idx2 = message.idx2;
        // The client only names the inputs; the result and the fee come from the server's tables.
        let idx3: number, coin: number;
        if (type == "item") {
            const recipe = CRAFTS_ITEM.find((r) => (r.item1 == idx1 && r.item2 == idx2) || (r.item1 == idx2 && r.item2 == idx1));
            if (!recipe) { room.notify(client, "That isn't a recipe.", "error"); return; }
            idx3 = recipe.result; coin = recipe.coin;
        } else if (type == "power") {
            const lvl = powers[idx1]?.level;
            if (idx1 !== idx2 || !(lvl < 3) || !powers[idx1 + 12]) { room.notify(client, "Forging needs two copies of the same level 1 or 2 power.", "error"); return; }
            idx3 = idx1 + 12; coin = lvl === 1 ? 10 : 20;
        } else { room.notify(client, "Unknown craft.", "error"); return; }

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
                    (remainCoin < coin ? "You don't have enough gold to craft that item!" : "You don't have enough items to craft that!"),
                    "error"
                );
                return;
            } else {

                if(it1.id == it2.id && it1.count < 2) {
                    room.notify(
                        client,
                        (remainCoin < coin ? "You don't have enough gold to craft that item!" : "You don't have enough items to craft that!"),
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

            if(it1 != null && it2 != null)
                console.log("power1 : ", it1.count, " power2 : ", it2.count)

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
                        (remainCoin < coin ? "You don't have enough gold to craft that item!" : "You don't have enough items to craft that!"),
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
            characterId: character.id,
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

        // only tiles the move can actually reach: in range and in line of sight (same rule as PowerMoveCommand)
        const range = powermove != null? Math.max(powermove.range + extraDamage.range, 1) : 1;
        const sees = sightChecker(room, range);
        client.send( SERVER_TO_CLIENT_MESSAGE.SET_HIGHLIGHT_RECT, {
            tileIds : getHighLightTileIds(room, character.currentTileId, range).filter((id: string) => id == character.currentTileId || sees(character.currentTileId, id))
        });
    },

    [CLIENT_SERVER_MESSAGE.SET_DICE_ROLL]: (room, client, message) => {
        const target = getCharacterById(room, message.characterId);
        const character = getClientCharacter(room, client);
        const powermove = getPowerMoveFromId(message.powerMoveId, message.extraItemId);

        if(powermove == null) {
            return;
        }

        room.broadcast(SERVER_TO_CLIENT_MESSAGE.DEFENCE_ATTACK, {
            pm: powermove,
            originId: character.id,
            targetId: target.id
        }, {except: client});

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

    [CLIENT_SERVER_MESSAGE.SEND_ATTACK_BROADCAST] : (room, client, message) => {
        const powerMoveId = message.powerMoveId;
        let powermove = getPowerMoveFromId(powerMoveId, message.extraItemId);
      
        const character = getCharacterById(room, message.characterId);
        const enemy = getCharacterById(room, message.enemyId);

        if (!character) {
            room.notify(client, "You are not in room game!", "error");
            return;
        }
        if(!enemy){
            room.notify(client, "Enemy are not in room game!", "error");
            return; 
        }
        
        room.broadcast(SERVER_TO_CLIENT_MESSAGE.DEFENCE_ATTACK, {
            pm: powermove,
            originId: character.id,
            targetId: enemy.id
        }, {except: client});
    },

    [CLIENT_SERVER_MESSAGE.TURN_START_EQUIP]: (room, client, message) => {
        const character = actor(room, client, message);
        if (!character) return;
        if (room.equipBonusTurn.get(character.id) === room.state.turn) return;   // already paid this turn
        if(room.state.currentCharacterId == character.id) {
            room.equipBonusTurn.set(character.id, room.state.turn);
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
                (stack.id == STACKTYPE.Pump && stack.count > 0 && !(character?.pumpBonus > 0)) ||
                (stack.id == STACKTYPE.Charge && stack.count > 0)
            ) {
                // Every eligible stack rolls, and they all go over in one message so the client can throw the
                // whole handful of dice together. This used to stop after three, silently skipping the rest.
                stackList.push({
                    id : stack.id,
                    count: 1
                });

                const diceType = getDiceTypeFromStack(stack.id);
        
                const dice: any = {
                    diceData : []
                }
                if(diceType == DICE_TYPE.DICE_4_4) {
                    dice.diceData.push({
                        type: DICE_TYPE.DICE_4,
                        diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                    })
                    dice.diceData.push({
                        type: DICE_TYPE.DICE_4,
                        diceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                    })
                } else if(diceType == DICE_TYPE.DICE_6_4) {
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
        });
        room.stackDice.set(character.id, stackList.map((st: any, i: number) => ({ id: st.id, dice: diceResult[i]?.diceData ?? [] })));
        
        room.broadcast( SERVER_TO_CLIENT_MESSAGE.GET_STACK_ON_TURN_START, {
            characterId : character.id,
            stackList: stackList,
            diceResult: diceResult
        });
        console.log("------------------turn stack of mine........")
    },

    [CLIENT_SERVER_MESSAGE.SET_STACK_ON_START]: (room, client, message) => {
        const character = actor(room, client, message);
        if (!character) return;
        const stackId = message.stackId;
        // Use the dice the server rolled in GET_STACK_ON_TURN_START, never the client's, and only for a stack you hold.
        const rolls = room.stackDice.get(character.id) ?? [];
        const k = rolls.findIndex((r) => r.id == stackId);
        if (k < 0 || getCountFromItem(stackId, character.stacks) <= 0) {
            room.notify(client, "No roll pending for that stack.", "error");
            return;
        }
        const diceData = rolls.splice(k, 1)[0].dice;

        addStackToCharacter(stackId, -1, character, client, room);
        applyTurnStartStack(room, character, stackId, diceData, client);
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
    // Local testing only (DEV_MODE=true): fill a hero's ultimate gauge so every ultimate can be exercised.
    if (DEV_MODE) room.onMessage<any>("DEV_FILL_ULTIMATE", (client, message) => {
        const c = getCharacterById(room, message?.characterId); if (c) c.stats.ultimate.setToMax();
    });
    if (DEV_MODE) room.onMessage<any>("DEV_GIVE", (client, message) => {
        const c = getCharacterById(room, message?.characterId); if (!c) return;
        if (message.itemId !== undefined) addItemToCharacter(message.itemId, message.count ?? 1, c, client);
        if (message.hp !== undefined) c.stats.health.current = message.hp;
        if (message.powerId !== undefined) addPowerToCharacter(message.powerId, message.count ?? 1, c);
        if (message.stackId !== undefined) addStackToCharacter(message.stackId, message.count ?? 1, c, client, room);
        if (message.coin !== undefined) c.stats.coin = message.coin;
    });
    if (DEV_MODE) room.onMessage<any>("DEV_PLACE", (client, message) => {
        const c = getCharacterById(room, message?.characterId); const t = room.state.map.tiles.get(message?.tileId);
        if (c && t) { c.coordinates.x = t.coordinates.x; c.coordinates.y = t.coordinates.y; c.currentTileId = t.id; }
    });
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
