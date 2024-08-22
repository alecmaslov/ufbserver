import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { ITEMDETAIL, ITEMTYPE, POWERCOSTS, POWERTYPE, STACKTYPE, powers, stacks } from "#assets/resources";

type OnItemCommandPayload = {
    client: Client;
    message: any;
};
export class ItemCommand extends Command<UfbRoom, OnItemCommandPayload> {
    validate({ client, message }: OnItemCommandPayload) {
        return !isNullOrEmpty(message.itemId && message.powerId);
    }

    execute({ client, message }: OnItemCommandPayload) {
        const character = getCharacterById(this.room, message.characterId);

        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }

        // TEST:::
        Object.keys(ITEMTYPE).forEach(key => {
            const id = ITEMTYPE[key];
            const testItem : Item = character.items.find(item => item.id == id);
            if(testItem == null) {
                const newItem = new Item();
                newItem.id = id;
                newItem.count = 30;
                newItem.name = ITEMDETAIL[id].name;
                newItem.description = "description";
                newItem.level = ITEMDETAIL[id].level;
                newItem.cost = ITEMDETAIL[id].cost;
                newItem.sell = ITEMDETAIL[id].sell;
    
                character.items.push(newItem);
            } else {
                testItem.count++;
            }
        })

        // ADD STACKS
        Object.keys(STACKTYPE).forEach(key => {
            const testStack : Item = character.stacks.find(stack => stack.id == STACKTYPE[key]);
            if(testStack == null) {
                console.log(STACKTYPE[key])
                const newStack = new Item();
                newStack.id = STACKTYPE[key];
                newStack.count = 5;
                newStack.name = key;
                newStack.description = stacks[STACKTYPE[key]].description;
                newStack.level = stacks[STACKTYPE[key]].level;
                newStack.cost = stacks[STACKTYPE[key]].cost;
                newStack.sell = stacks[STACKTYPE[key]].sell;

                character.stacks.push(newStack);
            }
        });

        // ADD POWER for MOVE ITEM
        [POWERTYPE.Sword3, POWERTYPE.Fire3, POWERTYPE.Armor3].forEach(key => {
            const testPower : Item = character.powers.find(power => power.id == key);
            if(testPower == null) {
                const newPower = new Item();
                newPower.id = key;
                newPower.name = powers[key].name;
                newPower.count = 1;
                newPower.description = "";
                newPower.level = powers[key].level;
                newPower.cost = POWERCOSTS[powers[key].level].cost;
                newPower.sell = POWERCOSTS[powers[key].level].sell;

                character.powers.push(newPower);
            } else {
                testPower.count++;
            }
        })

        // END TEST

        const item : Item = character.items.find(item => item.id == message.itemId);
        if(item == null) {
            const newItem = new Item();
            newItem.id = message.itemId;
            newItem.count = 1;
            newItem.name = ITEMDETAIL[newItem.id].name;
            newItem.description = "description";
            newItem.level = ITEMDETAIL[newItem.id].level;
            newItem.cost = ITEMDETAIL[newItem.id].cost;
            newItem.sell = ITEMDETAIL[newItem.id].sell;

            character.items.push(newItem);
        } else {
            item.count++;
        }

        const power : Item = character.powers.find(p => p.id == message.powerId);
        if(power == null) {
            const newPower = new Item();
            const id : number = message.powerId;
            newPower.id = id;
            newPower.count = 1;
            newPower.name = powers[id].name;
            newPower.description = "description";
            newPower.level = powers[id].level;
            newPower.cost = POWERCOSTS[newPower.level].cost;
            newPower.sell = POWERCOSTS[newPower.level].sell;

            character.powers.push(newPower);
        } else {
            power.count++;
        }

        let count = 3;
        if(message.spawnId != "default") {
            count = 2;
        }

        character.stats.energy.setMaxValue(character.stats.energy.max + count);
        character.stats.health.setMaxValue(character.stats.health.max + count);
        character.stats.energy.add(count);
        character.stats.health.add(count);
        character.stats.coin += message.coinCount;
        character.stats.bags++;
        console.log(`itemid : ${message.itemId}, powerId: ${message.powerId}, coinCount: ${message.coinCount}`);
    }
}
