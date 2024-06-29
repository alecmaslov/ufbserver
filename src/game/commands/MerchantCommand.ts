import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { STACKTYPE, powers, stacks } from "#assets/resources";

type OnItemCommandPayload = {
    client: Client;
    message: any;
};
export class ItemCommand extends Command<UfbRoom, OnItemCommandPayload> {
    validate({ client, message }: OnItemCommandPayload) {
        return !isNullOrEmpty(message.itemId && message.powerId);
    }

    execute({ client, message }: OnItemCommandPayload) {
        const character = getClientCharacter(this.room, client);

        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }

        // TEST:::
        [5, 18, 19, 20, 21, 8, 9].forEach(id => {
            const testItem : Item = character.items.find(item => item.id == id);
            if(testItem == null) {
                const newItem = new Item();
                newItem.id = id;
                newItem.count = 6;
                newItem.name = `item${id}`;
                newItem.description = "description";
                newItem.level = 1;
    
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
                newStack.level = 1;

                character.stacks.push(newStack);
            }
        });

        // ADD POWER for MOVE ITEM
        [10].forEach(key => {
            const testPower : Item = character.powers.find(power => power.id == key);
            if(testPower == null) {
                const newPower = new Item();
                newPower.id = key;
                newPower.name = powers[key].name;
                newPower.count = 1;
                newPower.description = "";
                newPower.level = 1;

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
            newItem.name = `item${message.itemId}`;
            newItem.description = "description";
            newItem.level = 1;

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
