import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter, getHighLightTileIds } from "#game/helpers/room-helpers";
import { AddUserData, setQuestResult, addItemToCharacter, addStackToCharacter, fillPathWithCoords, getItemCountFromCharacter, GetObstacleTileIds, getPortalPosition, getTileIdByDirection, setCharacterEnergy, setCharacterHealth } from "#game/helpers/map-helpers";
import { CharacterMovedMessage } from "#game/message-types";
import { PathStep } from "#shared-types";
import { ADD_EXTRA_TYPE, EDGE_TYPE, ITEMTYPE, QUESTTYPE, USER_DATA_TYPE, USER_TYPE, featherStep, itemResults, stacks } from "#assets/resources";
import { MoveItemEntity } from "#game/schema/MapState";
import { Item } from "#game/schema/CharacterState";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { refreshAwareness } from "#game/monster-ai";

type OnMoveCommandPayload = {
    client: Client;
    message: any;
    force: boolean;
};
export class MoveCommand extends Command<UfbRoom, OnMoveCommandPayload> {
    validate({ client, message }: OnMoveCommandPayload) {
        return !isNullOrEmpty(message.tileId);
    }

    execute({ client, message, force }: OnMoveCommandPayload) {
        const character = getCharacterById(this.room, message.characterId);
        console.log("move message execute")
        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
            return;
        }

        // if (!force && character.id !== this.state.currentCharacterId) {
        //     this.room.notify(client, "It's not your turn!", "error");
        //     return;
        // }
        const desTileId = message.tileId;
        // Walking onto a portal is two things: the walk, then using the portal. The walk is an ordinary move to
        // the portal's own tile (desTileId), and the warp is applied at the bottom of this method, once the
        // character has arrived — so the client can animate the two separately (PORTAL_USED).
        //
        // This used to rewrite message.tileId to the far side before pathfinding while still routing to
        // desTileId, so the character walked onto the portal and stopped there: portals did nothing at all.
        // Only heroes are taken by a portal; a monster may cross one but never uses it (monster-ai.ts).
        const portalHere = this.state.map.spawnEntities.find(
            (e) => e.tileId == desTileId && e.type == "Portal"
        );
        if (portalHere && character.type == USER_TYPE.USER && getPortalPosition(portalHere, this.room, character.currentTileId) == "") {
            this.room.notify(client, "The portal exit is blocked — there is nowhere to come out.", "error");
            return;
        }

        const currentTile = this.state.map.tiles.get(character.currentTileId);
        const destinationTile = this.room.state.map.tiles.get(message.tileId);

        const obstacleTileIds = GetObstacleTileIds(currentTile.id, this.room);

        if(obstacleTileIds.indexOf(destinationTile.id) != -1) {
            this.room.notify(client, "You can't move this tile!", "error");
            return;
        }

        let directionData = {
            left: 1,
            right: 1,
            top: 1,
            down: 1
        }
        // LEFT
        {
            directionData.left = (destinationTile.walls[3] == EDGE_TYPE.BASIC || 
                destinationTile.walls[3] == EDGE_TYPE.BRIDGE || 
                destinationTile.walls[3] == EDGE_TYPE.STAIR)? 1 : 0;
        }
        // RIGHT
        {
            directionData.right = (destinationTile.walls[1] == EDGE_TYPE.BASIC || 
                destinationTile.walls[1] == EDGE_TYPE.BRIDGE || 
                destinationTile.walls[1] == EDGE_TYPE.STAIR)? 1 : 0;
        }
        // TOP
        {
            directionData.top = (destinationTile.walls[0] == EDGE_TYPE.BASIC || 
                destinationTile.walls[0] == EDGE_TYPE.BRIDGE || 
                destinationTile.walls[0] == EDGE_TYPE.STAIR)? 1 : 0;
        }
        // DOWN
        {
            directionData.down = (destinationTile.walls[2] == EDGE_TYPE.BASIC || 
                destinationTile.walls[2] == EDGE_TYPE.BRIDGE || 
                destinationTile.walls[2] == EDGE_TYPE.STAIR)? 1 : 0;
        }

        // directionData = {
        //     left: 1,
        //     right: 1,
        //     top: 1,
        //     down: 1
        // }

        // console.log(
        //     `Character moving from ${coordToGameId(
        //         currentTile.coordinates
        //     )} -> ${coordToGameId(destinationTile.coordinates)}`
        // );

        let path: PathStep[] = [{
            tileId: desTileId
        }];
        let cost = currentTile.id == destinationTile.id? 0 : -1;
        let featherCost = 0;

        if(message.isPath) {
            const route_path = this.room.getPathFinder(message.isFeather).find(
                character.currentTileId,
                desTileId
            );
            path = route_path.path;
            cost = -(route_path.cost - 5 * route_path.featherCount);
            featherCost = -route_path.featherCount;
        }

        console.log("---check find path");


        if (!force && character.stats.energy.current < cost) {
            this.room.notify(
                client,
                "You don't have enough energy to move there!",
                "error"
            );
            return;
        }

        let userFeatherCount = getItemCountFromCharacter(ITEMTYPE.FEATHER, character);

        console.log("feather count: ", userFeatherCount, featherCost);

        if(!force && (featherCost != 0 && userFeatherCount < featherCost)) 
        {
            this.room.notify(
                client,
                "You don't have enough feather to move there!",
                "error"
            );
            return;
        }
        console.log("---check path");

        for(let i = 0; i < path.length; i++){
            const p = path[i];
            const idx = this.room.state.map.moveItemEntities.findIndex(
                mItem => mItem.tileId == p.tileId && 
                (mItem.itemId == ITEMTYPE.BOMB || mItem.itemId == ITEMTYPE.ICE_BOMB 
                    || mItem.itemId == ITEMTYPE.FIRE_BOMB || mItem.itemId == ITEMTYPE.VOID_BOMB || mItem.itemId == ITEMTYPE.CALTROP_BOMB));
            
            if(idx != -1) {
                const moveEntity: MoveItemEntity = this.room.state.map.moveItemEntities[idx];
                const enemy = getCharacterById(this.room, moveEntity.playerId);
                const result = itemResults[moveEntity.itemId];
                if(!!result.energy) {
                    setCharacterEnergy(character, result.energy, this.room, client);
                    
                    client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                        characterId: character.id,
                        score: result.energy,
                        type: "energy"
                    });
                    this.room.sendBroadcastStats(result.energy, ADD_EXTRA_TYPE.ENERGY_ENEMY, client, character.id);
                }
                if(!!result.heart) {
                    setCharacterHealth(character, result.heart, this.room, client, "heart", enemy);
                    client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                        characterId: character.id,
                        score: result.heart,
                        type: "heart"
                    });
                    this.room.sendBroadcastStats(result.heart, ADD_EXTRA_TYPE.HEART_ENEMY, client, character.id);

                    if(character.stats.health.current <= 0) {
                        this.room.RewardFromMonster(enemy, character, client);
                    }
                }
                if(!!result.ultimate) {
                    character.stats.ultimate.add(result.ultimate);
                    this.room.sendBroadcastStats(result.ultimate, ADD_EXTRA_TYPE.ULTIMATE_ENEMY, client, character.id);
                    client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                        characterId: character.id,
                        score: result.ultimate,
                        type: "ultimate"
                    });
                }
    
                if(!!result.stackId) {
                    addStackToCharacter(result.stackId, 1, character, client);
    
                    this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                        characterId: character.id,
                        score: 1,
                        type: "stack",
                        stackId: result.stackId
                    });
                }
    
                this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.GET_BOMB_DAMAGE, {
                    playerId: moveEntity.playerId,
                    itemResult: result,
                    itemId: moveEntity.itemId
                });
                this.room.state.map.moveItemEntities.deleteAt(idx);
                path = path.slice(0, i + 1);
            }
        }

        let energy = cost;
        if(force) {
            const originEnergy = message.originEnergy;
            energy = originEnergy - character.stats.energy.current;

            setCharacterEnergy(character, energy, this.room, client);
        } else {
            cost = cost - featherStep * featherCost;
            setCharacterEnergy(character, cost, this.room, client);
            addItemToCharacter(ITEMTYPE.FEATHER, featherCost, character);
        }
        if(energy != 0) {
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                characterId: character.id,
                score: energy,
                type: "energy"
            });
        }

        // if(desTileId != message.tileId) {
        //     path.push({
        //         tileId: message.tileId
        //     });
        // }

        console.log("---send find path");

        if(path.length > 0) {
            // Tiles walked (the path starts on the current tile). Feeds the traveled_tile stat, which nothing used to
            // update, and THE ROAD LESS TRAVELED quest.
            const steps = message.isPath ? Math.max(0, path.length - 1) : (path[path.length - 1].tileId !== currentTile.id ? 1 : 0);
            if (steps > 0 && character.type == USER_TYPE.USER) {
                AddUserData(USER_DATA_TYPE.TRAVELED_TILE, character, steps);
                setQuestResult(QUESTTYPE.TRAVELER, steps, character);
                // Easter Egg heatmap. path[0] is the tile they were already standing on, so it is
                // skipped or every move would count its origin twice. Bridges and stairs are
                // crossings rather than places to stand, and void cannot be stood on at all — the
                // same exclusions the rest of the game uses. Counted in memory; MatchStats writes
                // the totals once the match closes, so nothing here touches the database.
                const stood: string[] = [];
                for (let i = 1; i < path.length; i++) {
                    const t = this.state.map.tiles.get(path[i].tileId);
                    if (t && t.type != "Void" && !/Bridge|Stairs/.test(t.type)) stood.push(t.id);
                }
                this.room.matchStats?.stepped(stood);
            }
            const lastTile = this.state.map.tiles.get(path[path.length - 1].tileId);
            character.coordinates.x = lastTile.coordinates.x;
            character.coordinates.y = lastTile.coordinates.y;
            character.currentTileId = path[path.length - 1].tileId;
        }

        // character.coordinates.x = destinationTile.coordinates.x;
        // character.coordinates.y = destinationTile.coordinates.y;
        // character.currentTileId = message.tileId;

        fillPathWithCoords(path, this.room.state.map);

        const characterMovedMessage: CharacterMovedMessage = {
            characterId: character.id,
            path,
            left: directionData.left,
            right: directionData.right,
            top: directionData.top,
            down: directionData.down,
        };



        // console.log(
        //     `Sending playerMoved message ${JSON.stringify(
        //         characterMovedMessage,
        //         null,
        //         2
        //     )}`
        // );

        // Normal difficulty: whoever just moved may have walked into (or out of) a monster's line of sight, so the
        // "!" and "?" markers change on the mover's own turn, not at the next turn change (monster-ai.ts).
        refreshAwareness(this.room);

        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.CHARACTER_MOVED, characterMovedMessage);

        // Landed on a portal: it takes you. The exit is worked out now rather than when the move was planned,
        // because somebody else may have stepped into it in the meantime; if it has closed up, the hero simply
        // stays on the portal.
        if (portalHere && character.type == USER_TYPE.USER && character.currentTileId == desTileId) {
            const exitId = getPortalPosition(portalHere, this.room, character.currentTileId);
            const exitTile = exitId ? this.state.map.tiles.get(exitId) : undefined;
            if (exitTile) {
                character.currentTileId = exitTile.id;
                character.coordinates.x = exitTile.coordinates.x;
                character.coordinates.y = exitTile.coordinates.y;
                refreshAwareness(this.room);   // coming out somewhere else changes who can see you
                this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.PORTAL_USED, {
                    characterId: character.id,
                    fromTileId: desTileId,
                    toTileId: exitTile.id,
                });
            } else {
                this.room.notify(client, "The portal exit is blocked — there is nowhere to come out.", "error");
            }
        }

        if (character.stats.energy.current == 0) {
            this.room.notify(client, "You are too tired to continue.");
            //this.room.incrementTurn();
        }
    }
}
