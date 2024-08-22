import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { DICE_TYPE, ITEMDETAIL, ITEMTYPE, STACKTYPE, powermoves, powers, stacks } from "#assets/resources";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { getDiceCount } from "#game/helpers/map-helpers";

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

        const powerMoveId = message.powerMoveId;

        const powermove = powermoves.find(pm => pm.id == powerMoveId);
        let isResult = true;

        console.log(powermove)
        if(powermove["coin"] > 0) {
            isResult = character.stats.coin >= powermove.coin;
        }
        if(powermove["light"] > 0 && isResult) {
            isResult = character.stats.energy.current >= powermove.light;
        }
        if(powermove["costList"].length > 0 && isResult) {
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
                        console.log("mana", item.id, character.items[idx].count);
                    }
                });
            }
        });

        console.log("------ check cost ppart======")

        // ADD RESOULT PART -- IMPORTANT
        let target;
        if(powermove.range == 0) {
            target = character;
        } else {
            target = enemy;
        }

        if(target == null) return;

        Object.keys(powermove.result).forEach(key => {
            if(key == "health") {
                target.stats.health.add(powermove.result.health);
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.health,
                    type: target == character? "heart" : "heart_e",
                });
            } else if(key == "energy") {
                target.stats.energy.add(powermove.result.energy);
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.energy,
                    type: target == character? "energy" : "energy_e",
                });
            } else if(key == "coin") {
                target.stats.coin += powermove.result.coin;
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.coin,
                    type: "coin",
                });
            } else if(key == "ultimate") {
                target.stats.ultimate.add(powermove.result.ultimate);
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.ultimate,
                    type: target == character? "ultimate" : "ultimate_e",
                });
            } else if(key == "perkId") {

            } else if(key == "items") {
                let ctn = 0;
                powermove.result.items.forEach(item => {
                    const id = target.items.findIndex(ii => ii.id == item.id);
                    if(id > -1) {
                        target.items[id].count += item.count;                        
                    } else {
                        const newItem = new Item();
                        newItem.id = item.id;
                        newItem.count = item.count;
                        newItem.level = ITEMDETAIL[item.id].level;
                        newItem.name = ITEMDETAIL[item.id].name;
                        newItem.cost = ITEMDETAIL[item.id].cost;
                        newItem.sell = ITEMDETAIL[item.id].sell;

                        target.items.push(newItem);
                    }

                    ctn += item.count;
                    
                    if(id == ITEMTYPE.MELEE) {
                        client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: item.count,
                            type: "melee",
                        });
                    } else if(id == ITEMTYPE.MANA) {
                        client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: item.count,
                            type: "mana",
                        });
                    }
                })
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: ctn,
                    type: "item",
                });
            } else if(key == "stacks") {
                let ctn = 0;
                powermove.result.stacks.forEach(stack => {
                    const id = target.stacks.findIndex(ii => ii.id == stack.id);
                    if(id > -1) {
                        target.stacks[id].count += stack.count;
                    } else {
                        const newStack = new Item();
                        newStack.id = stack.id;
                        newStack.count = stack.count;
                        newStack.cost = stacks[stack.id].cost;
                        newStack.name = stacks[stack.id].name;
                        newStack.description = stacks[stack.id].description;
                        newStack.level = stacks[stack.id].level;
                        newStack.sell = stacks[stack.id].sell;

                        target.stacks.push(newStack);
                    }
                    ctn += stack.count;
                })
                console.log("use stack....")

                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: ctn,
                    type: "stack",
                });
                if(target == enemy) {
                    client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                        score: ctn,
                        type: "stack_e",
                    });
                }

            } else if(key == "dice") {
                if(target == enemy) {
                    if(!!enemy.stacks[STACKTYPE.Block] && enemy.stacks[STACKTYPE.Block].count > 0) {
                        enemy.stacks[STACKTYPE.Block].count--;
                        client.send(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, {
                            enemyId: enemy.id,
                            characterId: character.id,
                            powerMoveId: message.powerMoveId,
                            stackId: STACKTYPE.Block,
                            diceCount: message.diceCount,
                            enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                        });

                    }
                }
            }
        });
      
    }
}
