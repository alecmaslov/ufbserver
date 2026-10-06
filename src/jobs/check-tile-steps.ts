/**
 * Checks the Easter Egg recording layer: per-map, per-tile step counts.
 *
 *   npx tsx src/jobs/check-tile-steps.ts
 *
 * This one DOES touch the database, unlike check-crystals. It works entirely inside a map name no
 * real game uses and deletes those rows at the end, so it is safe against prod — but it is the
 * reason the job refuses to run if that map name somehow already holds rows.
 *
 * The things worth pinning down:
 *   - counts accumulate in memory and reach the database only when the match closes, because a
 *     round-trip per step would sit on the movement path;
 *   - a second match on the same map ADDS to the totals rather than replacing them (the upsert
 *     increments), which is the whole point of a heatmap that outlives a match;
 *   - closing twice does not double-count;
 *   - the least-trodden lookup the trigger will use actually returns the rare tiles.
 */
import db from "#db";
import { MatchStats } from "#game/match-stats";

let pass = 0, fail = 0;
const say = (s: string) => process.stdout.write(s + "\n");
const check = (label: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    say(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : `   got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
    ok ? pass++ : fail++;
};

const MAP = "__check_tile_steps";

/** The slice of UfbRoom that MatchStats actually reads. Party by default — solo records nothing. */
const fakeRoom = (mode: "solo" | "party" = "party") => ({
    roomId: "check", solo: mode === "solo",
    state: { turn: 0, map: { name: MAP }, characters: new Map() },
    Rounds: () => 0, MatchMode: () => mode,
}) as unknown as ConstructorParameters<typeof MatchStats>[0];

const totals = async () => Object.fromEntries(
    (await db.tileStep.findMany({ where: { mapName: MAP }, orderBy: { tileId: "asc" } })).map((r) => [r.tileId, r.steps]),
);

async function main() {
    const existing = await db.tileStep.count({ where: { mapName: MAP } });
    if (existing) { say(`refusing to run: ${MAP} already has ${existing} rows`); process.exit(1); }

    say("== one match ==");
    const m1 = new MatchStats(fakeRoom(), MAP);
    m1.stepped(["a", "b", "b", "c"]);
    m1.stepped(["b"]);
    check("nothing written before the match closes", await totals(), {});
    m1.close("victory");
    await new Promise((r) => setTimeout(r, 600));   // close() is fire-and-forget by design
    check("counts land once it does", await totals(), { a: 1, b: 3, c: 1 });

    say("\n== closing twice ==");
    m1.close("victory");
    await new Promise((r) => setTimeout(r, 400));
    check("does not double-count", await totals(), { a: 1, b: 3, c: 1 });

    say("\n== a second match on the same map ==");
    const m2 = new MatchStats(fakeRoom(), MAP);
    m2.stepped(["b", "c", "c", "d"]);
    m2.close("defeat");
    await new Promise((r) => setTimeout(r, 600));
    check("adds to the running totals", await totals(), { a: 1, b: 4, c: 3, d: 1 });

    say("\n== the lookup the trigger will use ==");
    const rare = await db.tileStep.findMany({ where: { mapName: MAP }, orderBy: { steps: "asc" }, take: 2 });
    check("least-trodden first", rare.map((r) => r.tileId).sort(), ["a", "d"]);

    say("\n== empty is not a write ==");
    const m3 = new MatchStats(fakeRoom(), MAP);
    m3.close("abandoned");
    await new Promise((r) => setTimeout(r, 300));
    check("a match where nobody moved changes nothing", await totals(), { a: 1, b: 4, c: 3, d: 1 });

    say("\n== solo games are excluded entirely ==");
    const solo = new MatchStats(fakeRoom("solo"), MAP);
    solo.stepped(["a", "a", "a", "e", "e"]);
    solo.close("victory");
    await new Promise((r) => setTimeout(r, 600));
    check("a solo run records nothing at all", await totals(), { a: 1, b: 4, c: 3, d: 1 });
    check("and invents no new tiles", (await totals()).e, undefined);

    const gone = await db.tileStep.deleteMany({ where: { mapName: MAP } });
    say(`\ncleaned up ${gone.count} test rows`);
    say(`\n${MAP}: ${pass} passed, ${fail} failed`);
    await db.$disconnect();
    process.exit(fail ? 1 : 0);
}

main().catch(async (e) => { console.error(e); await db.tileStep.deleteMany({ where: { mapName: MAP } }).catch(() => {}); process.exit(1); });
