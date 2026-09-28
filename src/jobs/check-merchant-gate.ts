/**
 * The merchant takes a job before it does business: buying, selling and crafting are shut until the shopper
 * accepts a quest on this visit (message-handlers.ts questGate).
 *
 *   npx tsx src/jobs/check-merchant-gate.ts
 *
 * The case worth pinning down is the one that would be a disaster in a match: the gate must never shut the
 * shop for good. A hero carrying the maximum quests, or standing at a merchant whose whole offer they already
 * hold, can't take another job — so for them the shop has to be open.
 */
import { CharacterState, Quest } from "#game/schema/CharacterState";
import { SpawnEntity } from "#game/schema/MapState";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { MAX_ACTIVE_QUESTS, questGateFor } from "#game/message-handlers";

let pass = 0, fail = 0;
const say = (s: string) => process.stdout.write(s + "\n");
const check = (label: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    say(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : `   got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
    ok ? pass++ : fail++;
};

const TILE = "tile_M_13";
function room() {
    const state = new UfbRoomState();
    state.turn = 7;
    const m = new SpawnEntity();
    m.id = "merch1"; m.type = "Merchant" as any; m.tileId = TILE;
    state.map.spawnEntities.push(m);
    return { state, questVisit: new Map<string, string>(), questOffers: new Map<string, any[]>() } as any;
}
function hero(tileId = TILE, held: number[] = []) {
    const c = new CharacterState();
    c.id = "h1"; c.currentTileId = tileId;
    held.forEach((id) => { const q = new Quest(); q.id = id; c.quests.push(q); });
    return c;
}
const offer = (r: any, c: CharacterState, ids: number[]) => r.questOffers.set(c.id, ids.map((id) => ({ id })));
const visitKey = (r: any) => `${r.state.turn}:merch1`;

say("\n== the shop is shut until a job is taken ==");
{
    const r = room(), c = hero();
    offer(r, c, [1, 2, 3]);
    check("standing at the merchant with a job going: shut", questGateFor(r, c) !== "", true);
    r.questVisit.set(c.id, visitKey(r));
    check("after taking one: open", questGateFor(r, c), "");
}

say("\n== a job taken on an earlier visit doesn't count ==");
{
    const r = room(), c = hero();
    offer(r, c, [1, 2]);
    r.questVisit.set(c.id, `3:merch1`);      // an earlier turn, same merchant
    check("shut again on a later visit", questGateFor(r, c) !== "", true);
    r.questVisit.set(c.id, `7:merch2`);      // same turn, a different merchant
    check("and a different merchant is its own visit", questGateFor(r, c) !== "", true);
}

say("\n== it never shuts the shop for good ==");
{
    const r = room(), c = hero(TILE, [1, 2, 3]);
    offer(r, c, [4, 5]);
    check(`carrying the maximum (${MAX_ACTIVE_QUESTS}): open`, questGateFor(r, c), "");
}
{
    const r = room(), c = hero(TILE, [1, 2]);
    offer(r, c, [1, 2]);                      // every offer is one they already hold
    check("nothing on offer they can take: open", questGateFor(r, c), "");
}
{
    const r = room(), c = hero();
    offer(r, c, []);                          // merchant offering nothing at all
    check("no offers at all: open", questGateFor(r, c), "");
}
{
    const r = room(), c = hero();             // no offers recorded for this character yet
    check("no offer list yet: open", questGateFor(r, c), "");
}

say("\n== away from a merchant the gate says nothing ==");
{
    const r = room(), c = hero("tile_A_1");
    offer(r, c, [1, 2]);
    check("not at a merchant: open (other checks refuse the trade)", questGateFor(r, c), "");
}

say(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
