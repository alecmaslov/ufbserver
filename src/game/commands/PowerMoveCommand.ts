import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { CharacterState, Item } from "#game/schema/CharacterState";
import { refusalReason, tileIndex, type LosTile } from "#game/line-of-sight";
import { ADD_EXTRA_TYPE, DICE_TYPE, EDGE_TYPE, EQUIP_EXTRA_BONUS, ITEMDETAIL, ITEMTYPE, PERKTYPE, POWERTYPE, QUESTTYPE, STACKTYPE, powermoves, powers, stacks } from "#assets/resources";
import { CLIENT_SERVER_MESSAGE, SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { addItemToCharacter, addStackToCharacter, getCharacterIdsInArea, getCountFromItem, getDiceCount, getEquipBonusDamage, getPerkEffectDamage, getPowerMoveFromId, IsEmptyTile, IsEnemyAdjacent, resolvePushPull, setCharacterEnergy, setCharacterHealth, setPerkEffectDamage, setQuestResult } from "#game/helpers/map-helpers";
import { PathStep } from "#shared-types";
import { breakAmbush, isInvisible } from "#game/ultimates";
import { IsArrowItem, IsBombItem } from "#game/helpers/map-helpers";

type OnPowerMoveCommandPayload = {
    client: Client;
    message: any;
};
export class PowerMoveCommand extends Command<UfbRoom, OnPowerMoveCommandPayload> {
    validate({ client, message }: OnPowerMoveCommandPayload) {
        return !isNullOrEmpty(message.powerMoveId);
    }

    execute({ client, message }: OnPowerMoveCommandPayload) {
        const character = getCharacterById(this.room, message.characterId);
        const enemy = getCharacterById(this.room, message.enemyId);

        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
            return;
        }
        if(!enemy){
            this.room.notify(client, "Enemy are not in room game!", "error");
            return; 
        }
        if(enemy.id !== character.id && isInvisible(enemy)) {
            this.room.notify(client, `${enemy.displayName} is invisible — you can't target them.`, "error");
            return;
        }

        const powerMoveId = message.powerMoveId;

        let powermove = getPowerMoveFromId(powerMoveId, message.extraItemId);
        if (!powermove) { this.room.notify(client, "Unknown power move.", "error"); return; }

        // Ranged moves fire ammo from your inventory (rules: "The Bow fires arrows from your inventory", "The Cannon
        // launches bombs and caltrops from your inventory"). The move lists a Random* placeholder; spend the arrow /
        // bomb the player picked (extraItemId), or a plain one, and apply that ammo's damage and stack.
        const AMMO_SLOTS = [ITEMTYPE.RandomArrow, ITEMTYPE.RandomBomb, ITEMTYPE.RandomArrowOrBomb];
        const slot = powermove.costList.find((c: any) => AMMO_SLOTS.includes(c.id));
        if (slot) {
            const fits = (id: number) => slot.id == ITEMTYPE.RandomArrow ? IsArrowItem(id) : slot.id == ITEMTYPE.RandomBomb ? IsBombItem(id) : (IsArrowItem(id) || IsBombItem(id));
            const has = (id: number) => character.items.some((it) => it.id == id && it.count > 0);
            const plain = slot.id == ITEMTYPE.RandomBomb ? ITEMTYPE.BOMB : ITEMTYPE.ARROW;
            const ammo = message.extraItemId > 0 && fits(message.extraItemId) && has(message.extraItemId) ? message.extraItemId
                : has(plain) ? plain : (character.items.find((it) => it.count > 0 && fits(it.id))?.id ?? -1);
            if (ammo < 0) {
                this.room.notify(client, `You need ${slot.id == ITEMTYPE.RandomBomb ? "a bomb" : slot.id == ITEMTYPE.RandomArrow ? "an arrow" : "an arrow or a bomb"} for ${powermove.name}.`, "error");
                return;
            }
            powermove = getPowerMoveFromId(powerMoveId, ammo);   // adds the ammo to the cost and its damage / stack to the result
            powermove.costList = powermove.costList.filter((c: any) => !AMMO_SLOTS.includes(c.id));
        }

        // Attack moves (they roll dice or deal damage) get the equipped weapon's bonus and any Pump; buffs don't, so
        // a buff never hurts whoever receives it.
        const isAttack = !!powermove.result.dice || (powermove.result.health ?? 0) < 0;
        let extraDamage = getEquipBonusDamage(powermove.powerImageId, character);
        if (isAttack) {
            const pump = character.pumpBonus > 0 ? character.pumpBonus : 0;   // Pump stack: bonus on the next attack
            powermove.result.health = (powermove.result.health ?? 0) - extraDamage.damage - pump;
            if (pump) character.pumpBonus = 0;
        }
        powermove.range += extraDamage.range;

        // Reach: attacks and buffs on someone else need them within range (at least adjacent); a buff on yourself
        // always works. The server never checked distance before.
        if (enemy.id !== character.id) {
            const a = this.room.state.map.tiles.get(character.currentTileId), b = this.room.state.map.tiles.get(enemy.currentTileId);
            const reach = Math.max(1, powermove.range);
            if (a && b && Math.abs(a.coordinates.x - b.coordinates.x) + Math.abs(a.coordinates.y - b.coordinates.y) > reach) {
                this.room.notify(client, `${enemy.displayName} is out of range for ${powermove.name} (${reach}).`, "error");
                return;
            }
        }

        // Targeting: you have to be able to see something to hit it.
        //
        // Melee reaches an adjacent tile on the same level only — not up or down a step, not
        // through a wall, not across a ravine. A ranged weapon may reach one level up or down but
        // never through a wall, and never from the ground over an upper tile to the ground beyond.
        if (enemy.id !== character.id && powermove.range > 0) {
            const tiles = this.room.state.map.tiles;
            const fromTile = tiles.get(character.currentTileId) as unknown as LosTile;
            const toTile = tiles.get(enemy.currentTileId) as unknown as LosTile;
            if (fromTile && toTile) {
                const all: LosTile[] = [];
                tiles.forEach((t) => all.push(t as unknown as LosTile));
                const reason = refusalReason(fromTile, toTile, tileIndex(all), powermove.range <= 1);
                if (reason) {
                    this.room.notify(client, reason, "error");
                    return;
                }
            }
        }

        console.log("added: ", powermove);
        let isResult = true;

        if(powermove["coin"] > 0) {
            isResult = character.stats.coin >= powermove.coin;
        }
        if(powermove["light"] > 0 && isResult) {
            isResult = character.stats.energy.current >= powermove.light;
        }
        if(powermove["costList"].length > 0 && isResult) {
            for (let i = powermove.costList.length - 1; i >= 0; i--) {
                const item = powermove.costList[i];
                if (isResult) {
                    if (!(item.id == ITEMTYPE.RandomArrow || item.id == ITEMTYPE.RandomBomb || item.id == ITEMTYPE.RandomArrowOrBomb)) {
                        const idx = character.items.findIndex(ii => ii.id == item.id);
                        if (idx > -1) {
                            isResult = character.items[idx].count >= item.count;
                            if (!isResult) return;
                        } else {
                            isResult = false;
                            return;
                        }
                    } else {
                        // Remove the item from costList
                        powermove.costList.splice(i, 1);
                    }
                }
            }
        }
        if(!!powermove.stackCostList && powermove.stackCostList.length > 0 && isResult){
            powermove.stackCostList.forEach((stack: any) => {
                if(isResult){
                    const idx = character.stacks.findIndex(ii => ii.id == stack.id && ii.count >= stack.count);
                    isResult = idx > -1;
                    if(!isResult) return;
                }
            });
        }

        console.log("------ check logic======", isResult)
        if(!isResult) {
            this.room.notify(
                client,
                "Your item is not enough!",
                "error"
            );
            return;
        }

        // REDUCE COST PART
        Object.keys(powermove).forEach(key => {
            if(key == "range") {

            } else if(key == "light") {
                setCharacterEnergy(character, -powermove.light, this.room, client);
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    characterId: character.id,
                    score: -powermove.light,
                    type: "energy",
                });
            } else if(key == "coin") {
                character.stats.coin -= powermove.coin;
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    characterId: character.id,
                    score: -powermove.coin,
                    type: "coin",
                });
            } else if(key == "costList") {
                powermove.costList.forEach((item: any) => {

                    if(!(item.id == ITEMTYPE.RandomArrow || item.id == ITEMTYPE.RandomBomb || item.id == ITEMTYPE.RandomArrowOrBomb)) {
                        
                        console.log("delete cost item : ", item.id, item.count);
                        addItemToCharacter(item.id, -item.count, character, client);

                        if(item.id == ITEMTYPE.MELEE) {
                            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                characterId: character.id,
                                score: -item.count,
                                type: "melee",
                            });
                        } else if(item.id == ITEMTYPE.MANA) {
                            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                characterId: character.id,
                                score: -item.count,
                                type: "mana",
                            });
                        }
                    }
                });
            } else if(key == "stackCostList"){
                powermove.stackCostList.forEach((stack: any) => {
                    addStackToCharacter(stack.id, -stack.count, character, client, null);
                });
            }
        });

        console.log("------ check cost ppart======")

        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.DEFENCE_ATTACK, {
            pm: powermove,
            originId: character.id,
            targetId: enemy.id
        }, {except: client});


        // ADD RESOULT PART -- IMPORTANT
        let target : CharacterState;
        let from : CharacterState;
        // if(powermove.range == 0) {
        //     target = character;
        //     from = enemy;
        // } else {
            target = enemy;
            from = character;
        // }

        if(target == null) return;

        Object.keys(powermove.result).forEach(key => {
            if(key == "health") {
                setCharacterHealth(target, powermove.result.health, this.room, client, "heart", from);

                // if(target == enemy && target.stats.health.current == 0) {
                //     this.room.RewardFromMonster(character, target, client);
                // }

                this.room.sendBroadcastStats(powermove.result.health, target == character? ADD_EXTRA_TYPE.HEART : ADD_EXTRA_TYPE.HEART_ENEMY, null, target.id);
            } else if(key == "energy") {
                target.stats.energy.add(powermove.result.energy);
                this.room.sendBroadcastStats(powermove.result.energy, target == character? ADD_EXTRA_TYPE.ENERGY : ADD_EXTRA_TYPE.ENERGY_ENEMY, null, target.id);
            } else if(key == "coin") {
                target.stats.coin += powermove.result.coin;
                setQuestResult(QUESTTYPE.GLITTER, powermove.result.coin, target);
                this.room.sendBroadcastStats(powermove.result.coin, ADD_EXTRA_TYPE.COIN, null, target.id);
            } else if(key == "ultimate") {
                target.stats.ultimate.add(powermove.result.ultimate);
                this.room.sendBroadcastStats(powermove.result.ultimate, target == character? ADD_EXTRA_TYPE.ULTIMATE : ADD_EXTRA_TYPE.ULTIMATE_ENEMY, null, target.id);
            } else if((key == "perkId" || key == "perkId1") && target == enemy) {

                if(powermove.result[key] == PERKTYPE.AreaOfEffect) {
                    const enemyIds = getCharacterIdsInArea(character, powermove.range, this.room);
                    enemyIds.forEach(id => {
                        setCharacterHealth(this.room.state.characters.get(id), -1, this.room, client, "heart", from);
                    })

                } else {

                    if(getCountFromItem(STACKTYPE.Steady, enemy.stacks) > 0) {
                        // REMOVE PERK EFFECT BY STEADY STACK
                        console.log("ACTIVE STEADY STACK....", character.id);
                        client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_STACK_PERK_TOAST, {
                            characterId : character.id,
                            stackId : STACKTYPE.Steady,
                            perkId : powermove.result[key],
                            count : getCountFromItem(STACKTYPE.Steady, enemy.stacks),
                        });

                        addStackToCharacter(STACKTYPE.Steady, -1, enemy, client, this.room);

                    } else {
                        const result = getPerkEffectDamage(character, enemy, this.room, powermove.result[key]);
                        console.log("perk: ", result);
                        if(powermove.result[key] != PERKTYPE.Vampire){
                            resolvePushPull(this.room, client, from, target, powermove.result[key], result);
                        }

                    }
                }

            } else if(key == "items") {
                let ctn = 0;
                powermove.result.items.forEach((item : any) => {
                    const id = item.id;

                    if(target == enemy && getCountFromItem(STACKTYPE.Dodge, enemy.stacks) > 0) {

                        addStackToCharacter(STACKTYPE.Dodge, -1, enemy, client, this.room);

                        // DODGE STACK ... remove Item effect
                        client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_STACK_ITEM_TOAST, {
                            characterId : character.id,
                            stack1 : id,
                            stack2 : STACKTYPE.Dodge,
                            count1 : item.count,
                            count2 : getCountFromItem(STACKTYPE.Dodge, enemy.stacks)
                        });

                    } else {
                        addItemToCharacter(item.id, item.count, target);

                    }


                    ctn += item.count;
                    
                    if(id == ITEMTYPE.MELEE) {
                        this.room.sendBroadcastStats(item.count, ADD_EXTRA_TYPE.MELEE, null, target.id);
                    } else if(id == ITEMTYPE.MANA) {
                        this.room.sendBroadcastStats(item.count, ADD_EXTRA_TYPE.MANA, null, target.id);
                    }
                })

                this.room.sendBroadcastStats(ctn, ADD_EXTRA_TYPE.ITEM, null, target.id);
            } else if(key == "stacks") {
                let ctn = 0;
                powermove.result.stacks.forEach((stack : any) => {
                    if(target == enemy && getCountFromItem(STACKTYPE.Reflect, enemy.stacks) > stack.count) {
                        addStackToCharacter(STACKTYPE.Reflect, -stack.count, enemy, client);

                        client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                            characterId : character.id,
                            stack1 : stack.id,
                            stack2 : STACKTYPE.Reflect,
                            count1 : stack.count,
                            count2 : getCountFromItem(STACKTYPE.Reflect, enemy.stacks)
                        });

                    } else {
                        console.log("add charcter stack....", stack.id, stack, target==enemy)

                        addStackToCharacter(stack.id, stack.count, target, client);
                    }
                    ctn += stack.count;
                })
                console.log("use stack....", ctn);
                if(ctn > 0) {
                    this.room.sendBroadcastStats(ctn, ADD_EXTRA_TYPE.STACK, null, target.id);
                }
            } else if(key == "dice") {
                if(target == enemy) {
                    if(getCountFromItem(STACKTYPE.Block, enemy.stacks) > 0) {
                        addStackToCharacter(STACKTYPE.Block, -1, enemy, client, this.room);
                        
                        client.send(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, {
                            enemyId: enemy.id,
                            characterId: character.id,
                            powerMoveId: message.powerMoveId,
                            stackId: STACKTYPE.Block,
                            diceCount: message.diceCount,
                            enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                        });

                    } else {
                        setCharacterHealth(enemy, -message.diceCount, this.room, client, "heart", from);

                        // if(powerMoveId == 46) { // ICICLE
                        //     tar
                        // }

                        // if(target == enemy && target.stats.health.current == 0) {
                        //     this.room.RewardFromMonster(character, target, client);
                        // }
                        this.room.sendBroadcastStats(-message.diceCount, ADD_EXTRA_TYPE.HEART_ENEMY, null, enemy.id);

                        if(getCountFromItem(STACKTYPE.Revenge, enemy.stacks) > 0 && IsEnemyAdjacent(character, enemy, this.room)) {

                            client.send(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, {
                                enemyId: enemy.id,
                                characterId: character.id,
                                powerMoveId: message.powerMoveId,
                                stackId: STACKTYPE.Revenge,
                                diceCount: 0,
                                enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                            });
    
                        }
                    }
                }
            }
        });

        if(message.vampireCount > 0) {
            console.log("vampirecount: ", message.vampireCount);
            setCharacterHealth(character, message.vampireCount, this.room, client, "heart", from);
            setCharacterHealth(target, -message.diceCount, this.room, client, "heart", from);
            this.room.sendBroadcastStats(message.vampireCount, ADD_EXTRA_TYPE.HEART, null, character.id);
            this.room.sendBroadcastStats(-message.diceCount, ADD_EXTRA_TYPE.HEART_ENEMY, null, target.id);
        }

        if(target == enemy && target.stats.health.current <= 0) {
            this.room.RewardFromMonster(character, target, client);
        }
        breakAmbush(character);
      
        console.log("send attack broadcast");

        setTimeout(() => {
            this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.AI_END_ATTACK, {characterId: character.id}, {except: client})
        }, 1500);
    }
}
