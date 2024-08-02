import { UfbRoom } from "#game/UfbRoom";
import { Client } from "@colyseus/core";

export const getClientCharacter = (room: UfbRoom, client: Client) => {
    const playerId = room.sessionIdToPlayerId.get(client.sessionId);
    return room.state.characters.get(playerId);
};

export const getCharacterById = (room : UfbRoom, id : string) => {
    return room.state.characters.get(id);
}
