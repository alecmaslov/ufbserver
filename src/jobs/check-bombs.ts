/**
 * Checks where a bomb may be planted and where one may be dropped, against a real map:
 *
 *   npx tsx src/jobs/check-bombs.ts
 *
 * No database and no server — it builds the room state the way check-monster-ai does, from
 * data/mapsDeploy, so the levels, walls and cliffs are the ones a real game has.
 *
 * Alec's rules (2026-10-07):
 *   PLANT  adjacent, same level, nothing solid between, and the tile EMPTY — no loot box, loot bag,
 *          portal, merchant, stairs, bridge, void, character or existing bomb. 1 energy.
 *   DROP   adjacent, exactly one level BELOW, and a monster or player standing on it. 1 energy,
 *          and DROP_BONUS more damage for the fall.
 *
 * The case worth having a test for is the drop: a level change records the cliff as a Wall on the
 * LOWER tile's side, and edgeBetween takes the more restrictive side, so an edge test there blocks
 * every drop on the board. The first version of canDropOnto did exactly that and allowed nothing.
 */
import { readFileSync } from "fs";
import { ArraySchema } from "@colyseus/schema";
import { EDGE_TYPE, ITEMTYPE, USER_TYPE, itemResults } from "#assets/resources";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { TileState, SpawnEntity, MoveItemEntity } from "#game/schema/MapState";
import { CharacterState } from "#game/schema/CharacterState";
import { tileLevel, canDropOnto, canMelee, plantable, type LosTile } from "#game/line-of-sight";
import { bombPlacement, bombTargets, plantRefusal, dropRefusal, isBomb, DROP_BONUS } from "#game/bombs";

const MAP = process.argv[2] ?? "kraken";
const EDGE: Record<string, number> = {
    Wall: EDGE_TYPE.WALL, Basic: EDGE_TYPE.BASIC, Bridge: EDGE_TYPE.BRIDGE, Stair: EDGE_TYPE.STAIR,
    null: EDGE_TYPE.NULL, Ravine: EDGE_TYPE.RAVINE, Void: EDGE_TYPE.VOID, Cliff: EDGE_TYPE.CLIFF,
};
const SIDE = { Top: 0, Right: 1, Bottom: 2, Left: 3 } as const;

const raw = JSON.parse(readFileSync(`data/mapsDeploy/${MAP}/map.json`, "utf8"));
const state = new UfbRoomState();
state.map.name = raw.name;
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
const nm = (t: TileState | undefined) => t ? `${String.fromCharCode(65 + t.coordinates.x)}${t.coordinates.y + 1}` : "—";
const room: any = { state };

let pass = 0, fail = 0;
const say = (s: string) => process.stdout.write(s + "\n");
const check = (label: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    say(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : `   got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
    ok ? pass++ : fail++;
};

function put(id: string, type: number, tile: TileState) {
    const c = new CharacterState();
    c.id = id; c.characterId = id; c.displayName = id; c.type = type;
    c.currentTileId = tile.id; c.coordinates.x = tile.coordinates.x; c.coordinates.y = tile.coordinates.y;
    c.stats.health.current = 20; c.stats.health.max = 20;
    c.stats.energy.current = 10; c.stats.energy.max = 10;
    state.characters.set(id, c);
    return c;
}
const moveTo = (c: CharacterState, t: TileState) => { c.currentTileId = t.id; c.coordinates.x = t.coordinates.x; c.coordinates.y = t.coordinates.y; };
const lvl = (t: TileState | undefined) => tileLevel(t as unknown as LosTile);
const neighbours = (t: TileState) => [[0, -1], [1, 0], [0, 1], [-1, 0]]
    .map(([dx, dy]) => at(t.coordinates.x + dx, t.coordinates.y + dy)).filter((x): x is TileState => !!x);

// ---- find the geometry the rules need, on this real map ----
let samePair: [TileState, TileState] | null = null;   // two adjacent, same level, walkable
let dropPair: [TileState, TileState] | null = null;   // upper tile with a lower tile beside it
state.map.tiles.forEach((t) => {
    if (!plantable(t as unknown as LosTile)) return;
    for (const n of neighbours(t)) {
        if (!plantable(n as unknown as LosTile)) continue;
        if (!samePair && canMelee(t as unknown as LosTile, n as unknown as LosTile)) samePair = [t, n];
        if (!dropPair && lvl(t) > lvl(n)) dropPair = [t, n];
    }
});

say(`== ${MAP}: the geometry these rules need exists ==`);
check("found two adjacent tiles on one level", !!samePair, true);
check("found an upper tile with a lower one beside it", !!dropPair, true);
if (!samePair || !dropPair) { say("\ncannot continue without both"); process.exit(1); }
const [pFrom, pTo] = samePair as [TileState, TileState];
const [dFrom, dTo] = dropPair as [TileState, TileState];
say(`  plant: ${nm(pFrom)}(L${lvl(pFrom)}) -> ${nm(pTo)}(L${lvl(pTo)})`);
say(`  drop:  ${nm(dFrom)}(L${lvl(dFrom)}) -> ${nm(dTo)}(L${lvl(dTo)})`);

const hero = put("h1", USER_TYPE.USER, pFrom);

say("\n== plant ==");
check("an empty adjacent tile on your level is fine", plantRefusal(room, hero, pTo), null);
check("and reads as a plant", bombPlacement(room, hero, pTo).mode, "plant");

const bystander = put("h2", USER_TYPE.USER, pTo);
check("not onto someone standing there", !!plantRefusal(room, hero, pTo), true);
check("the refusal points at dropping instead", /drop it from above/i.test(plantRefusal(room, hero, pTo) ?? ""), true);
state.characters.delete("h2");

const chest = new SpawnEntity(); chest.tileId = pTo.id; chest.type = "Chest"; chest.gameId = "chest_x";
state.map.spawnEntities.push(chest);
check("not onto a loot box / bag / portal / merchant", !!plantRefusal(room, hero, pTo), true);
state.map.spawnEntities.pop();

const live = new MoveItemEntity(); live.tileId = pTo.id; live.itemId = ITEMTYPE.BOMB; live.playerId = hero.id;
state.map.moveItemEntities.push(live);
check("not onto an existing bomb (it used to delete it)", !!plantRefusal(room, hero, pTo), true);
state.map.moveItemEntities.pop();

const void_ = (() => { let v: TileState | undefined; state.map.tiles.forEach((t) => { if (!v && t.type === "Void") v = t; }); return v; })();
const bridge = (() => { let b: TileState | undefined; state.map.tiles.forEach((t) => { if (!b && /Bridge/.test(t.type)) b = t; }); return b; })();
const stairs = (() => { let s: TileState | undefined; state.map.tiles.forEach((t) => { if (!s && /Stairs/.test(t.type)) s = t; }); return s; })();
if (void_) check("never onto void", !!plantRefusal(room, hero, void_), true);
if (bridge) check("never onto a bridge", !!plantRefusal(room, hero, bridge), true);
if (stairs) check("never onto stairs", !!plantRefusal(room, hero, stairs), true);
check("never a tile that is not adjacent", !!plantRefusal(room, hero, at(pFrom.coordinates.x + 5, pFrom.coordinates.y)), true);
check("never a different level", !!plantRefusal(room, hero, dTo.id === pTo.id ? dFrom : (lvl(pFrom) !== lvl(dFrom) ? dFrom : dTo)), true);

say("\n== drop ==");
moveTo(hero, dFrom);
check("an empty tile below is not a drop target", !!dropRefusal(room, hero, dTo), true);
check("the refusal says it needs a target", /needs someone/i.test(dropRefusal(room, hero, dTo) ?? ""), true);

const victim = put("m1", USER_TYPE.MONSTER, dTo);
check("a monster one level below, beside you, IS a drop", dropRefusal(room, hero, dTo), null);
check("and reads as a drop, not a plant", bombPlacement(room, hero, dTo).mode, "drop");
// The regression this whole file exists for.
check("canDropOnto allows it despite the cliff edge", canDropOnto(dFrom as unknown as LosTile, dTo as unknown as LosTile), true);
check("and canMelee still refuses it (different levels)", canMelee(dFrom as unknown as LosTile, dTo as unknown as LosTile), false);

moveTo(hero, dTo); moveTo(victim, dFrom);
check("you cannot drop UPWARDS", !!dropRefusal(room, hero, dFrom), true);
state.characters.delete("m1");

moveTo(hero, pFrom);
const level1 = put("m2", USER_TYPE.MONSTER, pTo);
check("a target on your OWN level is not a drop", !!dropRefusal(room, hero, pTo), true);
state.characters.delete("m2");
check("and you cannot drop on yourself", !!dropRefusal(room, hero, pFrom), true);

say("\n== the two sets are disjoint and complete ==");
moveTo(hero, dFrom);
put("m3", USER_TYPE.MONSTER, dTo);
const targets = bombTargets(room, hero);
check("the occupied lower tile is a drop target", targets.drop.includes(dTo.id), true);
check("and is not also a plant target", targets.plant.includes(dTo.id), false);
check("no tile appears in both lists", targets.plant.filter((id) => targets.drop.includes(id)), []);
say(`  (plant: ${targets.plant.map((id) => nm(state.map.tiles.get(id))).join(" ") || "none"} | drop: ${targets.drop.map((id) => nm(state.map.tiles.get(id))).join(" ") || "none"})`);

say("\n== damage ==");
check("DROP_BONUS is 2", DROP_BONUS, 2);
check("a plain bomb does -3 planted", itemResults[ITEMTYPE.BOMB].heart, -3);
check("and -5 dropped", itemResults[ITEMTYPE.BOMB].heart! - DROP_BONUS, -5);
check("every bomb kind is recognised", [ITEMTYPE.BOMB, ITEMTYPE.ICE_BOMB, ITEMTYPE.FIRE_BOMB, ITEMTYPE.VOID_BOMB, ITEMTYPE.CALTROP_BOMB].every(isBomb), true);
check("a potion is not a bomb", isBomb(ITEMTYPE.POTION), false);

say(`\n${MAP}: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
