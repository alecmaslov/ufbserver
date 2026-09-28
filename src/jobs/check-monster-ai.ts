/**
 * Checks the Normal-difficulty monster AI (src/game/monster-ai.ts) against a real map, with no
 * database and no server: build a UfbRoomState straight from data/mapsDeploy/<map>/map.json, put a
 * monster and a hero on it, and drive sight, the marker state machine and the routes.
 *
 *   npx tsx src/jobs/check-monster-ai.ts [kraken|kaiju]
 *
 * Two things this has already caught, worth knowing if you extend it: an ArraySchema ignores
 * assignment by index (build the walls as a plain array and push), and the pathfinder treats every
 * character's tile as blocked except the one named by state.currentCharacterId — so a routing
 * question has to say whose turn it is, exactly as UfbRoom.aiChecking does.
 */
import { readFileSync } from "node:fs";
import { ArraySchema } from "@colyseus/schema";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { TileState } from "#game/schema/MapState";
import { CharacterState } from "#game/schema/CharacterState";
import { Pathfinder } from "#game/Pathfinder";
import { EDGE_TYPE, USER_TYPE } from "#assets/resources";
import { edgeBetween, type LosTile } from "#game/line-of-sight";
import { AWARE, beginMonsterTurn, canSpot, patrolTarget, refreshAwareness, routeTo, spot, tileLookup, PATROL_RADIUS, SIGHT_RANGE } from "#game/monster-ai";

const MAP = process.argv[2] ?? "kraken";
const EDGE: Record<string, number> = {
    Wall: EDGE_TYPE.WALL, Basic: EDGE_TYPE.BASIC, Bridge: EDGE_TYPE.BRIDGE, Stair: EDGE_TYPE.STAIR,
    null: EDGE_TYPE.NULL, Ravine: EDGE_TYPE.RAVINE, Void: EDGE_TYPE.VOID, Cliff: EDGE_TYPE.CLIFF,
};
const SIDE = { Top: 0, Right: 1, Bottom: 2, Left: 3 } as const;

// ---- the map, as the room would hold it ----
const raw = JSON.parse(readFileSync(`data/mapsDeploy/${MAP}/map.json`, "utf8"));
const state = new UfbRoomState();
state.map.name = raw.name; state.map.gridWidth = raw.gridWidth; state.map.gridHeight = raw.gridHeight;
const byCoord = new Map<string, TileState>();
for (const t of raw.tiles) {
    const ts = new TileState();
    ts.id = t.id; ts.tileCode = t.id; ts.type = t.type ?? "OpenTile";   // as insert-maps defaults it
    ts.coordinates.x = t.coordinates.x; ts.coordinates.y = t.coordinates.y;
    const w = [0, 0, 0, 0];   // an ArraySchema ignores assignment by index, so build it plain and push
    for (const s of t.sides ?? []) w[SIDE[s.side as keyof typeof SIDE]] = EDGE[s.edgeProperty] ?? 0;
    const walls = new ArraySchema<number>(); walls.push(...w);
    ts.walls = walls;
    state.map.tiles.set(ts.id, ts);
    byCoord.set(`${ts.coordinates.x},${ts.coordinates.y}`, ts);
}
const at = (x: number, y: number) => byCoord.get(`${x},${y}`);
const name = (t: TileState) => `${String.fromCharCode(65 + t.coordinates.x)}${t.coordinates.y + 1}`;
const gap = (a: TileState, b: TileState) => Math.hypot(a.coordinates.x - b.coordinates.x, a.coordinates.y - b.coordinates.y);

/** The slice of UfbRoom that monster-ai touches. */
const room: any = { state, getPathFinder: (f = false) => Pathfinder.fromMapState(state, f) };

function put(id: string, type: number, tile: TileState) {
    const c = new CharacterState();
    c.id = id; c.displayName = id; c.type = type;
    c.currentTileId = tile.id; c.coordinates.x = tile.coordinates.x; c.coordinates.y = tile.coordinates.y;
    c.stats.health.current = 20; c.stats.health.max = 20;
    state.characters.set(id, c);
    return c;
}
const moveTo = (c: CharacterState, t: TileState) => { c.currentTileId = t.id; c.coordinates.x = t.coordinates.x; c.coordinates.y = t.coordinates.y; };
/** Whose turn it is: the pathfinder lets only that character off its own tile. */
const acting = (c: CharacterState) => { state.currentCharacterId = c.id; };

let pass = 0, fail = 0;
const say = (s: string) => process.stdout.write(s + "\n");
const check = (label: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    say(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : `   got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
    ok ? pass++ : fail++;
};
console.log = () => {};   // the pathfinder logs its ban list on every graph build

// ---- an open corridor to measure sight along: same level, no blocking edge anywhere in it ----
const clear = (a: TileState, b: TileState) => edgeBetween(a as unknown as LosTile, b as unknown as LosTile) === EDGE_TYPE.BASIC;
let run: TileState[] = [];
outer: for (let y = 0; y < raw.gridHeight; y++) {
    for (let x = 0; x + SIGHT_RANGE + 1 < raw.gridWidth; x++) {
        const line: TileState[] = [];
        for (let i = 0; i <= SIGHT_RANGE + 1; i++) {
            const t = at(x + i, y);
            if (!t || t.type === "Void" || (i && (t.type !== line[0].type || !clear(line[i - 1], t)))) break;
            line.push(t);
        }
        if (line.length === SIGHT_RANGE + 2) { run = line; break outer; }
    }
}
if (!run.length) { say(`${MAP}: no open ${SIGHT_RANGE + 2}-tile corridor on this map — skipped`); process.exit(0); }
const home = run[0];

say(`\n== ${MAP}: sight along ${name(run[0])}–${name(run[run.length - 1])} ==`);
const m = put("m1", USER_TYPE.MONSTER, home);
m.homeTileId = home.id;
const h = put("h1", USER_TYPE.USER, run[3]);
state.difficulty = "normal";
acting(m);
check(`sees a hero 3 tiles away (${name(run[3])})`, canSpot(m, h, room, tileLookup(room)), true);
moveTo(h, run[SIGHT_RANGE]);
check(`sees one at exactly ${SIGHT_RANGE}`, canSpot(m, h, room, tileLookup(room)), true);
moveTo(h, run[SIGHT_RANGE + 1]);
check(`does not see one at ${SIGHT_RANGE + 1}`, canSpot(m, h, room, tileLookup(room)), false);

// ---- every walled pair on the map: neither side can see the other ----
say("\n== walls block sight ==");
let pairs = 0, leaks = 0;
for (const t of byCoord.values()) {
    for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        const r = at(t.coordinates.x + dx, t.coordinates.y + dy);
        if (!r || t.type !== r.type) continue;
        if (edgeBetween(t as unknown as LosTile, r as unknown as LosTile) !== EDGE_TYPE.WALL) continue;
        pairs++;
        moveTo(m, t); moveTo(h, r);
        if (canSpot(m, h, room, tileLookup(room))) { leaks++; if (leaks === 1) say(`  (first leak: ${name(t)} -> ${name(r)})`); }
    }
}
say(`  (${pairs} walled same-level pairs)`);
check("none of them can see through the wall", leaks, 0);

// ---- the marker: ! -> ? -> give up -> home ----
say("\n== marker: ! then ? then home ==");
// Somewhere the monster cannot possibly see from anywhere along the corridor.
const hideout = [...byCoord.values()].find((t) => t.type !== "Void" && run.every((r) => gap(t, r) > SIGHT_RANGE * 2))!;
moveTo(m, home); m.aware = 0; m.lastSeenTileId = ""; m.searchTurns = 0;
const spotted = run[3];
moveTo(h, spotted);
refreshAwareness(room);
check("hero walks into view -> ALERT (red !)", m.aware, AWARE.ALERT);
check("last seen = the hero's tile", m.lastSeenTileId, spotted.id);

moveTo(h, hideout);
refreshAwareness(room);
check(`hero slips away to ${name(hideout)} -> SEARCHING (yellow ?)`, m.aware, AWARE.SEARCHING);
check("last seen is remembered", m.lastSeenTileId, spotted.id);

acting(m);
let goto = beginMonsterTurn(room, m);
check("its turn: heads for the last-seen tile", goto, spotted.id);
check("still SEARCHING while it looks", m.aware, AWARE.SEARCHING);
check("one search turn spent", m.searchTurns, 1);
const searchRoute = routeTo(room, m, goto);
check("and has a route there", searchRoute[searchRoute.length - 1]?.tileId, spotted.id);
moveTo(m, spotted);   // it walks there and finds nobody

goto = beginMonsterTurn(room, m);
check("next turn, still nobody -> UNAWARE (marker off)", m.aware, AWARE.UNAWARE);
check("and it heads home", goto, home.id);
check("the memory is cleared", m.lastSeenTileId, "");
const homeRoute = routeTo(room, m, goto);
check("with a route home", homeRoute[homeRoute.length - 1]?.tileId, home.id);

// ---- patrol ----
say("\n== idle patrol stays near the spawn zone ==");
moveTo(m, home);
const offered = new Set<string>();
for (let i = 0; i < 60; i++) { const p = patrolTarget(room, m); if (p) offered.add(p); }
const strayed = [...offered].map((id) => state.map.tiles.get(id)!).filter((t) => gap(t, home) > PATROL_RADIUS);
check(`every patrol tile is within ${PATROL_RADIUS} of home`, strayed.length, 0);
check("and there is more than one of them", offered.size > 1, true);
check("it never patrols onto a tile it can't stand on", [...offered].filter((id) => /Void|Bridge|Stairs/.test(state.map.tiles.get(id)!.type)).length, 0);
say(`  (offered: ${[...offered].map((id) => name(state.map.tiles.get(id)!)).sort().join(" ")})`);

// ---- spotted again ----
say("\n== spotted again mid-patrol ==");
moveTo(h, run[2]);
refreshAwareness(room);
check("straight back to ALERT", m.aware, AWARE.ALERT);
goto = beginMonsterTurn(room, m);
check("no walk target: it chases the hero instead", goto, "");
check("search counter reset", m.searchTurns, 0);
check("spot() names that hero", spot(m, room, tileLookup(room))?.id, "h1");

// ---- hard mode ----
say("\n== hard mode is left alone ==");
state.difficulty = "hard";
m.aware = 0; m.lastSeenTileId = "";
moveTo(h, run[2]);
refreshAwareness(room);
check("no marker is ever set", m.aware, 0);
check("and nothing is remembered", m.lastSeenTileId, "");

// ---- invisibility ----
say("\n== an invisible hero is not seen ==");
state.difficulty = "normal";
m.aware = 0;
h.invisible = 2;
refreshAwareness(room);
check("Data Avenger's ultimate hides her", m.aware, 0);
h.invisible = 0;
refreshAwareness(room);
check("and she is seen again when it ends", m.aware, AWARE.ALERT);

say(`\n${MAP}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
