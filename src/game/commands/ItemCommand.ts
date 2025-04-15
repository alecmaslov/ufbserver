import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { ITEMDETAIL, ITEMTYPE, POWERCOSTS, POWERTYPE, STACKTYPE, powers, stacks } from "#assets/resources";
import { addItemToCharacter, addPowerToCharacter, addStackToCharacter } from "#game/helpers/map-helpers";
import { SpawnEntity } from "#game/schema/MapState";

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
        // Object.keys(ITEMTYPE).forEach(key => {
        //     const id = ITEMTYPE[key];
        //     if(!(id == ITEMTYPE.RandomArrow || id == ITEMTYPE.RandomBomb)) {
        //         const testItem : Item = character.items.find(item => item.id == id);
        //         if(testItem == null) {
        //             const newItem = new Item();
        //             newItem.id = id;
        //             newItem.count = 30;
        //             newItem.name = ITEMDETAIL[id].name;
        //             newItem.description = "description";
        //             newItem.level = ITEMDETAIL[id].level;
        //             newItem.cost = ITEMDETAIL[id].cost;
        //             newItem.sell = ITEMDETAIL[id].sell;
        
        //             character.items.push(newItem);
        //         } else {
        //             testItem.count++;
        //         }
        //     }

        // });

        // // ADD STACKS
        // Object.keys(STACKTYPE).forEach(key => {
        //     const testStack : Item = character.stacks.find(stack => stack.id == STACKTYPE[key]);
        //     if(testStack == null) {
        //         console.log(STACKTYPE[key])
        //         const newStack = new Item();
        //         newStack.id = STACKTYPE[key];
        //         newStack.count = 1;
        //         newStack.name = key;
        //         newStack.description = stacks[STACKTYPE[key]].description;
        //         newStack.level = stacks[STACKTYPE[key]].level;
        //         newStack.cost = stacks[STACKTYPE[key]].cost;
        //         newStack.sell = stacks[STACKTYPE[key]].sell;

        //         character.stacks.push(newStack);
        //     }
        // });

        // // ADD POWER for MOVE ITEM
        // [POWERTYPE.Shield3, POWERTYPE.Bow3, POWERTYPE.Armor3, POWERTYPE.Axe2, POWERTYPE.Spear3, POWERTYPE.Crossbow2, POWERTYPE.Cannon3, POWERTYPE.Ice3].forEach(key => {
        //     const testPower : Item = character.powers.find(power => power.id == key);
        //     if(testPower == null) {
        //         const newPower = new Item();
        //         newPower.id = key;
        //         newPower.name = powers[key].name;
        //         newPower.count = 4;
        //         newPower.description = "";
        //         newPower.level = powers[key].level;
        //         newPower.cost = POWERCOSTS[powers[key].level].cost;
        //         newPower.sell = POWERCOSTS[powers[key].level].sell;

        //         character.powers.push(newPower);
        //     } else {
        //         testPower.count++;
        //     }
        // })

        // END TEST

        addItemToCharacter(message.itemId, 1, character);

        console.log("item command: ", message)

        let count = 3;
        if(message.spawnId != "default") {
            count = 2;
            addStackToCharacter(message.powerId, 1, character, client);
        } else {
            addPowerToCharacter(message.powerId, 1, character);
        }

        character.stats.energy.setMaxValue(character.stats.energy.max + count);
        character.stats.health.setMaxValue(character.stats.health.max + count);
        character.stats.energy.add(count);
        let extra = character.stats.health.add(count);
        if(extra > 0) {
            //character.stats.coin += extra;
        }
        character.stats.coin += message.coinCount;
        character.stats.bags++;
        console.log(`itemid : ${message.itemId}, powerId: ${message.powerId}, coinCount: ${message.coinCount}`);

        let idx = -1;
        this.room.state.map.spawnEntities.map((entity: SpawnEntity, id) =>  {
            if(entity.tileId == message.tileId) {
                idx = id;
            }
        });

        if(idx != -1) {
            this.room.state.map.spawnEntities.deleteAt(idx);
        }
    }
}
