import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getClientCharacter } from "#game/helpers/room-helpers";

type OnEquipCommandPayload = {
    client: Client;
    message: any;
};
export class EquipCommand extends Command<UfbRoom, OnEquipCommandPayload> {
    validate({ client, message }: OnEquipCommandPayload) {
        return true;
    }

    execute({ client, message }: OnEquipCommandPayload) {
        const character = getClientCharacter(this.room, client);
        character.stats.energy.add(2);
        character.stats.coin += 2;
        console.log("this is room id: haha. test mode.");

        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
        }
        console.log("this is room id: haha. test mode.");

        // const currentTile = this.state.map.tiles.get(character.currentTileId);
        // const destinationTile = this.room.state.map.tiles.get(message.tileId);

        // // this.room.broadcast("characterMoved", characterMovedMessage);

        // if (character.stats.energy.current == 0) {
        //     this.room.notify(client, "You are too tired to continue.");
        //     this.room.incrementTurn();
        // }
    }
}
