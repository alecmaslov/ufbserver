import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { Item } from "#game/schema/CharacterState";
import { PowerMoveListMessage } from "#game/message-types";
import { powermoves, POWERTYPE } from "#assets/resources";
import { PowerMove } from "#shared-types";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { addPowerToCharacter } from "#game/helpers/map-helpers";

type OnUnEquipCommandPayload = {
    client: Client;
    message: any;
};
export class UnEquipCommand extends Command<UfbRoom, OnUnEquipCommandPayload> {
    validate({ client, message }: OnUnEquipCommandPayload) {
        return true;
    }

    execute({ client, message }: OnUnEquipCommandPayload) {
        const character = getCharacterById(this.room, message.characterId);
        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }


        const powerId = message.powerId;

        if(character.stats.energy.current <= 2) {
            console.log("energy less");
            this.room.notify(client, "You are not enough in energy!", "error");
            return;
        }

        character.stats.energy.add(-2);
        addPowerToCharacter(powerId , 1, character);

        // DELETE SLOTS SYSTEM
        const idx = character.equipSlots.findIndex(p => p.id == powerId);
        character.equipSlots.deleteAt(idx);

        client.send(SERVER_TO_CLIENT_MESSAGE.UNEQUIP_POWER_RECEIVED, {playerId: character.id, powerId: powerId});

    }
}
