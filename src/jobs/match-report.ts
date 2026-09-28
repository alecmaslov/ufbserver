/**
 * Read-only report on matches that have already been played, for teaching the simulator's bots.
 *
 *   npx tsx src/jobs/match-report.ts                # recent matches, one line each
 *   npx tsx src/jobs/match-report.ts <matchId>      # everything recorded about one match
 *   npx tsx src/jobs/match-report.ts --deep         # the runs that got furthest, in full
 *
 * Every query here is a findMany/findFirst. It writes nothing and prints no credentials.
 *
 * What is actually recorded (schema MatchPlayer): per-hero totals, the move mix, items used and the
 * powers equipped at the end. There is no turn-by-turn replay, so this can show what a player leaned on and
 * how efficiently they played — not the order they did it in or where they stood.
 *
 * Difficulty is not in these rows: the setting only exists from 2026-09-28, so every match recorded before
 * then was played under the always-aware AI, which is what Hard now is.
 */
import db from "#db";

const WAVE_SIZE = 3;   // UfbRoom.WAVES: three monsters per wave, after the three placed by initMap
const arg = process.argv[2];

/** Monsters killed across the party tells you which wave they reached: 3 initial, then 3 per wave. */
const waveReached = (kills: number) => Math.min(3, Math.floor(Math.max(0, kills - WAVE_SIZE) / WAVE_SIZE) + 1);

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((100 * a) / b)}%` : "—");
/** `moves` and `items` are {name: count}; `equipped` is a plain list of names. */
const topOf = (j: unknown, n = 6) => {
    if (Array.isArray(j)) return j.join(", ") || "—";
    const o = (j ?? {}) as Record<string, number>;
    return Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}×${v}`).join(", ") || "—";
};

async function one(matchId: string) {
    const m = await db.matchRecord.findFirst({ where: { id: matchId }, include: { players: true } });
    if (!m) { console.log("no match", matchId); return; }
    const kills = m.players.reduce((n, p) => n + p.monsterKills, 0);
    console.log(`\n=== ${m.id}  ${m.mode}  ${m.mapName}  ${m.startedAt.toISOString().slice(0, 16).replace("T", " ")}`);
    console.log(`    rounds ${m.rounds} · turns ${m.turns} · humans ${m.humans} · ended ${m.endReason ?? "—"}`);
    console.log(`    monsters killed ${kills} → reached wave ${waveReached(kills)}`);
    for (const p of m.players) {
        console.log(`\n  ${p.heroClass}  (${p.isGuest ? "guest" : "account"} ${p.playerId})  ${p.result ?? "—"}${p.place ? ` place ${p.place}` : ""}`);
        // turnsPlayed held the room's round count until 2026-09-28, so rates here are per round, which is exact.
        console.log(`    rounds ${p.turnsPlayed} · died turn ${p.diedTurn ?? "—"}${p.killedBy ? ` to ${p.killedBy}` : ""}`);
        console.log(`    damage dealt ${p.damageDealt} · taken ${p.damageTaken} · healed ${p.healed}`);
        console.log(`    monsters ${p.monsterKills} · players ${p.playerKills} · gold ${p.goldEarned}`);
        console.log(`    energy ${p.energyUsed} · tiles ${p.tilesMoved} (${pct(p.tilesMoved, p.energyUsed)} of energy on moving) · stacks ${p.stacksUsed}`);
        if (m.turns > 0) {
            console.log(`    per round: ${(p.damageDealt / Math.max(1, p.turnsPlayed)).toFixed(0)} damage · ${(p.tilesMoved / Math.max(1, p.turnsPlayed)).toFixed(0)} tiles`);
            console.log(`    energy split: ${pct(p.tilesMoved, p.energyUsed)} moving, ${pct(p.energyUsed - p.tilesMoved, p.energyUsed)} everything else`);
        }
        console.log(`    moves:    ${topOf(p.moves, 10)}`);
        console.log(`    items:    ${topOf(p.items, 10)}`);
        console.log(`    equipped: ${topOf(p.equipped, 10)}`);
    }
}

async function main() {
    const total = await db.matchRecord.count();
    const first = await db.matchRecord.findFirst({ orderBy: { startedAt: "asc" }, select: { startedAt: true } });
    console.log(`${total} matches recorded${first ? `, earliest ${first.startedAt.toISOString().slice(0, 10)}` : ""}`);
    if (!total) { console.log("nothing recorded — match stats only began on 2026-09-26"); return; }

    if (arg && arg !== "--deep") return one(arg);

    const rows = await db.matchRecord.findMany({
        orderBy: { startedAt: "desc" }, take: 40,
        include: { players: { select: { heroClass: true, monsterKills: true, result: true, turnsPlayed: true, isGuest: true, playerId: true } } },
    });
    const scored = rows.map((m) => {
        const kills = m.players.reduce((n, p) => n + p.monsterKills, 0);
        return { m, kills, wave: waveReached(kills) };
    }).sort((a, b) => b.kills - a.kills || b.m.rounds - a.m.rounds);

    console.log("\nfurthest runs first:\n");
    for (const { m, kills, wave } of scored) {
        const who = m.players.map((p) => `${p.heroClass}${p.monsterKills ? `(${p.monsterKills}k)` : ""}`).join(" ");
        console.log(`  wave ${wave}  ${String(kills).padStart(2)} kills  r${String(m.rounds).padStart(2)}  ${m.mode.padEnd(5)} ${m.mapName.padEnd(7)} ${m.startedAt.toISOString().slice(0, 16).replace("T", " ")}  ${m.endReason ?? "—"}  ${who}   ${m.id}`);
    }
    if (arg === "--deep") for (const { m } of scored.slice(0, 3)) await one(m.id);
}

await main();
process.exit(0);
