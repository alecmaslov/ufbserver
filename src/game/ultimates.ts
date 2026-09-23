import { Client } from "@colyseus/core";
import { UfbRoom } from "#game/UfbRoom";
import { CharacterState } from "#game/schema/CharacterState";
import { TileState } from "#game/schema/MapState";
import { DICE_TYPE, STACKTYPE, USER_TYPE } from "#assets/resources";
import { SERVER_TO_CLIENT_MESSAGE } from "#assets/serverMessages";
import { addStackToCharacter, getDiceCount, setCharacterHealth } from "#game/helpers/map-helpers";
import { getCharacterById } from "#game/helpers/room-helpers";

/*
 * Hero ultimates. A hero can fire theirs on their own turn once the gauge is full (ultimate >= ultimate.max; the
 * max can vary per hero level / skill tree, so never assume 100). Firing empties the gauge and costs no energy.
 *
 *   Kirin — Meteor:            pick a tile within 5 (walls ignored); everyone in the 3×3 blast except Kirin takes
 *                              1d6 and 1 Burn stack.
 *   Data Avenger — Invisibility: until the end of her next turn she can't be targeted, walks through enemies and
 *                              gets +5 energy; her next attack deals double damage and breaks the invisibility.
 *   Mevisto — Myth Drill:      charge up to 6 tiles in a straight line through walls and levels; everyone passed takes
 *                              1d6 and is pushed aside; he stops on the farthest open tile.
 *   Ophaia — Divine Venom:     everyone within 2 takes 1d4 and 1 Void stack; she heals 1 HP per point dealt.
 *
 * One die is rolled per use and applied to every target, so the table sees a single roll.
 * State that has to survive a solo save lives in the CharacterState schema (invisible, ambush).
 */

export type UltimateKind = "meteor" | "invisibility" | "drill" | "venom";
export const ULTIMATE_OF: Record<string, { kind: UltimateKind; name: string }> = {
    kirin: { kind: "meteor", name: "Meteor" },
    data: { kind: "invisibility", name: "Invisibility" },
    "data-avenger": { kind: "invisibility", name: "Invisibility" },
    mevisto: { kind: "drill", name: "Myth Drill" },
    ophaia: { kind: "venom", name: "Divine Venom" },
};
export const METEOR_RANGE = 5, DRILL_LENGTH = 6, VENOM_RADIUS = 2, INVISIBLE_ENERGY = 5;

/** Gauge full? Shared with anything that keys off a full gauge (e.g. skill-tree bonuses). */
export function isUltimateReady(c: CharacterState): boolean {
    const u = c.stats.ultimate;
    return u.max > 0 && u.current >= u.max;
}
export const isInvisible = (c: CharacterState | null | undefined) => !!c && c.invisible > 0;

const DIRS: Record<string, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

interface UltimateMessage { characterId: string; tileId?: string; direction?: "N" | "E" | "S" | "W" }
interface Hit { id: string; damage: number; killed: boolean }

export function useUltimate(room: UfbRoom, client: Client, message: UltimateMessage) {
    const caster = getCharacterById(room, message.characterId);
    const fail = (why: string) => { room.notify(client, why, "error"); };
    if (!caster) return fail("You are not in this game.");
    if (caster.type !== USER_TYPE.USER) return;
    if (room.state.currentCharacterId !== caster.id) return fail("You can only use your ultimate on your turn.");
    if (caster.stats.health.current <= 0) return;
    const spec = ULTIMATE_OF[caster.characterClass];
    if (!spec) return fail("This hero has no ultimate yet.");
    if (!isUltimateReady(caster)) return fail("Your ultimate gauge isn't full yet.");

    const tiles = room.state.map.tiles;
    const byXY = new Map<string, TileState>(); tiles.forEach((t) => byXY.set(`${t.coordinates.x},${t.coordinates.y}`, t));
    const at = (x: number, y: number) => byXY.get(`${x},${y}`);
    const here = tiles.get(caster.currentTileId);
    if (!here) return;
    const standable = (t?: TileState) => !!t && (t.type === "Upper" || t.type === "Lower");
    const occupant = (t: TileState, except?: string) => {
        let who: CharacterState | undefined;
        room.state.characters.forEach((c) => { if (c.id !== except && c.stats.health.current > 0 && c.currentTileId === t.id) who = c; });
        return who;
    };
    const living = (pred: (c: CharacterState) => boolean) => {
        const out: CharacterState[] = [];
        room.state.characters.forEach((c) => { if (c.id !== caster.id && c.stats.health.current > 0 && c.coordinates.x >= 0 && pred(c)) out.push(c); });
        return out;
    };

    const hits: Hit[] = [];
    const damage = (target: CharacterState, amount: number) => {
        setCharacterHealth(target, -amount, room, client, "heart", caster);
        const killed = target.stats.health.current <= 0;
        if (killed && target.type === USER_TYPE.MONSTER) room.RewardFromMonster(caster, target, client);
        hits.push({ id: target.id, damage: amount, killed });
    };
    const payload: any = { characterId: caster.id, kind: spec.kind, name: spec.name };

    if (spec.kind === "meteor") {
        const target = message.tileId ? tiles.get(message.tileId) : undefined;
        if (!target) return fail("Pick a tile for the meteor.");
        const d = Math.abs(target.coordinates.x - here.coordinates.x) + Math.abs(target.coordinates.y - here.coordinates.y);
        if (d > METEOR_RANGE) return fail(`The meteor only reaches ${METEOR_RANGE} tiles.`);
        const roll = getDiceCount(Math.random(), DICE_TYPE.DICE_6);
        const area: string[] = [];
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const t = at(target.coordinates.x + dx, target.coordinates.y + dy); if (t) area.push(t.id); }
        spend(caster);
        living((c) => area.includes(c.currentTileId)).forEach((c) => {
            damage(c, roll);
            if (c.stats.health.current > 0) addStackToCharacter(STACKTYPE.Burn, 1, c, client, room);
        });
        Object.assign(payload, { roll, dice: DICE_TYPE.DICE_6, tileId: target.id, area });
    }

    else if (spec.kind === "invisibility") {
        spend(caster);
        caster.invisible = 2;          // this turn's end → 1, the end of her next turn → 0
        caster.ambush = true;
        caster.stats.energy.current += INVISIBLE_ENERGY;   // may go over max for this turn; reset at her next turn
        Object.assign(payload, { energy: INVISIBLE_ENERGY });
    }

    else if (spec.kind === "drill") {
        const dir = message.direction && DIRS[message.direction];
        if (!dir) return fail("Pick a direction to drill.");
        const line: TileState[] = [];
        for (let i = 1; i <= DRILL_LENGTH; i++) { const t = at(here.coordinates.x + dir[0] * i, here.coordinates.y + dir[1] * i); if (!t) break; line.push(t); }
        if (!line.length) return fail("There's nothing to drill into that way.");
        let landing: TileState | undefined;
        for (let i = line.length - 1; i >= 0; i--) if (standable(line[i]) && !occupant(line[i], caster.id)) { landing = line[i]; break; }
        const passed = landing ? line.slice(0, line.indexOf(landing) + 1) : line;
        const roll = getDiceCount(Math.random(), DICE_TYPE.DICE_6);
        spend(caster);
        const pushes: { id: string; tileId: string }[] = [];
        const side: [number, number][] = [[dir[1], dir[0]], [-dir[1], -dir[0]]];   // perpendicular squares
        living((c) => passed.some((t) => t.id === c.currentTileId)).forEach((c) => {
            damage(c, roll);
            if (c.stats.health.current <= 0) return;
            const from = tiles.get(c.currentTileId)!;
            for (const [sx, sy] of side) {
                const t = at(from.coordinates.x + sx, from.coordinates.y + sy);
                if (standable(t) && !occupant(t!) && t!.id !== landing?.id) {
                    c.coordinates.x = t!.coordinates.x; c.coordinates.y = t!.coordinates.y; c.currentTileId = t!.id;
                    pushes.push({ id: c.id, tileId: t!.id }); break;
                }
            }
        });
        const path = [here, ...passed.slice(0, landing ? passed.length : 0)].map((t) => ({ tileId: t.id }));
        if (landing) { caster.coordinates.x = landing.coordinates.x; caster.coordinates.y = landing.coordinates.y; caster.currentTileId = landing.id; }
        Object.assign(payload, { roll, dice: DICE_TYPE.DICE_6, direction: message.direction, line: line.map((t) => t.id), path, landing: landing?.id ?? null, pushes });
        pushes.forEach((p) => room.broadcast(SERVER_TO_CLIENT_MESSAGE.SET_CHARACTER_POSITION, { characterId: p.id, path: [{ tileId: p.tileId }] }));
    }

    else if (spec.kind === "venom") {
        const roll = getDiceCount(Math.random(), DICE_TYPE.DICE_4);
        const targets = living((c) => Math.abs(c.coordinates.x - here.coordinates.x) + Math.abs(c.coordinates.y - here.coordinates.y) <= VENOM_RADIUS);
        spend(caster);
        let dealt = 0;
        targets.forEach((c) => {
            const before = c.stats.health.current;
            damage(c, roll);
            dealt += Math.min(roll, before);
            if (c.stats.health.current > 0) addStackToCharacter(STACKTYPE.Void, 1, c, client, room);
        });
        const healed = Math.min(dealt, caster.stats.health.max - caster.stats.health.current);   // report what actually landed
        if (healed > 0) setCharacterHealth(caster, healed, room, client, "heart", null);
        const area: string[] = [];
        tiles.forEach((t) => { if (Math.abs(t.coordinates.x - here.coordinates.x) + Math.abs(t.coordinates.y - here.coordinates.y) <= VENOM_RADIUS) area.push(t.id); });
        Object.assign(payload, { roll, dice: DICE_TYPE.DICE_4, area, heal: healed });
    }

    payload.hits = hits;
    room.broadcast(SERVER_TO_CLIENT_MESSAGE.ULTIMATE_USED, payload);
}

function spend(c: CharacterState) { c.stats.ultimate.current = c.stats.ultimate.min ?? 0; }

/** Turn hand-off: count down the invisibility of whoever just finished their turn. */
export function tickInvisibility(finished: CharacterState | undefined) {
    if (!finished || finished.invisible <= 0) return;
    finished.invisible -= 1;
    if (finished.invisible <= 0) { finished.invisible = 0; finished.ambush = false; }
}

/** Her attack from hiding lands: the ambush is spent and she's visible again. */
export function breakAmbush(attacker: CharacterState | undefined) {
    if (!attacker || !attacker.ambush) return;
    attacker.ambush = false; attacker.invisible = 0;
}
