import { Command } from "@colyseus/command";
import { UfbRoom } from "#game/UfbRoom";
import { isNullOrEmpty } from "#util";
import { Client } from "colyseus";
import { getCharacterById, getClientCharacter } from "#game/helpers/room-helpers";
import { CharacterState, Item } from "#game/schema/CharacterState";
import { DICE_TYPE, EDGE_TYPE, EQUIP_EXTRA_BONUS, ITEMDETAIL, ITEMTYPE, PERKTYPE, POWERTYPE, QUESTTYPE, STACKTYPE, powermoves, powers, stacks } from "#assets/resources";
import { CLIENT_SERVER_MESSAGE, SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { addItemToCharacter, addStackToCharacter, getCharacterIdsInArea, getCountFromItem, getDiceCount, getEquipBonusDamage, getPerkEffectDamage, getPowerMoveFromId, IsEmptyTile, IsEnemyAdjacent, setCharacterEnergy, setCharacterHealth, setQuestResult } from "#game/helpers/map-helpers";
import { PathStep } from "#shared-types";

type OnPowerMoveCommandPayload = {
    client: Client;
    message: any;
};
export class PowerMoveCommand extends Command<UfbRoom, OnPowerMoveCommandPayload> {
    validate({ client, message }: OnPowerMoveCommandPayload) {
        return !isNullOrEmpty(message.powerMoveId);
    }

    execute({ client, message }: OnPowerMoveCommandPayload) {
        const character = getCharacterById(this.room, message.characterId);
        const enemy = getCharacterById(this.room, message.enemyId);

        if (!character) {
            this.room.notify(client, "You are not in room game!", "error");
            return;
        }
        if(!enemy){
            this.room.notify(client, "Enemy are not in room game!", "error");
            return; 
        }

        const powerMoveId = message.powerMoveId;

        let powermove = getPowerMoveFromId(powerMoveId, message.extraItemId);

        let extraDamage = getEquipBonusDamage(powermove.powerImageId, character);

        powermove.result.health = !!powermove.result.health? (powermove.result.health - extraDamage.damage) : -extraDamage.damage;
        powermove.range += extraDamage.range;

        console.log("added: ", powermove);
        let isResult = true;

        if(powermove["coin"] > 0) {
            isResult = character.stats.coin >= powermove.coin;
        }
        if(powermove["light"] > 0 && isResult) {
            isResult = character.stats.energy.current >= powermove.light;
        }
        if(powermove["costList"].length > 0 && isResult) {
            for (let i = powermove.costList.length - 1; i >= 0; i--) {
                const item = powermove.costList[i];
                if (isResult) {
                    if (!(item.id == ITEMTYPE.RandomArrow || item.id == ITEMTYPE.RandomBomb || item.id == ITEMTYPE.RandomArrowOrBomb)) {
                        const idx = character.items.findIndex(ii => ii.id == item.id);
                        if (idx > -1) {
                            isResult = character.items[idx].count >= item.count;
                            if (!isResult) return;
                        } else {
                            isResult = false;
                            return;
                        }
                    } else {
                        // Remove the item from costList
                        powermove.costList.splice(i, 1);
                    }
                }
            }
        }
        if(!!powermove.stackCostList && powermove.stackCostList.length > 0 && isResult){
            powermove.stackCostList.forEach((stack: any) => {
                if(isResult){
                    const idx = character.stacks.findIndex(ii => ii.id == stack.id && ii.count >= stack.count);
                    isResult = idx > -1;
                    if(!isResult) return;
                }
            });
        }

        console.log("------ check logic======", isResult)
        if(!isResult) {
            this.room.notify(
                client,
                "Your item is not enough!",
                "error"
            );
            return;
        }

        // REDUCE COST PART
        Object.keys(powermove).forEach(key => {
            if(key == "range") {

            } else if(key == "light") {
                setCharacterEnergy(character, -powermove.light, this.room, client);
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: -powermove.light,
                    type: "energy",
                });
            } else if(key == "coin") {
                character.stats.coin -= powermove.coin;
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: -powermove.coin,
                    type: "coin",
                });
            } else if(key == "costList") {
                powermove.costList.forEach((item: any) => {

                    if(!(item.id == ITEMTYPE.RandomArrow || item.id == ITEMTYPE.RandomBomb || item.id == ITEMTYPE.RandomArrowOrBomb)) {
                        
                        console.log("delete cost item : ", item.id, item.count);
                        addItemToCharacter(item.id, -item.count, character, client);

                        if(item.id == ITEMTYPE.MELEE) {
                            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                score: -item.count,
                                type: "melee",
                            });
                        } else if(item.id == ITEMTYPE.MANA) {
                            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                score: -item.count,
                                type: "mana",
                            });
                        }
                    }
                });
            } else if(key == "stackCostList"){
                powermove.stackCostList.forEach((stack: any) => {
                    addStackToCharacter(stack.id, -stack.count, character, client, null);
                });
            }
        });

        console.log("------ check cost ppart======")

        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.DEFENCE_ATTACK, {
            pm: powermove,
            originId: character.id,
            targetId: enemy.id
        }, {except: client});


        // ADD RESOULT PART -- IMPORTANT
        let target : CharacterState;
        let from : CharacterState;
        // if(powermove.range == 0) {
        //     target = character;
        //     from = enemy;
        // } else {
            target = enemy;
            from = character;
        // }

        if(target == null) return;

        Object.keys(powermove.result).forEach(key => {
            if(key == "health") {
                setCharacterHealth(target, powermove.result.health, this.room, client, "heart", from);

                // if(target == enemy && target.stats.health.current == 0) {
                //     this.room.RewardFromMonster(character, target, client);
                // }

                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.health,
                    type: target == character? "heart" : "heart_e",
                });
            } else if(key == "energy") {
                target.stats.energy.add(powermove.result.energy);
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.energy,
                    type: target == character? "energy" : "energy_e",
                });
            } else if(key == "coin") {
                target.stats.coin += powermove.result.coin;

                setQuestResult(QUESTTYPE.GLITTER, powermove.result.coin, target);
                

                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.coin,
                    type: "coin",
                });
            } else if(key == "ultimate") {
                target.stats.ultimate.add(powermove.result.ultimate);
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: powermove.result.ultimate,
                    type: target == character? "ultimate" : "ultimate_e",
                });
            } else if((key == "perkId" || key == "perkId1") && target == enemy) {

                if(powermove.result[key] == PERKTYPE.AreaOfEffect) {
                    const enemyIds = getCharacterIdsInArea(character, powermove.range, this.room);
                    enemyIds.forEach(id => {
                        setCharacterHealth(this.room.state.characters.get(id), -1, this.room, client, "heart", from);
                    })

                } else {

                    if(getCountFromItem(STACKTYPE.Steady, enemy.stacks) > 0) {
                        // REMOVE PERK EFFECT BY STEADY STACK
                        console.log("ACTIVE STEADY STACK....", character.id);
                        client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_STACK_PERK_TOAST, {
                            characterId : character.id,
                            stackId : STACKTYPE.Steady,
                            perkId : powermove.result[key],
                            count : getCountFromItem(STACKTYPE.Steady, enemy.stacks),
                        });

                        addStackToCharacter(STACKTYPE.Steady, -1, enemy, client, this.room);

                    } else {
                        const result = getPerkEffectDamage(character, enemy, this.room, powermove.result[key]);
                        console.log("perk: ", result);
                        if(powermove.result[key] != PERKTYPE.Vampire){
                            if(result == null || result.desTileId == "") {
                                setCharacterHealth(target, -1, this.room, client, "heart", from);
                                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                    score: -1,
                                    type: "heart_e",
                                });
                            } else {
                                let isEmptyTile = IsEmptyTile(result.desTileId, this.room);
                                console.log("perk attack wall type....... : ", result.wallType);

                                if(result.wallType == EDGE_TYPE.BASIC) {
            
                                    if(isEmptyTile) {
                                        // CHANGE POSITION
            
                                        target.coordinates.x = result.desCoodinate.x;
                                        target.coordinates.y = result.desCoodinate.y;
                                        target.currentTileId = result.desTileId;
            
                                        const path: PathStep[] = [{
                                            tileId: result.desTileId
                                        }];
                                        console.log("move tile")
                                        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                            characterId : target.id,
                                            path
                                        });
        
                                        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                            characterId : target.id,
                                            perkId: powermove.result[key],
                                            tileId: result.desTileId
                                        });
            
                                    } else {
                                        setCharacterHealth(target, -1, this.room, client, "heart", from);
            
                                        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                            score: -1,
                                            type: "heart_e",
                                        });
                                    }
            
                                } else if(result.wallType == EDGE_TYPE.WALL || result.wallType == EDGE_TYPE.BRIDGE || result.wallType == EDGE_TYPE.NULL || result.wallType == EDGE_TYPE.CLIFF) {
                                    setCharacterHealth(target, -1, this.room, client, "heart", from);
            
                                    // if(target == enemy && target.stats.health.current == 0) {
                                    //     this.room.RewardFromMonster(character, target, client);
                                    // }
    
                                    this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                        score: -1,
                                        type: "heart_e",
                                    });
                                
                                } else if(result.wallType == EDGE_TYPE.STAIR) {

                                    
                                    setCharacterHealth(target, -1, this.room, client, "heart", from);
    
                                    this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                        score: -1,
                                        type: "heart_e",
                                    });

                                } else if(result.wallType == EDGE_TYPE.RAVINE) {
                                    addStackToCharacter(STACKTYPE.Slow, 1, target, client);
            
                                    // CHANGE POSITION
                                    if(isEmptyTile) {
                                        target.coordinates.x = result.desCoodinate.x;
                                        target.coordinates.y = result.desCoodinate.y;
                                        target.currentTileId = result.desTileId;
            
                                        const path: PathStep[] = [{
                                            tileId: result.desTileId
                                        }];
                                        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                            characterId : target.id,
                                            path
                                        });
        
                                        this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                            characterId : target.id,
                                            perkId: powermove.result[key],
                                            tileId: result.desTileId
                                        });
                                    }
            
                                } else if(result.wallType == EDGE_TYPE.CLIFF) {
            
                                    setCharacterHealth(target, -1, this.room, client, "heart", from);
    
                                    this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                        score: -1,
                                        type: "heart_e",
                                    });

                                    // if(target == enemy && target.stats.health.current == 0) {
                                    //     this.room.RewardFromMonster(character, target, client);
                                    // }
    
                                    // CHANGE POSITION
                                    // if(isEmptyTile) {
                                    //     target.coordinates.x = result.desCoodinate.x;
                                    //     target.coordinates.y = result.desCoodinate.y;
                                    //     target.currentTileId = result.desTileId;
            
                                    //     const path: PathStep[] = [{
                                    //         tileId: result.desTileId
                                    //     }];
                                    //     this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, {
                                    //         characterId : target.id,
                                    //         path
                                    //     });
        
                                    //     client.send(SERVER_TO_CLIENT_MESSAGE.RECEIVE_PERK_TOAST, {
                                    //         characterId : target.id,
                                    //         perkId: powermove.result[key],
                                    //         tileId: result.desTileId
                                    //     });
                                    // }
            
                                } else if(result.wallType == EDGE_TYPE.VOID) {
                                    setCharacterHealth(target, -2, this.room, client, "heart", from);
    
                                    // if(target == enemy && target.stats.health.current == 0) {
                                    //     this.room.RewardFromMonster(character, target, client);
                                    // }
                                    addStackToCharacter(STACKTYPE.Void, 1, target, client);
                                    this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                                        score: -2,
                                        type: "heart_e",
                                    });
                                }
                            }
                        }

                    }
                }

            } else if(key == "items") {
                let ctn = 0;
                powermove.result.items.forEach((item : any) => {
                    const id = item.id;

                    if(target == enemy && getCountFromItem(STACKTYPE.Dodge, enemy.stacks) > 0) {

                        addStackToCharacter(STACKTYPE.Dodge, -1, enemy, client, this.room);

                        // DODGE STACK ... remove Item effect
                        client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_STACK_ITEM_TOAST, {
                            characterId : character.id,
                            stack1 : id,
                            stack2 : STACKTYPE.Dodge,
                            count1 : item.count,
                            count2 : getCountFromItem(STACKTYPE.Dodge, enemy.stacks)
                        });

                    } else {
                        addItemToCharacter(item.id, item.count, target);

                    }


                    ctn += item.count;
                    
                    if(id == ITEMTYPE.MELEE) {
                        client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: item.count,
                            type: "melee",
                        });
                    } else if(id == ITEMTYPE.MANA) {
                        client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: item.count,
                            type: "mana",
                        });
                    }
                })
                client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                    score: ctn,
                    type: "item",
                });
            } else if(key == "stacks") {
                let ctn = 0;
                powermove.result.stacks.forEach((stack : any) => {
                    if(target == enemy && getCountFromItem(STACKTYPE.Reflect, enemy.stacks) > stack.count) {
                        addStackToCharacter(STACKTYPE.Reflect, -stack.count, enemy, client);

                        client.send( SERVER_TO_CLIENT_MESSAGE.RECEIVE_BAN_STACK, {
                            characterId : character.id,
                            stack1 : stack.id,
                            stack2 : STACKTYPE.Reflect,
                            count1 : stack.count,
                            count2 : getCountFromItem(STACKTYPE.Reflect, enemy.stacks)
                        });

                    } else {
                        console.log("add charcter stack....", stack.id, stack, target==enemy)

                        addStackToCharacter(stack.id, stack.count, target, client);
                    }
                    ctn += stack.count;
                })
                console.log("use stack....", ctn);
                if(ctn > 0) {
                    client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                        score: ctn,
                        type: "stack",
                    });
                }
            } else if(key == "dice") {
                if(target == enemy) {
                    if(getCountFromItem(STACKTYPE.Block, enemy.stacks) > 0) {
                        addStackToCharacter(STACKTYPE.Block, -1, enemy, client, this.room);
                        
                        client.send(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, {
                            enemyId: enemy.id,
                            characterId: character.id,
                            powerMoveId: message.powerMoveId,
                            stackId: STACKTYPE.Block,
                            diceCount: message.diceCount,
                            enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                        });

                    } else {
                        setCharacterHealth(enemy, -message.diceCount, this.room, client, "heart", from);

                        // if(powerMoveId == 46) { // ICICLE
                        //     tar
                        // }

                        // if(target == enemy && target.stats.health.current == 0) {
                        //     this.room.RewardFromMonster(character, target, client);
                        // }

                        client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                            score: -message.diceCount,
                            type: "heart_e",
                        });

                        if(getCountFromItem(STACKTYPE.Revenge, enemy.stacks) > 0 && IsEnemyAdjacent(character, enemy, this.room)) {

                            client.send(SERVER_TO_CLIENT_MESSAGE.ENEMY_DICE_ROLL, {
                                enemyId: enemy.id,
                                characterId: character.id,
                                powerMoveId: message.powerMoveId,
                                stackId: STACKTYPE.Revenge,
                                diceCount: 0,
                                enemyDiceCount: getDiceCount(Math.random(), DICE_TYPE.DICE_4)
                            });
    
                        }
                    }
                }
            }
        });

        if(message.vampireCount > 0) {
            console.log("vampirecount: ", message.vampireCount);
            setCharacterHealth(character, message.vampireCount, this.room, client, "heart", from);
            
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: message.vampireCount,
                type: "heart",
            });

            setCharacterHealth(target, -message.diceCount, this.room, client, "heart", from);
            client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, {
                score: -message.diceCount,
                type: "heart_e",
            });
        }

        if(target == enemy && target.stats.health.current <= 0) {
            this.room.RewardFromMonster(character, target, client);
        }
      
        console.log("send attack broadcast");

        setTimeout(() => {
            this.room.broadcast(SERVER_TO_CLIENT_MESSAGE.AI_END_ATTACK, {characterId: character.id}, {except: client})
        }, 1500);
    }
}
