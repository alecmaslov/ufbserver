import { UfbRoom } from "#game/UfbRoom";
import { Client } from "@colyseus/core";
import { coordToTileId } from "./map-helpers";
import { CoordinatesState } from "#game/schema/CharacterState";

export const getClientCharacter = (room: UfbRoom, client: Client) => {
    const playerId = room.sessionIdToPlayerId.get(client.sessionId);
    return room.state.characters.get(playerId);
};

export const getCharacterById = (room : UfbRoom, id : string) => {
    return room.state.characters.get(id);
}

export const getHighLightTileIds = (room : UfbRoom, tileId : string, range : number) => {
    const tiles = room.state.map.tiles;
    const tile = tiles.get(tileId);
    let tileIds = [];

    for(let i = -range; i <= range; i++) {
        for(let j = -range; j <= range; j++) {
            if(Math.abs(i) + Math.abs(j) <= range) {
                let x = tile.coordinates.x - i;
                let y = tile.coordinates.y - j;
                let coord = new CoordinatesState();
                coord.x = x;
                coord.y = y;
                let id = coordToTileId(tiles, coord);
                if(id != "") {
                    // TILE STATE COMPARE
                    const compTile = tiles.get(id);
    
                    tileIds.push(id);
                }
            }
        }
    }

    return tileIds;
}
