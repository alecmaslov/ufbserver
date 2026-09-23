import { Client } from "@colyseus/core";
import { UfbRoom } from "#game/UfbRoom";
import { CharacterState } from "#game/schema/CharacterState";
import { ADD_EXTRA_TYPE, QUESTTYPE, STACKTYPE } from "#assets/resources";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { setCharacterEnergy, setCharacterHealth, setQuestResult } from "#game/helpers/map-helpers";

type Dice = { type: number; diceCount: number }[];

/**
 * Resolve one turn-start stack roll (Cure, Burn, Void, Freeze, Slow, Pump, Charge) on a character, with the dice the
 * server rolled in GET_STACK_ON_TURN_START. Shared by players (SET_STACK_ON_START) and monsters (UfbRoom.aiChecking),
 * which used to roll their stacks but never apply them. The caller consumes the stack. `client` is the player's
 * connection, or null for a monster (every effect is then broadcast).
 */
export function applyTurnStartStack(room: UfbRoom, character: CharacterState, stackId: number, diceData: Dice, client: Client | null) {
    const d0 = diceData[0]?.diceCount ?? 0, d1 = diceData[1]?.diceCount ?? 0;
    const tell = (score: number, type: string) => { if (client) client.send(SERVER_TO_CLIENT_MESSAGE.ADD_EXTRA_SCORE, { score, type }); };

    if (stackId == STACKTYPE.Cure) {
        // Only the overheal becomes gold.
        const hp = character.stats.health;
        const extra = Math.max(0, hp.current + d0 - hp.max);
        hp.add(d0);
        if (extra > 0) {
            character.stats.coin += extra;
            setQuestResult(QUESTTYPE.GLITTER, extra, character);
        }
        tell(d0, "heart");
        room.sendBroadcastStats(d0, ADD_EXTRA_TYPE.HEART_ENEMY, client);
    } else if (stackId == STACKTYPE.Void) {
        // Drains health (d4) and ultimate (d6)
        setCharacterHealth(character, -d1, room, client, "heart", null);
        character.stats.ultimate.add(-d0);
        tell(-d1, "heart"); tell(-d0, "ultimate");
        room.sendBroadcastStats(-d1, ADD_EXTRA_TYPE.HEART_ENEMY, client);
        room.sendBroadcastStats(-d0, ADD_EXTRA_TYPE.ULTIMATE_ENEMY, client);
    } else if (stackId == STACKTYPE.Burn) {
        setCharacterHealth(character, -d0, room, client, "heart", null);
        tell(-d0, "heart");
        room.sendBroadcastStats(-d0, ADD_EXTRA_TYPE.HEART_ENEMY, client);
    } else if (stackId == STACKTYPE.Freeze) {
        // "roll a dice to subtract from energy" — this used to ADD energy
        setCharacterEnergy(character, -d0, room, client);
        tell(-d0, "energy");
        room.sendBroadcastStats(-d0, ADD_EXTRA_TYPE.ENERGY_ENEMY, client);
    } else if (stackId == STACKTYPE.Charge) {
        // Rules: "Bonus damage on your next attack (rolls a d4)" (it used to drain energy)
        character.chargeBonus = Math.min(127, (character.chargeBonus ?? 0) + d0);
        tell(d0, "stack");
    } else if (stackId == STACKTYPE.Slow) {
        setCharacterEnergy(character, -d1, room, client);
        character.stats.ultimate.add(-d0);
        tell(-d1, "energy"); tell(-d0, "ultimate");
        room.sendBroadcastStats(-d1, ADD_EXTRA_TYPE.ENERGY_ENEMY, client);
        room.sendBroadcastStats(-d0, ADD_EXTRA_TYPE.ULTIMATE_ENEMY, client);
    } else if (stackId == STACKTYPE.Pump) {
        character.stats.ultimate.add(d0);
        tell(d0, "ultimate");
        room.sendBroadcastStats(d0, ADD_EXTRA_TYPE.ULTIMATE_ENEMY, client);
    }
}
