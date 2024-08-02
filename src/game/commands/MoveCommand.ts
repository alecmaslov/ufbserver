import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { fillPathWithCoords, getTileIdByDirection } from "#game/helpers/map-helpers";
import { CharacterMovedMessage } from "#game/message-types";
import { PathStep } from "#shared-types";
import { EDGE_TYPE, ITEMTYPE, itemResults, stacks } from "#assets/resources";
import { MoveItemEntity } from "#game/schema/MapState";
import { Item } from "#game/schema/CharacterState";

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
        }

        // if (!force && character.id !== this.state.currentCharacterId) {
        //     this.room.notify(client, "It's not your turn!", "error");
        //     return;
        // }

        const currentTile = this.state.map.tiles.get(character.currentTileId);
        const destinationTile = this.room.state.map.tiles.get(message.tileId);

        console.log("des tile", destinationTile.walls);
        console.log("des tile1", destinationTile.walls[0]);
        console.log("des tile2", destinationTile.walls[1]);
        console.log("des tile3", destinationTile.walls[2]);
        console.log("des tile4", destinationTile.walls[3]);
        
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

        // const { path, cost } = this.room.pathfinder.find(
        //     character.currentTileId,
        //     message.tileId
        // );
        const path: PathStep[] = [{
            tileId: message.tileId
        }];

        if (!force && character.stats.energy.current < 1) {
            this.room.notify(
                client,
                "You don't have enough energy to move there!",
                "error"
            );
            return;
        }

        const idx = this.room.state.map.moveItemEntities.findIndex(
            mItem => mItem.tileId == destinationTile.id && 
            (mItem.itemId == ITEMTYPE.BOMB || mItem.itemId == ITEMTYPE.ICE_BOMB || mItem.itemId == ITEMTYPE.FIRE_BOMB || mItem.itemId == ITEMTYPE.VOID_BOMB || mItem.itemId == ITEMTYPE.CALTROP_BOMB))
        if(idx != -1) {
            const moveEntity: MoveItemEntity = this.room.state.map.moveItemEntities[idx];
            const result = itemResults[moveEntity.itemId];
            if(!!result.energy) {
                character.stats.energy.add(result.energy);
                client.send("addExtraScore", {
                    score: result.energy,
                    type: "energy"
                });
            }
            if(!!result.heart) {
                character.stats.health.add(result.heart);
                client.send("addExtraScore", {
                    score: result.heart,
                    type: "heart"
                });
            }
            if(!!result.ultimate) {
                character.stats.ultimate.add(result.ultimate);
                client.send("addExtraScore", {
                    score: result.ultimate,
                    type: "ultimate"
                });
            }

            if(!!result.stackId) {
                const stack = character.stacks.find(stack => stack.id == result.stackId);
                if(stack == null) {
                    const newStack = new Item();
                    newStack.id = result.stackId;
                    newStack.count = 1;
                    newStack.name = stacks[result.stackId].name;
                    newStack.description = stacks[result.stackId].description;
                    newStack.level = stacks[result.stackId].level;
                    newStack.cost = stacks[result.stackId].cost;
                    newStack.sell = stacks[result.stackId].sell;
    
                    character.stacks.push(newStack);
                }
                else 
                {
                    stack.count++;
                }

                client.send("addExtraScore", {
                    score: 1,
                    type: "stack",
                    stackId: result.stackId
                });
            }

            client.send("getBombDamage", {
                playerId: moveEntity.playerId,
                itemResult: result
            });
            this.room.state.map.moveItemEntities.deleteAt(idx);

        } else {
            // const cost = currentTile.id == destinationTile.id? 0 : -(
            //     Math.abs(currentTile.coordinates.x - destinationTile.coordinates.x) + Math.abs(currentTile.coordinates.y - destinationTile.coordinates.y)
            // );
            const cost = currentTile.id == destinationTile.id? 0 : -1;
            let energy = cost;
            if(force) {
                const originEnergy = message.originEnergy;
                energy = originEnergy - character.stats.energy.current;
                character.stats.energy.add(originEnergy - character.stats.energy.current);
            } else {
                character.stats.energy.add(cost);
            }
            if(energy != 0) {
                client.send("addExtraScore", {
                    score: energy,
                    type: "energy"
                });
            }

        }


        character.coordinates.x = destinationTile.coordinates.x;
        character.coordinates.y = destinationTile.coordinates.y;
        character.currentTileId = message.tileId;

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

        this.room.broadcast("characterMoved", characterMovedMessage);

        if (character.stats.energy.current == 0) {
            this.room.notify(client, "You are too tired to continue.");
            //this.room.incrementTurn();
        }
    }
}
