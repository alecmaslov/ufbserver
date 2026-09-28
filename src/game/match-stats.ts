/**
 * Match statistics for balancing: one MatchRecord per room, one MatchPlayer per hero.
 *
 * Read by the admin (routes/admin.ts → "Game stats"). Nothing here may disturb a game: every write
 * is fire-and-forget with its error logged, and nothing in the room waits on it.
 *
 * The per-hero counters (damage, tiles, energy…) are the ones CharacterStatsState already keeps for
 * the match; this module adds what those don't — which moves were used, what killed a hero, where
 * they placed — and copies everything to the database when the hero's match ends.
 */
import db from "#db";
import type { CharacterState } from "#game/schema/CharacterState";

type Room = {
    roomId: string;
    solo: unknown;
    state: { turn: number; map?: { name?: string }; characters: Map<string, CharacterState> | any };
    Rounds(): number;
    MatchMode(): string;
};

const log = (what: string) => (e: unknown) => console.error(`match-stats ${what}`, e);
const LANG = /^(en|ja|es|fr|de|ru|zh|ko|ar|pt)$/;

export class MatchStats {
    private id: Promise<string | null> | null = null;
    private moves = new Map<string, Record<string, number>>();
    private killers = new Map<string, string>();
    private diedTurn = new Map<string, number>();
    private finished = new Set<string>();
    /** Turns each hero actually took. It used to record the room's round count, which made every
     *  per-turn figure in a report about 4x too big in a solo game (one hero, three monsters). */
    private turns = new Map<string, number>();
    private joined = new Set<string>();
    private closed = false;
    /** Each hero's writes run in order: a finish must not overtake the insert of its own row. */
    private chain = new Map<string, Promise<unknown>>();

    private then(heroId: string, write: (matchId: string) => Promise<unknown>, what: string) {
        const next = (this.chain.get(heroId) ?? Promise.resolve())
            .then(() => this.record())
            .then((matchId) => matchId && write(matchId))
            .catch(log(what));
        this.chain.set(heroId, next);
        return next;
    }

    constructor(private room: Room, private mapName: string) {}

    /** A hero's turn began. Called from UfbRoom.incrementTurn, which is the only place a turn changes. */
    tookTurn(heroId: string) {
        if (!heroId) return;
        this.turns.set(heroId, (this.turns.get(heroId) ?? 0) + 1);
    }

    /** The record is created with the first hero, so rooms nobody joins leave no trace. */
    private record(): Promise<string | null> {
        this.id ??= db.matchRecord.create({
            data: { roomId: this.room.roomId, mode: this.room.MatchMode(), mapName: this.mapName },
            select: { id: true },
        }).then((r) => r.id, (e) => { log("create")(e); return null; });
        return this.id;
    }

    join(hero: CharacterState, opts: { lang?: string; level?: number }) {
        if (this.joined.has(hero.id)) return;
        this.joined.add(hero.id);
        const lang = typeof opts.lang === "string" && LANG.test(opts.lang) ? opts.lang : null;
        this.then(hero.id, (matchId) => db.matchPlayer.upsert({
            where: { matchId_playerId: { matchId, playerId: hero.id } },
            create: {
                matchId, playerId: hero.id, isGuest: hero.id.startsWith("web-"),
                heroClass: hero.characterClass, heroLevel: opts.level ?? 1, lang,
            },
            update: {},
        }), "join");
    }

    /** A move was paid for and fired. */
    move(heroId: string, name: string) {
        const m = this.moves.get(heroId) ?? {};
        m[name] = (m[name] ?? 0) + 1;
        this.moves.set(heroId, m);
    }

    /** A hero went down: remember by what, before the payout (finish) runs. */
    died(hero: CharacterState, killer: CharacterState | null | undefined) {
        this.killers.set(hero.id, killer ? (killer.id === hero.id ? "self" : killer.characterClass) : "hazard");
        this.diedTurn.set(hero.id, this.room.state.turn);
    }

    /** The hero's match is over (won, or died) — called once, from UfbRoom.BankGoldAt. */
    finish(hero: CharacterState, place: number, summary: { total?: number; playerKills?: number; monsterKills?: number }) {
        if (this.finished.has(hero.id)) return;
        this.finished.add(hero.id);
        const s = hero.stats;
        const died = s.health.current <= 0;
        const data = {
            place,
            result: place === 1 && !died ? "win" : "died",
            diedTurn: this.diedTurn.get(hero.id) ?? null,
            killedBy: died ? this.killers.get(hero.id) ?? null : null,
            damageDealt: s.damage_deal, damageTaken: s.damage_taken, healed: s.damage_heal,
            tilesMoved: s.traveled_tile, energyUsed: s.used_energy, stacksUsed: s.used_stack,
            playerKills: summary.playerKills ?? 0, monsterKills: summary.monsterKills ?? 0,
            goldEarned: summary.total ?? 0,
            turnsPlayed: this.turns.get(hero.id) ?? 0,
            moves: this.moves.get(hero.id) ?? {},
            equipped: (hero.equipSlots ?? []).map((p: any) => p?.name).filter(Boolean),
            endedAt: new Date(),
        };
        this.then(hero.id, (matchId) => db.matchPlayer.updateMany({ where: { matchId, playerId: hero.id }, data }), "finish");
    }

    /** The room is going away. Heroes that never finished are "quit" (left) or "unfinished". */
    close(reason: "victory" | "defeat" | "abandoned") {
        if (this.closed || this.joined.size === 0) return;   // nobody joined: no record to close
        this.closed = true;
        const humans = [...this.joined];
        const open = humans.filter((id) => !this.finished.has(id));
        Promise.all(this.chain.values()).then(() => this.record()).then(async (matchId) => {
            if (!matchId) return;
            await db.matchRecord.update({
                where: { id: matchId },
                data: { endedAt: new Date(), endReason: reason, turns: this.room.state.turn, rounds: this.room.Rounds(), humans: humans.length },
            });
            for (const id of open) {
                const hero = this.room.state.characters.get(id) as CharacterState | undefined;
                const s = hero?.stats;
                await db.matchPlayer.updateMany({
                    where: { matchId, playerId: id },
                    data: {
                        result: hero && !hero.connected ? "quit" : "unfinished", endedAt: new Date(),
                        ...(s ? {
                            damageDealt: s.damage_deal, damageTaken: s.damage_taken, healed: s.damage_heal,
                            tilesMoved: s.traveled_tile, energyUsed: s.used_energy, stacksUsed: s.used_stack,
                        } : {}),
                        turnsPlayed: this.turns.get(hero.id) ?? 0,
                        moves: this.moves.get(id) ?? {},
                    },
                });
            }
        }).catch(log("close"));
    }
}
