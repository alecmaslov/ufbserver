/**
 * Autopilot for a hero whose player has dropped connection (UfbRoom.checkUserTimer runs it once their turn has waited
 * RECONNECT_GRACE seconds). Deliberately cautious so it never plays the hero's game for them: drink a potion when low,
 * punch an adjacent monster, then end the turn. It never moves, spends gold, uses powers or attacks another player.
 */
import { ITEMTYPE, USER_TYPE } from "#assets/resources";
import { addItemToCharacter, getCountFromItem, IsEnemyAdjacent, setCharacterHealth } from "#game/helpers/map-helpers";
import type { CharacterState } from "#game/schema/CharacterState";
import type { UfbRoom } from "#game/UfbRoom";

/** How long a disconnected hero keeps their seat, and how long their turn waits for them before the autopilot acts. */
export const RECONNECT_GRACE = 30;

const POTION_HEAL = 5;   // itemResults[POTION].heart

/** Play the away hero's turn. Returns how long to wait (ms) before ending the turn, so an attack can finish. */
export function autopilotTurn(room: UfbRoom, hero: CharacterState): number {
    const hp = hero.stats.health;
    if (hp.current > 0 && hp.current <= hp.max * 0.4 && getCountFromItem(ITEMTYPE.POTION, hero.items) > 0) {
        addItemToCharacter(ITEMTYPE.POTION, -1, hero);
        setCharacterHealth(hero, POTION_HEAL, room, null, "heart", null);
    }

    const melee = getCountFromItem(ITEMTYPE.MELEE, hero.items), mana = getCountFromItem(ITEMTYPE.MANA, hero.items);
    if (hero.stats.energy.current > 2 && (melee > 0 || mana > 0)) {
        let target: CharacterState | undefined;
        room.state.characters.forEach((c) => {
            if (!target && c.type == USER_TYPE.MONSTER && c.stats.health.current > 0 && IsEnemyAdjacent(hero, c, room)) target = c;
        });
        if (target) {
            room.AIPunchAttack(hero, target, melee > 0 ? -1 : -100);   // the monsters' punch: roll, damage, defence stacks
            return 7000;
        }
    }
    return 500;
}
