/**
 * What a monster knows — Normal mode's half of the difficulty setting.
 *
 * Hard mode is the game as it has always played: every monster knows where every hero is and walks
 * straight at them from turn one. Normal mode gives each monster eyes. It hunts only what it can
 * actually see, investigates where a hero was last seen, and otherwise roams the board.
 *
 * Alec's rules (2026-09-28):
 *   - a monster notices a hero when that hero is within SIGHT_RANGE tiles of it with a clear line of
 *     sight. A red "!" flashes over its head the moment that happens.
 *   - on its next turn it moves toward where it last saw that hero.
 *   - when it can no longer see anyone, a yellow "?" flashes instead: it has lost the trail. It gets
 *     one turn to search the tile it last saw someone on, and if nobody has come into view by the
 *     turn after that, it goes back to roaming.
 *   - an idle monster roams the whole board, spending its full energy each turn (Alec, 2026-10-06).
 *     This replaced a patrol bounded to two tiles from the spawn zone, which made idle monsters
 *     shuffle on the spot. Normal mode is meaningfully busier as a result: the far side of the board
 *     is no longer quiet, and monsters wander into heroes rather than waiting to be found.
 *   - being hit counts as being noticed, even from cover: an arrow out of the dark alerts the
 *     monster to the tile it was fired from.
 *
 * Sight is the same line-of-sight the attack rules use (line-of-sight.ts), so a monster can see what
 * it could shoot: round a cliff edge, but never through a wall. The range cap on top of it is what
 * stops a monster reacting to a hero it merely shares a sightline with across the whole board.
 *
 * The awareness lives on CharacterState (`aware`, `homeTileId`, `lastSeenTileId`, `searchTurns`)
 * rather than in a map on the room, so it survives a solo save and resume, and so the web client can
 * draw the marker straight from the state patch instead of needing a message of its own.
 */
import { USER_TYPE } from "#assets/resources";
import { hasLineOfSight, tileIndex, type LosTile, type TileAt } from "#game/line-of-sight";
import type { CharacterState } from "#game/schema/CharacterState";
import type { TileState } from "#game/schema/MapState";
import type { UfbRoom } from "#game/UfbRoom";
import type { PathStep } from "#shared-types";

/** `aware` on a monster, and what the client draws for it. */
export const AWARE = {
    UNAWARE: 0,   // nothing over its head: roaming
    ALERT: 1,     // flashing red "!" — it can see a hero right now
    SEARCHING: 2, // flashing yellow "?" — it saw one a moment ago and has lost them
} as const;

/** How far a monster can notice a hero, in tiles. Straight-line distance, on top of line of sight. */
export const SIGHT_RANGE = 6;
/** Turns spent searching the last-seen tile before giving up and going back to roaming. */
export const SEARCH_TURNS = 1;

/** Bridge and stair tiles are links in the nav graph rather than nodes, so nothing can be routed to one. */
const standable = (t: { type: string }) => t.type != "Void" && !/Bridge|Stairs/.test(t.type);

/**
 * Portal tiles, which a monster may walk across but must never stop on.
 *
 * Only a player's move runs through MoveCommand, which is what swaps the destination for the far portal's
 * exit — so a monster that ended its turn on a portal would simply stand there, and while it stood there
 * nobody could step onto that tile, quietly taking the portal out of the game. Crossing one is harmless and
 * is allowed on purpose: making them solid would wall monsters out of anywhere a portal sits in a corridor.
 */
export function portalTiles(room: UfbRoom): Set<string> {
    const out = new Set<string>();
    room.state.map.spawnEntities.forEach((e) => { if (e.type == "Portal") out.add(e.tileId); });
    return out;
}

export type Difficulty = "normal" | "hard";
export const difficultyOf = (v: unknown): Difficulty => (v === "hard" ? "hard" : "normal");
/** Hard mode keeps the old always-aware AI, so everything here is skipped. */
export const usesSight = (room: UfbRoom) => difficultyOf(room.state.difficulty) === "normal";

const alive = (c: CharacterState) => c.stats.health.current > 0;
/** A hero a monster could notice: alive, on the board, not mid-revive and not invisible. */
const spottable = (c: CharacterState) =>
    c.type == USER_TYPE.USER && alive(c) && !c.stats.isRevive && !(c.invisible > 0) && c.currentTileId != "";

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** Can this monster see that hero from where it stands? Within range, and a clear line to it. */
export function canSpot(monster: CharacterState, hero: CharacterState, room: UfbRoom, tileAt: TileAt): boolean {
    if (!spottable(hero) || !alive(monster)) return false;
    const from = room.state.map.tiles.get(monster.currentTileId);
    const to = room.state.map.tiles.get(hero.currentTileId);
    if (!from || !to) return false;
    if (dist(from.coordinates, to.coordinates) > SIGHT_RANGE) return false;
    return hasLineOfSight(from as unknown as LosTile, to as unknown as LosTile, tileAt);
}

/** The nearest hero this monster can see, or null. */
export function spot(monster: CharacterState, room: UfbRoom, tileAt: TileAt): CharacterState | null {
    const from = room.state.map.tiles.get(monster.currentTileId);
    if (!from) return null;
    let best: CharacterState | null = null, bestD = Infinity;
    room.state.characters.forEach((c) => {
        if (!canSpot(monster, c, room, tileAt)) return;
        const d = dist(from.coordinates, room.state.map.tiles.get(c.currentTileId)!.coordinates);
        if (d < bestD) { bestD = d; best = c; }
    });
    return best;
}

/** A coordinate lookup over the room's tiles, built once and handed to every sight test in a pass. */
export function tileLookup(room: UfbRoom): TileAt {
    const all: LosTile[] = [];
    room.state.map.tiles.forEach((t) => all.push(t as unknown as LosTile));
    return tileIndex(all);
}

/**
 * Re-check what every monster can see, and move its marker.
 *
 * Called whenever anyone has moved rather than only on the monsters' own turns, because the "!" has
 * to appear the moment a hero walks into view — on the hero's turn, while they still have energy to
 * back out of it.
 */
export function refreshAwareness(room: UfbRoom) {
    if (!usesSight(room)) return;
    const tileAt = tileLookup(room);
    room.state.characters.forEach((m) => {
        if (m.type != USER_TYPE.MONSTER || !alive(m)) return;
        const seen = spot(m, room, tileAt);
        if (seen) {
            m.aware = AWARE.ALERT;
            m.lastSeenTileId = seen.currentTileId;
            m.searchTurns = 0;
        } else if (m.aware == AWARE.ALERT) {
            m.aware = AWARE.SEARCHING;   // lost them: the yellow "?"
        }
    });
}

/** Something hit this monster. Even out of sight, that is worth turning round for. */
export function alertToAttack(room: UfbRoom, monster: CharacterState, attacker: CharacterState | null) {
    if (!usesSight(room) || monster.type != USER_TYPE.MONSTER || !alive(monster)) return;
    if (!attacker || attacker.type != USER_TYPE.USER || !attacker.currentTileId) return;
    monster.aware = AWARE.ALERT;
    monster.lastSeenTileId = attacker.currentTileId;
    monster.searchTurns = 0;
}

/**
 * Advance a monster's awareness for the turn it is starting, and say where it should head.
 *
 * Called once per monster turn (UfbRoom.monsterPlan caches it): UfbRoom.aiChecking ticks every two
 * seconds while a monster acts, and the bookkeeping here — giving up the search, choosing somewhere to
 * roam — must happen once a turn, not once a tick.
 *
 * Returns the tile to walk toward when there is nobody to chase, or "" for nothing to do. Chasing is
 * decided fresh on every tick by the caller, since the monster may walk into view of someone.
 */
export function beginMonsterTurn(room: UfbRoom, monster: CharacterState): string {
    const seen = spot(monster, room, tileLookup(room));
    if (seen) {
        monster.aware = AWARE.ALERT;
        monster.lastSeenTileId = seen.currentTileId;
        monster.searchTurns = 0;
        return "";
    }

    if (monster.aware == AWARE.SEARCHING) {
        // One turn to search where they were last seen; after that the trail is cold.
        if (monster.searchTurns < SEARCH_TURNS && monster.lastSeenTileId && monster.lastSeenTileId != monster.currentTileId) {
            monster.searchTurns++;
            return monster.lastSeenTileId;
        }
        monster.aware = AWARE.UNAWARE;
        monster.lastSeenTileId = "";
        monster.searchTurns = 0;
    }

    // Nothing in view and no trail to follow: roam. It no longer walks back to its spawn zone first —
    // homeTileId is still recorded on the state (the client and the save rely on the field existing)
    // but routing no longer reads it.
    return roamTarget(room, monster);
}

/**
 * A route from where the monster stands to `tileId`.
 *
 * The pathfinder treats an occupied tile as blocked, so a goal somebody is standing on (a hero on
 * the tile it last saw them, another monster sitting on its spawn zone) comes back as no path at
 * all. Fall back to a free tile beside the goal, which is close enough for both jobs.
 */
export function routeTo(room: UfbRoom, monster: CharacterState, tileId: string): PathStep[] {
    if (!tileId || tileId == monster.currentTileId) return [];
    const pf = room.getPathFinder();
    const portals = portalTiles(room);
    // A hero last seen standing on a portal, or a spawn zone beside one: aim next to it, not at it.
    if (!portals.has(tileId)) {
        const direct = pf.find(monster.currentTileId, tileId);
        if (direct.foundPath && direct.path.length > 1) return trimPortalEnd(direct.path, portals);
    }

    const goal = room.state.map.tiles.get(tileId);
    if (!goal) return [];
    const tileAt = tileLookup(room);
    let best: PathStep[] = [];
    let bestCost = Infinity;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const n = tileAt({ x: goal.coordinates.x + dx, y: goal.coordinates.y + dy });
        if (!n || !standable(n)) continue;
        if (portals.has(n.id)) continue;
        const r = pf.find(monster.currentTileId, n.id);
        if (r.foundPath && r.path.length > 1 && r.cost < bestCost) { bestCost = r.cost; best = trimPortalEnd(r.path, portals); }
    }
    return best;
}

/** Drop any portal tiles off the end of a route, so the walk finishes somewhere the monster may stand. */
export function trimPortalEnd(path: PathStep[], portals: Set<string>): PathStep[] {
    let end = path.length;
    while (end > 1 && portals.has(path[end - 1].tileId)) end--;
    return end === path.length ? path : path.slice(0, end);
}

/**
 * Somewhere on the map to wander to, for a monster with nothing better to do.
 *
 * This replaced a patrol that stayed within two tiles of the spawn zone, which made idle monsters
 * shuffle on the spot — Alec's call (2026-10-06) is that they roam the whole board instead.
 *
 * Energy is what makes it a roam rather than a teleport: UfbRoom walks at most `energy` steps of the
 * route each turn (`path.slice(0, min(path.length, energy))`), so a distant target simply means the
 * monster spends everything it has walking and picks up again next turn. Candidates at least `energy`
 * away in straight-line distance are preferred for exactly that reason — a path is never shorter than
 * that distance, so choosing one guarantees the whole turn's energy is used. The nearer tiles are a
 * fallback for small or heavily walled maps where nothing is far enough.
 */
export function roamTarget(room: UfbRoom, monster: CharacterState): string {
    const tiles = room.state.map.tiles;
    const here = tiles.get(monster.currentTileId);
    const taken = new Set<string>();
    room.state.characters.forEach((c) => { if (c.id != monster.id && alive(c)) taken.add(c.currentTileId); });

    const portals = portalTiles(room);
    const reach = Math.max(1, monster.stats.energy.current);
    const far: TileState[] = [];
    const near: TileState[] = [];
    tiles.forEach((t) => {
        if (t.id == monster.currentTileId || taken.has(t.id) || portals.has(t.id)) return;
        if (!standable(t)) return;
        if (here && dist(t.coordinates, here.coordinates) >= reach) far.push(t); else near.push(t);
    });
    const pool = far.length ? far : near;
    // One tile picked at random rather than the best of them: a monster that stands still for a turn
    // because the tile it fancied is walled off is a fine roam too.
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : "";
}
