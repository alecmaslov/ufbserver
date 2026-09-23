/**
 * One saved solo game per player (guest "web-…" id or account id), so a solo run can be quit and resumed from the
 * web client's home screen.
 *
 * The snapshot is the room's whole schema state (Colyseus encodeAll → bytes), plus the few turn flags UfbRoom keeps
 * outside the schema. It is written when a turn changes and when the player leaves, and deleted once the hero has
 * died or won (UfbRoom.banked) or when the player abandons the run.
 *
 * This module never touches gold: account gold is written only by UfbRoom.BankGold when a game ends.
 */
import db from "#db";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import type { UfbRoom } from "#game/UfbRoom";

export interface SoloSaveSummary { mapName: string; heroClass: string; displayName: string; turn: number; updatedAt: Date }

/** A solo room: exactly one human, who created it. Set on the room in onCreate. */
export interface SoloInfo { ownerId: string; resumed: boolean }

interface Extra { v: 1; isTurnStartEquip: boolean; isTurnStartStack: boolean; spawned: boolean }

const USER = 1;

export async function soloSummary(ownerId: string): Promise<SoloSaveSummary | null> {
    return db.soloSave.findUnique({
        where: { ownerId },
        select: { mapName: true, heroClass: true, displayName: true, turn: true, updatedAt: true },
    });
}

export async function discardSolo(ownerId: string) {
    await db.soloSave.deleteMany({ where: { ownerId } });
}

/** Load a saved run into a fresh state object. Returns null if there is none (or it no longer decodes). */
export async function loadSolo(ownerId: string): Promise<{ state: UfbRoomState; extra: Extra } | null> {
    const row = await db.soloSave.findUnique({ where: { ownerId } });
    if (!row) return null;
    try {
        const state = new UfbRoomState();
        state.decode(Array.from(row.state));
        return { state, extra: JSON.parse(row.extra) as Extra };
    } catch (e) {
        console.error("solo save for", ownerId, "does not decode; discarding", e);
        await discardSolo(ownerId);
        return null;
    }
}

/**
 * Write the room's current state as the owner's save — or delete the save if the run is over.
 * Does nothing before the owner has dropped onto the board (nothing worth resuming yet).
 */
export async function persistSolo(room: UfbRoom) {
    const solo = room.solo; if (!solo) return;
    const me = room.state.characters.get(solo.ownerId);
    if (!me || !room.spawnedIds.has(solo.ownerId)) return;
    try {
        if (room.banked.has(me.id) || me.stats.health.current <= 0) { await discardSolo(solo.ownerId); return; }
        // another human joined (shouldn't happen: solo rooms are locked) — no longer a solo run
        let humans = 0; room.state.characters.forEach((c) => { if (c.type == USER) humans++; });
        if (humans !== 1) return;
        const extra: Extra = { v: 1, isTurnStartEquip: room.isTurnStartEquip, isTurnStartStack: room.isTurnStartStack, spawned: true };
        const data = {
            mapName: room.state.map.name, heroClass: me.characterClass, displayName: me.displayName, turn: room.state.turn,
            state: Buffer.from(room.state.encodeAll()), extra: JSON.stringify(extra),
        };
        await db.soloSave.upsert({ where: { ownerId: solo.ownerId }, create: { ownerId: solo.ownerId, ...data }, update: data });
    } catch (e) {
        console.error("solo save failed", solo.ownerId, e);
    }
}
