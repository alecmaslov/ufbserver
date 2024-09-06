import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { PowerMoveListMessage } from "#game/message-types";
import { powermoves } from "#assets/resources";
import { PowerMove } from "#shared-types";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";

type OnEquipCommandPayload = {
    client: Client;
    message: any;
};
export class EquipCommand extends Command<UfbRoom, OnEquipCommandPayload> {
    validate({ client, message }: OnEquipCommandPayload) {
        return true;
    }

    execute({ client, message }: OnEquipCommandPayload) {
        const character = getCharacterById(this.room, message.characterId);
        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }

        // WHEN PLAYRE CLICK EQUIP POWER
        const powerId = message.powerId;
        
        // REMOVE POWER in Array
        const power : Item = character.powers.find(p => p.id == powerId);
        if(power == null || power.count == 0) {
            console.log("count issue");
            return;
        }
        power.count--;

        // ADD EQUIP SLOTS
        character.equipSlots.push(power);

        character.stats.energy.add(-1);
        // SEND POWER MOVES
        let clientMessage: PowerMoveListMessage = {
            powermoves: []
        }
        powermoves.forEach(move => {
            if(move.powerIds.indexOf(powerId) > -1) {
                const powermove : PowerMove = {
                    id : move.id,
                    name : move.name,
                    powerImageId : move.powerImageId,
                    light : move.light,
                    range : move.range,
                    coin : move.coin,
                    powerIds: [],
                    costList: [],
                    result: move.result
                };

                move.powerIds.forEach(pid => {
                    powermove.powerIds.push(pid);
                })
                move.costList.forEach(cost => {
                    const item = new Item();
                    item.id = cost.id;
                    item.count = cost.count;
                    powermove.costList.push(
                        item
                    )
                })
                clientMessage.powermoves.push(powermove);
            }
        })

        client.send(SERVER_TO_CLIENT_MESSAGE.RECEIVE_POWERMOVE_LIST, clientMessage);

    }
}
