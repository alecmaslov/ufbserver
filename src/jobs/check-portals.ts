/**
 * Checks how portals behave for heroes and for monsters, with no database and no server:
 *
 *   npx tsx src/jobs/check-portals.ts [kraken|kaiju]
 *
 * What should be true: a hero who steps onto a portal comes out beside its pair, and a monster does
 * neither — it does not teleport and it does not stand on a portal, because a monster parked on one
 * would quietly take that portal out of the game.
 */
import { readFileSync } from "node:fs";
import { ArraySchema } from "@colyseus/schema";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { SpawnEntity, TileState } from "#game/schema/MapState";
import { CharacterState } from "#game/schema/CharacterState";
import { Pathfinder } from "#game/Pathfinder";
import { EDGE_TYPE, USER_TYPE } from "#assets/resources";
import { getNextPortalTilePosition, getOpenTilePosition, getPortalPosition } from "#game/helpers/map-helpers";
import { patrolTarget, routeTo, trimPortalEnd } from "#game/monster-ai";

const MAP = process.argv[2] ?? "kraken";
const EDGE: Record<string, number> = {
    Wall: EDGE_TYPE.WALL, Basic: EDGE_TYPE.BASIC, Bridge: EDGE_TYPE.BRIDGE, Stair: EDGE_TYPE.STAIR,
    null: EDGE_TYPE.NULL, Ravine: EDGE_TYPE.RAVINE, Void: EDGE_TYPE.VOID, Cliff: EDGE_TYPE.CLIFF,
};
const SIDE = { Top: 0, Right: 1, Bottom: 2, Left: 3 } as const;

const raw = JSON.parse(readFileSync(`data/mapsDeploy/${MAP}/map.json`, "utf8"));
const state = new UfbRoomState();
state.map.name = raw.name; state.map.gridWidth = raw.gridWidth; state.map.gridHeight = raw.gridHeight;
const byCoord = new Map<string, TileState>();
for (const t of raw.tiles) {
    const ts = new TileState();
    ts.id = t.id; ts.tileCode = t.id; ts.type = t.type ?? "OpenTile";
    ts.coordinates.x = t.coordinates.x; ts.coordinates.y = t.coordinates.y;
    const w = [0, 0, 0, 0];
    for (const s of t.sides ?? []) w[SIDE[s.side as keyof typeof SIDE]] = EDGE[s.edgeProperty] ?? 0;
    const walls = new ArraySchema<number>(); walls.push(...w);
    ts.walls = walls;
    state.map.tiles.set(ts.id, ts);
    byCoord.set(`${ts.coordinates.x},${ts.coordinates.y}`, ts);
}
const at = (x: number, y: number) => byCoord.get(`${x},${y}`);
const name = (t: TileState) => `${String.fromCharCode(65 + t.coordinates.x)}${t.coordinates.y + 1}`;
const room: any = { state, getPathFinder: (f = false) => Pathfinder.fromMapState(state, f), notify: () => {} };

let pass = 0, fail = 0;
const say = (s: string) => process.stdout.write(s + "\n");
const check = (label: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    say(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : `   got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
    ok ? pass++ : fail++;
};
console.log = () => {};

/** A portal pair, placed the way initializeSpawnEntities does: same portalIndex, different portalGroup. */
function portal(tile: TileState, group: number, index: number) {
    const e = new SpawnEntity();
    e.id = `p-${tile.id}`; e.gameId = `portal_${group}`; e.type = "Portal" as any; e.tileId = tile.id;
    e.prefabAddress = "Entities/portal";
    e.parameters = JSON.stringify({ seedId: group, portalGroup: group, portalIndex: index });
    state.map.spawnEntities.push(e);
    return e;
}
function put(id: string, type: number, tile: TileState) {
    const c = new CharacterState();
    c.id = id; c.displayName = id; c.type = type;
    c.currentTileId = tile.id; c.coordinates.x = tile.coordinates.x; c.coordinates.y = tile.coordinates.y;
    c.stats.health.current = 20; c.stats.health.max = 20;
    state.characters.set(id, c);
    return c;
}

// A long clear corridor to put the two portals at either end of, so a route between them exists to test.
const clear = (a: TileState, b: TileState) => {
    const i = a.coordinates.x < b.coordinates.x ? 1 : 3;
    return a.walls[i] === EDGE_TYPE.BASIC;
};
let run: TileState[] = [];
outer: for (let y = 0; y < raw.gridHeight; y++) {
    for (let x = 0; x + 8 < raw.gridWidth; x++) {
        const line: TileState[] = [];
        for (let i = 0; i <= 8; i++) {
            const t = at(x + i, y);
            if (!t || t.type === "Void" || (i && (t.type !== line[0].type || !clear(line[i - 1], t)))) break;
            line.push(t);
        }
        if (line.length === 9) { run = line; break outer; }
    }
}
if (!run.length) { say(`${MAP}: no open corridor — skipped`); process.exit(0); }

const aTile = run[0], bTile = run[8];
const pa = portal(aTile, 0, 0);
const pb = portal(bTile, 1, 0);
say(`\n== ${MAP}: a portal pair at ${name(aTile)} and ${name(bTile)} ==`);

check("each portal knows the other", [getNextPortalTilePosition(pa, room), getNextPortalTilePosition(pb, room)], [bTile.id, aTile.id]);

const exitB = getPortalPosition(pa, room, aTile.id);
const exitA = getPortalPosition(pb, room, bTile.id);
check("stepping into A puts you beside B", !!exitB && exitB !== aTile.id, true);
check("stepping into B puts you beside A", !!exitA && exitA !== bTile.id, true);
check("you never land on the portal itself", [exitA === aTile.id, exitB === bTile.id], [false, false]);
if (exitB) {
    const e = state.map.tiles.get(exitB)!;
    const d = Math.abs(e.coordinates.x - bTile.coordinates.x) + Math.abs(e.coordinates.y - bTile.coordinates.y);
    check("the exit is next to the far portal", d, 1);
    say(`  (A ${name(aTile)} -> ${name(e)}, beside B ${name(bTile)})`);
}

say("\n== a blocked far side refuses the trip ==");
{
    // fill every tile around B with heroes, so there is nowhere to come out
    const around: string[] = [];
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
        const n = at(bTile.coordinates.x + dx, bTile.coordinates.y + dy);
        if (n) { put(`blocker-${n.id}`, USER_TYPE.USER, n); around.push(n.id); }
    }
    check("no exit is offered", getPortalPosition(pa, room, aTile.id), "");
    around.forEach((id) => state.characters.delete(`blocker-${id}`));
}

say("\n== monsters may cross a portal but never stop on one ==");
{
    // A third portal in the middle of the corridor, directly between the monster and its goal.
    const midTile = run[4];
    portal(midTile, 2, 1);
    const portalIds = new Set(state.map.spawnEntities.map((e) => e.tileId));

    const m = put("m1", USER_TYPE.MONSTER, run[1]);
    state.currentCharacterId = m.id;

    const path = routeTo(room, m, run[7].id).map((p) => p.tileId);
    check("it still gets past a portal in the way", path[path.length - 1], run[7].id);
    check("crossing one is allowed", path.includes(midTile.id), true);
    say(`  (route: ${path.map((id) => name(state.map.tiles.get(id)!)).join(" ")})`);

    // told to go to the portal itself (a hero last seen standing on one), it stops beside it
    const onto = routeTo(room, m, midTile.id).map((p) => p.tileId);
    check("it is never routed onto a portal", onto.length > 1 && portalIds.has(onto[onto.length - 1]), false);
    check("and it gets next to it instead", onto.length > 1, true);
    if (onto.length > 1) {
        const e = state.map.tiles.get(onto[onto.length - 1])!;
        check("which is adjacent", Math.abs(e.coordinates.x - midTile.coordinates.x) + Math.abs(e.coordinates.y - midTile.coordinates.y), 1);
    }

    // a walk cut short by energy must not be left ending on one
    const long = routeTo(room, m, run[7].id);
    const cut = long.slice(0, long.findIndex((p) => p.tileId === midTile.id) + 1);
    check("a walk cut short on a portal is trimmed back", trimPortalEnd(cut, portalIds).map((p) => p.tileId).pop() !== midTile.id, true);

    // patrol never offers one either
    m.homeTileId = run[3].id;
    const offered = new Set<string>();
    for (let i = 0; i < 60; i++) { const t = patrolTarget(room, m); if (t) offered.add(t); }
    check("patrol never picks a portal", [...offered].filter((id) => portalIds.has(id)), []);

    state.characters.delete("m1");
    state.currentCharacterId = "";
}

say("\n== heroes are unaffected ==");
{
    const h = put("h1", USER_TYPE.USER, run[1]);
    state.currentCharacterId = h.id;
    const midTile = run[4];
    const r = Pathfinder.fromMapState(state).find(h.currentTileId, midTile.id);
    check("a hero can still walk onto a portal", r.foundPath && r.path[r.path.length - 1].tileId === midTile.id, true);
    state.characters.delete("h1");
    state.currentCharacterId = "";
}

say("\n== the exit tile is a real standing tile ==");
{
    const e = exitB ? state.map.tiles.get(exitB)! : null;
    check("not a bridge, stairs or void", e ? !/Bridge|Stairs|Void/.test(e.type) : false, true);
    check("and the pathfinder knows it as a node", e ? Pathfinder.fromMapState(state).find(run[2].id, e.id).foundPath : false, true);
}

say(`\n${MAP}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
