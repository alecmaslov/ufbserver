import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { ITEMDETAIL, ITEMTYPE, STACKTYPE, powermoves, powers, stacks } from "#assets/resources";

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

        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
            return;
        }

        const powerMoveId = message.powerMoveId;

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
                        console.log("mana", item.id, character.items[idx].count);
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
                        newItem.level = ITEMDETAIL[item.id].level;
                        newItem.name = ITEMDETAIL[item.id].name;
                        newItem.cost = ITEMDETAIL[item.id].cost;
                        newItem.sell = ITEMDETAIL[item.id].sell;

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
                        newStack.cost = stacks[stack.id].cost;
                        newStack.name = stacks[stack.id].name;
                        newStack.description = stacks[stack.id].description;
                        newStack.level = stacks[stack.id].level;
                        newStack.sell = stacks[stack.id].sell;

                        character.stacks.push(newStack);
                    }
                })
            }
        });
      
    }
}
