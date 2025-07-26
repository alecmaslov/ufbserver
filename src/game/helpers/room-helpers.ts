import { UfbRoom } from "#game/UfbRoom";
import { Client } from "@colyseus/core";
import { coordToTileId } from "./map-helpers";
import { CoordinatesState } from "#game/schema/CharacterState";
import { ITEMDETAIL, ITEMTYPE, MONSTER_BAN_TIEM, powers, QUESTS, QUESTTYPE } from "#assets/resources";

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

export const getPowerIdsByLevel = (level : number, isMonster? : boolean) => {
    if(isMonster) {
        return Object.keys(powers).filter((key : any) => powers[key].level == level).map((k : any) => {
            return {
                ...powers[k],
                id: Number(k)
            }
        });
    } else {
        return Object.keys(powers).filter((key : any) => powers[key].level == level).map((k : any) => {
            return {
                ...powers[k],
                id: Number(k)
            }
        });
    }
}

export const getItemIdsByLevel = (level : number, isMonster? : boolean) => {
    if(isMonster) {
        return Object.keys(ITEMDETAIL).filter((key : any) => ITEMDETAIL[key].level == level && !MONSTER_BAN_TIEM[key] && key != ITEMTYPE.BOMB_BAG && key != ITEMTYPE.QUIVER && key != ITEMTYPE.QUIVER2 && key != ITEMTYPE.BOMB_BAG2).map((k : any) => {
            return {
                ...ITEMDETAIL[k],
                id: Number(k)
            }
        });
    } else {
        return Object.keys(ITEMDETAIL).filter((key : any) => ITEMDETAIL[key].level == level && key != ITEMTYPE.BOMB_BAG && key != ITEMTYPE.QUIVER && key != ITEMTYPE.QUIVER2 && key != ITEMTYPE.BOMB_BAG2).map((k : any) => {
            return {
                ...ITEMDETAIL[k],
                id: Number(k)
            }
        });
    }
}

export const getQuestTargetValue = (id: number, level: number) => {
    if(id == QUESTTYPE.SLAYER){
        return QUESTS[id].value * level;
    } else if(id == QUESTTYPE.GLITTER) {
        return QUESTS[id].value * level;
    } else if(id == QUESTTYPE.KILL) {
        return QUESTS[id].value * level;
    } else if(id == QUESTTYPE.CRAFTS) {
        return QUESTS[id].value * level;
    } else if(id == QUESTTYPE.LUCK) {
        return QUESTS[id].value * level;
    } else if(id == QUESTTYPE.ENERGY) {
        return QUESTS[id].value * level;
    } else if(id == QUESTTYPE.STRENGTH) {
        return level == 1? QUESTS[id].value :  15;
    } else if(id == QUESTTYPE.LIFE) {
        return QUESTS[id].value * level;
    }
}
