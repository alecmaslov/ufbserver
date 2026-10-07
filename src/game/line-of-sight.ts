/**
 * Who can hit whom: elevation, walls and line of sight.
 *
 * The rules, as the user set them out:
 *
 *   - a melee attack reaches an adjacent tile on the same level only. Not up or down a level, not
 *     through a wall, not across a ravine.
 *   - a ranged weapon may reach one level up or down, but never through a wall, and never from
 *     ground level over an upper-level tile to ground beyond it. Shooting over a cliff edge is fine
 *     (Alec, 2026-09-25: ranged powers should have that advantage).
 *   - in short: you have to be able to see something to target it.
 *
 * All of this reads data the maps already carry, so there is no schema change behind it. A tile's
 * `type` gives its elevation — Upper and the bridges are the high level, Stairs are the ramp
 * between, everything else is ground — and `walls[0..3]` gives the edge on its top, right, bottom
 * and left sides.
 *
 * Pure on purpose: it takes tiles and returns answers, touching no room, no client and no clock,
 * so it can be tested against a real map without standing a game up.
 *
 * The web client carries a copy (easteregg.fun client/src/los.ts) to show where a move can actually hit and to grey
 * out moves that can't land. Change both together.
 */
import { EDGE_TYPE } from "#assets/resources";

export interface Coord { x: number; y: number }
export interface LosTile {
    id: string;
    type: string;
    coordinates: Coord;
    walls: ArrayLike<number>;
}

/** Ground is 0, the upper deck is 1, and a staircase sits between the two. */
export function tileLevel(tile: LosTile | undefined): number {
    if (!tile) return 0;
    const t = tile.type ?? "";
    if (t === "Upper" || t.includes("Bridge")) return 1;
    if (t.startsWith("Stairs")) return 0.5;
    return 0;
}

/** A tile you cannot stand on and cannot see past at ground level. */
export const isVoid = (tile: LosTile | undefined) => !tile || tile.type === "Void";

/** Side index of `a` that faces `b`: 0 top (-y), 1 right (+x), 2 bottom (+y), 3 left (-x). */
export function sideToward(a: Coord, b: Coord): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 1 : 3;
    return dy > 0 ? 2 : 0;
}

const wallOn = (tile: LosTile, side: number): number => {
    const w = tile.walls?.[side];
    if (w === undefined || w === null) return EDGE_TYPE.NULL;
    return w > 127 ? w - 256 : w;   // walls are uint8 in the room state, so "no edge" (-1) arrives as 255
};

/**
 * The edge between two neighbouring tiles.
 *
 * Both tiles describe the side they share, and the map data is not always consistent about it, so
 * take the more restrictive of the two — a wall one side has recorded and the other has not is
 * still a wall.
 */
export function edgeBetween(from: LosTile, to: LosTile): number {
    const a = wallOn(from, sideToward(from.coordinates, to.coordinates));
    const b = wallOn(to, sideToward(to.coordinates, from.coordinates));
    const rank = (e: number) =>
        e === EDGE_TYPE.WALL ? 4 : e === EDGE_TYPE.NULL ? 3 :
        e === EDGE_TYPE.VOID ? 2 : e === EDGE_TYPE.RAVINE ? 1 : 0;
    return rank(a) >= rank(b) ? a : b;
}

/** Edges a body cannot cross: a wall, a ravine, a hole, or nothing at all. */
const BLOCKS_MOVEMENT = new Set([EDGE_TYPE.WALL, EDGE_TYPE.RAVINE, EDGE_TYPE.VOID, EDGE_TYPE.NULL]);

/** Edges sight cannot cross. You can see over a ravine or a hole; you cannot see through a wall. */
const BLOCKS_SIGHT = new Set([EDGE_TYPE.WALL, EDGE_TYPE.NULL]);

const adjacent = (a: Coord, b: Coord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

/**
 * Melee: next to it, level with it, and nothing solid in between.
 *
 * A cliff edge is a level change by definition, so it is excluded by the level test rather than
 * needing its own rule. Bridges count as the upper deck, so fighting along one works.
 */
export function canMelee(from: LosTile | undefined, to: LosTile | undefined): boolean {
    if (!from || !to || from.id === to.id) return false;
    if (!adjacent(from.coordinates, to.coordinates)) return false;
    if (tileLevel(from) !== tileLevel(to)) return false;
    return !BLOCKS_MOVEMENT.has(edgeBetween(from, to));
}

/**
 * Dropping something over the edge onto an adjacent tile below (Alec, 2026-10-07): bombs thrown down
 * a level, which hit harder for the fall.
 *
 * This is `canMelee` with the level test inverted, and it works because of the asymmetry described
 * above: a level change is a cliff face, so the LOWER tile's side of it is marked Wall while the
 * upper side is open. Reaching down over the edge is therefore already legal geometry, and the same
 * `BLOCKS_MOVEMENT` test keeps a real wall between two different levels blocking.
 *
 * Whether anything is standing on `to` is not a question about geometry, so it is checked by the
 * caller (game/bombs.ts) — a drop requires a target, a plant requires an empty tile.
 */
export function canDropOnto(from: LosTile | undefined, to: LosTile | undefined): boolean {
    if (!from || !to || from.id === to.id) return false;
    if (!adjacent(from.coordinates, to.coordinates)) return false;
    if (tileLevel(from) <= tileLevel(to)) return false;   // must be going DOWN
    // No edge test, deliberately, and for the same reason hasLineOfSight skips one across a level
    // change: the cliff face IS the edge here, and the lower tile records it as Wall. edgeBetween
    // takes the more restrictive of the two sides, so testing it would block every drop that exists
    // — which is what the first version of this function did.
    //
    // Known simplification: a parapet recorded on the UPPER tile's own side would not stop a drop.
    // Distinguishing that from the cliff marking needs per-side data the map is not consistent
    // about (see edgeBetween), and shooting over the edge already ignores it.
    return true;
}

/**
 * Tiles something can be left lying on.
 *
 * Bridges and stairs are crossings rather than places — a bomb on a stair has no meaningful
 * position — and void is not a surface at all. The same rule the monster AI uses to pick where it
 * can stand, which is the right instinct: if a hero cannot stand there, a bomb cannot sit there.
 */
export const plantable = (tile: LosTile | undefined): boolean =>
    !!tile && tile.type !== "Void" && !/Bridge|Stairs/.test(tile.type);

/**
 * Every tile a straight line from `a` to `b` passes through, the two ends included.
 *
 * A supercover walk rather than a plain Bresenham: when the line crosses a corner it takes both
 * tiles, so sight cannot slip diagonally between two walls that meet.
 */
export function lineTiles(a: Coord, b: Coord): Coord[] {
    const out: Coord[] = [];
    let x = a.x, y = a.y;
    const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
    const sx = a.x < b.x ? 1 : -1, sy = a.y < b.y ? 1 : -1;
    let err = dx - dy;
    out.push({ x, y });
    let guard = dx + dy + 2;
    while ((x !== b.x || y !== b.y) && guard-- > 0) {
        const e2 = 2 * err;
        if (e2 > -dy && e2 < dx) {          // exactly diagonal: take the corner tiles too
            out.push({ x: x + sx, y });
            out.push({ x, y: y + sy });
            x += sx; y += sy; err += dx - dy;
        } else if (e2 > -dy) {
            x += sx; err -= dy;
        } else {
            y += sy; err += dx;
        }
        out.push({ x, y });
    }
    return out;
}

export type TileAt = (c: Coord) => LosTile | undefined;

/**
 * A coordinate lookup over whatever tile collection the caller has.
 *
 * Built once per question rather than per step: a sight line crosses a couple of dozen tiles, and
 * scanning the whole map for each of them would be the slow way round.
 */
export function tileIndex(tiles: Iterable<LosTile>): TileAt {
    const byCoord = new Map<string, LosTile>();
    for (const t of tiles) byCoord.set(`${t.coordinates.x},${t.coordinates.y}`, t);
    return (c: Coord) => byCoord.get(`${c.x},${c.y}`);
}

/**
 * Can `from` see `to`?
 *
 * Sight fails on three things: a wall standing across the line, a gap where no tile exists, and
 * ground being in the way. That last one is the "not from the ground, over the upper level, to the
 * ground beyond" rule, generalised — any tile on the path standing higher than both ends blocks,
 * because you would be looking through a hill.
 */
export function hasLineOfSight(from: LosTile, to: LosTile, tileAt: TileAt): boolean {
    if (from.id === to.id) return true;
    const path = lineTiles(from.coordinates, to.coordinates);
    const ceiling = Math.max(tileLevel(from), tileLevel(to));

    let prev = from;
    for (const c of path) {
        const tile = tileAt(c);
        if (!tile) return false;                                  // a hole in the map blocks sight
        if (tile.id !== from.id && tile.id !== to.id && tileLevel(tile) > ceiling) return false;
        if (tile.id !== prev.id) {
            if (!adjacent(prev.coordinates, tile.coordinates)) { prev = tile; continue; }
            // A level change is a cliff face, not a wall: the lower tile's side of it is marked Wall (so a push into it
            // hurts), but you can see and shoot over the edge — the upper deck's advantage. Only walls between two
            // tiles on the same level block sight; looking through higher ground is the ceiling test above.
            if (tileLevel(prev) === tileLevel(tile) && BLOCKS_SIGHT.has(edgeBetween(prev, tile))) return false;
            prev = tile;
        }
    }
    return true;
}

/**
 * Ranged: within one level, and in sight.
 *
 * Range itself is the weapon's business and is checked by the caller; this answers only whether
 * the shot is geometrically possible.
 */
export function canShoot(from: LosTile | undefined, to: LosTile | undefined, tileAt: TileAt): boolean {
    if (!from || !to) return false;
    if (from.id === to.id) return false;
    if (Math.abs(tileLevel(from) - tileLevel(to)) > 1) return false;
    return hasLineOfSight(from, to, tileAt);
}

/** Why a shot was refused, for a message worth reading. */
export function refusalReason(from: LosTile, to: LosTile, tileAt: TileAt, melee: boolean): string | null {
    if (melee) {
        if (!adjacent(from.coordinates, to.coordinates)) return "Too far for a melee attack.";
        if (tileLevel(from) !== tileLevel(to)) return "You can't swing up or down a level.";
        const edge = edgeBetween(from, to);
        if (edge === EDGE_TYPE.WALL) return "There's a wall in the way.";
        if (edge === EDGE_TYPE.RAVINE) return "You can't reach across a ravine.";
        if (BLOCKS_MOVEMENT.has(edge)) return "You can't reach that from here.";
        return null;
    }
    if (Math.abs(tileLevel(from) - tileLevel(to)) > 1) return "That's too far above or below you.";
    if (!hasLineOfSight(from, to, tileAt)) return "You don't have a clear line to that target.";
    return null;
}
