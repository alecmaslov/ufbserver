import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { powers } from "#assets/resources";

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

        console.log("this is room id: haha. test mode.");

        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }

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

        character.stats.energy.add(3);
        character.stats.health.add(3);
        character.stats.coin += message.coinCount;
        character.stats.bags++;
        console.log(`itemid : ${message.itemId}, powerId: ${message.powerId}, coinCount: ${message.coinCount}`);
    }
}
