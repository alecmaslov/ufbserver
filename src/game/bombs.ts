/**
 * Where a bomb may be put, and what it does when it lands.
 *
 * Alec's rules (2026-10-07):
 *
 *   PLANT — an adjacent tile on your own level, nothing solid in between, and the tile must be
 *   EMPTY. Not a loot box, not a loot bag, not a portal, not a merchant, not stairs, not a bridge,
 *   not void, and nobody standing on it. Costs 1 energy.
 *
 *   DROP — an adjacent tile one level BELOW you, with a monster or another player standing on it.
 *   Costs 1 energy, same as a plant, and adds DROP_BONUS to the bomb's damage for the fall.
 *
 * The two are deliberately complementary and easy to remember: level with you, it must be empty;
 * below you, it must be occupied.
 *
 * This module exists because the rules were previously implemented in `getMoveItem` (which answers
 * "where can I put this?") and not at all in `SET_MOVE_ITEM` (which actually places it). The client
 * never read the first handler's reply, so it offered illegal tiles, and the second trusted whatever
 * tileId it was handed — which meant a bomb could be placed anywhere on the map. Both handlers now
 * call in here, so there is one definition of the rules and no way for the two to disagree.
 */
import { canDropOnto, canMelee, plantable, tileLevel, type LosTile } from "#game/line-of-sight";
import type { CharacterState } from "#game/schema/CharacterState";
import type { TileState } from "#game/schema/MapState";
import type { UfbRoom } from "#game/UfbRoom";
import { ITEMTYPE, USER_TYPE } from "#assets/resources";
import { getTileIdByDirection } from "#game/helpers/map-helpers";

/** Extra damage a bomb does when dropped from the level above. */
export const DROP_BONUS = 2;

export const BOMB_IDS: readonly number[] = [
    ITEMTYPE.BOMB, ITEMTYPE.ICE_BOMB, ITEMTYPE.FIRE_BOMB, ITEMTYPE.VOID_BOMB, ITEMTYPE.CALTROP_BOMB,
];
export const isBomb = (itemId: number) => BOMB_IDS.includes(itemId);

const alive = (c: CharacterState) => c.stats.health.current > 0;

/** The living character standing on a tile, if any. Heroes and monsters both count as occupants. */
export function occupantOf(room: UfbRoom, tileId: string): CharacterState | null {
    let found: CharacterState | null = null;
    room.state.characters.forEach((c) => { if (!found && alive(c) && c.currentTileId === tileId) found = c; });
    return found;
}

/**
 * Is this tile carrying something a bomb must not be put on?
 *
 * One test covers loot boxes, loot bags, portals, merchants and monster spawn points, because they
 * are all spawn entities — which is why this does not need to name them individually and cannot
 * fall out of date when a new entity type is added.
 */
export const hasEntity = (room: UfbRoom, tileId: string) =>
    room.state.map.spawnEntities.findIndex((e) => e.tileId === tileId) !== -1;

/** A bomb already lying there. Placing onto one used to silently delete it; now it refuses. */
export const hasMoveItem = (room: UfbRoom, tileId: string) =>
    room.state.map.moveItemEntities.findIndex((m) => m.tileId === tileId) !== -1;

export type Refusal = string | null;

/** Why this tile cannot be planted on, or null if it can. The string is shown to the player. */
export function plantRefusal(room: UfbRoom, actor: CharacterState, to: TileState | undefined): Refusal {
    const from = room.state.map.tiles.get(actor.currentTileId);
    if (!from || !to) return "That tile is not on the board.";
    if (!plantable(to as unknown as LosTile)) return "Nothing can be left on stairs, a bridge or the void.";
    if (!canMelee(from as unknown as LosTile, to as unknown as LosTile)) return "Plant it on a tile beside you, on your own level, with nothing in the way.";
    if (hasEntity(room, to.id)) return "Something is already on that tile.";
    if (hasMoveItem(room, to.id)) return "There is already a bomb there.";
    if (occupantOf(room, to.id)) return "Someone is standing there — drop it from above instead.";
    return null;
}

/** Why this tile cannot be dropped on, or null if it can. */
export function dropRefusal(room: UfbRoom, actor: CharacterState, to: TileState | undefined): Refusal {
    const from = room.state.map.tiles.get(actor.currentTileId);
    if (!from || !to) return "That tile is not on the board.";
    if (!plantable(to as unknown as LosTile)) return "Nothing can be dropped onto stairs, a bridge or the void.";
    if (!canDropOnto(from as unknown as LosTile, to as unknown as LosTile)) return "Drops only reach a tile one level below you, beside you, with nothing in the way.";
    const target = occupantOf(room, to.id);
    if (!target) return "A drop needs someone to drop it on.";
    if (target.id === actor.id) return "You cannot drop a bomb on yourself.";
    if (target.type !== USER_TYPE.USER && target.type !== USER_TYPE.MONSTER) return "That is not a target.";
    return null;
}

/**
 * Decide what putting a bomb on this tile would be, or why it cannot be done.
 *
 * The caller should not have to know that a plant and a drop are different rules with the same
 * button. If either is legal, that is the mode; if neither is, this picks the refusal worth showing
 * — the drop reason when the tile is below the player, because that is clearly what they meant.
 */
export function bombPlacement(room: UfbRoom, actor: CharacterState, to: TileState | undefined):
    { mode: "plant" | "drop"; why: null } | { mode: null; why: string } {
    const plantWhy = plantRefusal(room, actor, to);
    if (!plantWhy) return { mode: "plant", why: null };
    const dropWhy = dropRefusal(room, actor, to);
    if (!dropWhy) return { mode: "drop", why: null };

    const from = room.state.map.tiles.get(actor.currentTileId);
    const below = !!from && !!to
        && tileLevel(from as unknown as LosTile) > tileLevel(to as unknown as LosTile);
    return { mode: null, why: below ? dropWhy : plantWhy };
}

/**
 * The legal plant tiles and drop targets from where this character stands.
 *
 * Returned as tile ids rather than the directions array the old handler used. Directions only ever
 * worked because plants are orthogonal; drops are too, but naming the tiles means the client can
 * highlight them without recomputing the geometry it kept getting wrong.
 */
export function bombTargets(room: UfbRoom, actor: CharacterState): { plant: string[]; drop: string[] } {
    const from = room.state.map.tiles.get(actor.currentTileId);
    const plant: string[] = [], drop: string[] = [];
    if (!from) return { plant, drop };
    // getTileIdByDirection indexes by coordinate rather than scanning, which matters: the alternative
    // is four passes over all 676 tiles of a map every time the player presses Place.
    for (const dir of ["top", "right", "down", "left"]) {
        const id = getTileIdByDirection(room.state.map.tiles, from.coordinates, dir);
        const to = id ? room.state.map.tiles.get(id) : undefined;
        if (!to) continue;
        if (!plantRefusal(room, actor, to)) plant.push(to.id);
        else if (!dropRefusal(room, actor, to)) drop.push(to.id);
    }
    return { plant, drop };
}
