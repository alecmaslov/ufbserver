/**
 * What a match pays.
 *
 * Pure: no database, no room state, no clock. That matters for two reasons — the economy
 * simulator has to be able to run this a hundred thousand times without a server, and the numbers
 * here are the ones the whole progression curve is tuned against, so they need to be readable in
 * one place rather than scattered through the room.
 *
 * The model (signed off 2026-09-23, see easteregg.fun/levels/ for the player-facing version):
 *
 *     payout = [ (participation + earned) * placeMultiplier + placeBonus ] * modeMultiplier
 *
 * Everyone who plays gets paid. Placement decides how much, and the match type multiplies it.
 * Coming last still pays enough to unlock the first few skill-tree nodes, which is the point —
 * a loss should move you forward, just more slowly than a win.
 */

export type MatchMode = "solo" | "party" | "live";

export interface Finish {
    /** gold the character was carrying when their match ended */
    carried: number;
    /** what the Merchant paid for everything they were holding */
    sale: number;
    playerKills: number;
    monsterKills: number;
    /** 1 is the winner; ties are allowed, so several heroes can share place 1 */
    place: number;
    /** how many heroes the match started with */
    fieldSize: number;
    mode: MatchMode;
    /** rounds the match actually ran, for the anti-quit guard */
    rounds: number;
}

export interface Payout {
    participation: number;
    earned: number;
    placeMultiplier: number;
    placeBonus: number;
    modeMultiplier: number;
    total: number;
}

export const PARTICIPATION = 50;
export const KILL_PLAYER = 40;
export const KILL_MONSTER = 10;

/** A match this short did not really happen; only what was genuinely earned is paid. */
export const MIN_ROUNDS = 3;

export const MODE_MULTIPLIER: Record<MatchMode, number> = { solo: 1, party: 2, live: 4 };

/**
 * The published placement curve, as four points from last place to first.
 *
 * These exact numbers are what the design doc and the player-facing page state for a four-player
 * match, so they are the spec rather than a formula to be re-derived. Note the curve is not a
 * straight line — second place is worth much more than the midpoint between first and last, which
 * is deliberate: finishing near the top should feel meaningfully better than surviving a while.
 */
const CURVE: { at: number; multiplier: number; bonus: number }[] = [
    { at: 0, multiplier: 1.0, bonus: 60 },        // last
    { at: 1 / 3, multiplier: 1.2, bonus: 120 },
    { at: 2 / 3, multiplier: 1.5, bonus: 220 },
    { at: 1, multiplier: 2.0, bonus: 400 },       // first
];

/**
 * Placement terms for finishing `place` of `fieldSize`.
 *
 * Defined on normalised placement rather than a fixed 1st/2nd/3rd/4th table, so first always gets
 * x2.0 and +400 and last always x1.0 and +60 whatever the field size. A two-player match is worth
 * winning exactly as much as a four-player one, which is what stops anyone gaming the lobby size.
 * With four players this reproduces the published table exactly; other field sizes read off the
 * same curve.
 */
export function placeTerms(place: number, fieldSize: number) {
    const field = Math.max(1, Math.floor(fieldSize));
    const p = Math.min(Math.max(1, Math.floor(place)), field);
    const t = field <= 1 ? 1 : (field - p) / (field - 1);      // 1 for the winner, 0 for last

    let lo = CURVE[0];
    let hi = CURVE[CURVE.length - 1];
    for (let i = 0; i < CURVE.length - 1; i++) {
        if (t >= CURVE[i].at && t <= CURVE[i + 1].at) { lo = CURVE[i]; hi = CURVE[i + 1]; break; }
    }
    const span = hi.at - lo.at;
    const k = span === 0 ? 0 : (t - lo.at) / span;
    return {
        multiplier: lo.multiplier + (hi.multiplier - lo.multiplier) * k,
        bonus: Math.round(lo.bonus + (hi.bonus - lo.bonus) * k),
    };
}

export function computePayout(f: Finish): Payout {
    const earned =
        Math.max(0, f.carried) +
        Math.max(0, f.sale) +
        Math.max(0, f.playerKills) * KILL_PLAYER +
        Math.max(0, f.monsterKills) * KILL_MONSTER;

    // A player who quits immediately should not collect the show-up money, so the participation
    // and placement components only apply to a match that actually ran.
    const counted = f.rounds >= MIN_ROUNDS;
    const participation = counted ? PARTICIPATION : 0;
    const terms = counted ? placeTerms(f.place, f.fieldSize) : { multiplier: 1, bonus: 0 };
    const modeMultiplier = MODE_MULTIPLIER[f.mode] ?? 1;

    const total = Math.max(
        0,
        Math.round(((participation + earned) * terms.multiplier + terms.bonus) * modeMultiplier),
    );

    return {
        participation,
        earned,
        placeMultiplier: terms.multiplier,
        placeBonus: terms.bonus,
        modeMultiplier,
        total,
    };
}
