/**
 * Checks how Heart Pieces and Energy Shards turn into crystals (map-helpers.addItemToCharacter), with no
 * database and no server:
 *
 *   npx tsx src/jobs/check-crystals.ts
 *
 * The two things worth pinning down are that a pickup of several pieces at once is worth every crystal it
 * completes — not at most one — and that two crystals raise the maximum twice.
 */
import { CharacterState } from "#game/schema/CharacterState";
import { addItemToCharacter, getItemCountFromCharacter } from "#game/helpers/map-helpers";
import { CRYSTAL_PARTS, ITEMTYPE } from "#assets/resources";

let pass = 0, fail = 0;
const say = (s: string) => process.stdout.write(s + "\n");
const check = (label: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    say(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok ? "" : `   got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
    ok ? pass++ : fail++;
};

function hero() {
    const c = new CharacterState();
    c.stats.health.max = 40; c.stats.health.current = 40;
    c.stats.energy.max = 20; c.stats.energy.current = 20;
    return c;
}
const heartsOf = (c: CharacterState) => getItemCountFromCharacter(ITEMTYPE.HEART_CRYSTAL, c);
const shardsCrystals = (c: CharacterState) => getItemCountFromCharacter(ITEMTYPE.ENERGY_CRYSTAL, c);

say("\n== the ratios are the ones the rules table states ==");
check("4 Heart Pieces to a Heart Crystal", CRYSTAL_PARTS[ITEMTYPE.HEART_PIECE], { crystal: ITEMTYPE.HEART_CRYSTAL, per: 4 });
check("3 Energy Shards to an Energy Crystal", CRYSTAL_PARTS[ITEMTYPE.ENERGY_SHARD], { crystal: ITEMTYPE.ENERGY_CRYSTAL, per: 3 });

say("\n== one piece at a time ==");
{
    const c = hero();
    for (let i = 1; i <= 3; i++) addItemToCharacter(ITEMTYPE.HEART_PIECE, 1, c);
    check("3 pieces make no crystal", heartsOf(c), 0);
    check("and don't touch max health", c.stats.health.max, 40);
    addItemToCharacter(ITEMTYPE.HEART_PIECE, 1, c);
    check("the 4th makes one", heartsOf(c), 1);
    check("max health +5", c.stats.health.max, 45);
    for (let i = 0; i < 4; i++) addItemToCharacter(ITEMTYPE.HEART_PIECE, 1, c);
    check("four more make a second", heartsOf(c), 2);
    check("max health +10 in total", c.stats.health.max, 50);
}

say("\n== several at once (a loot box, a craft) ==");
{
    const c = hero();
    addItemToCharacter(ITEMTYPE.HEART_PIECE, 4, c);
    check("4 pieces in one go make a crystal", heartsOf(c), 1);
    check("max health +5", c.stats.health.max, 45);
}
{
    const c = hero();
    addItemToCharacter(ITEMTYPE.HEART_PIECE, 8, c);
    check("8 pieces in one go make two", heartsOf(c), 2);
    check("and raise max health twice", c.stats.health.max, 50);
}
{
    const c = hero();
    addItemToCharacter(ITEMTYPE.HEART_PIECE, 3, c);
    addItemToCharacter(ITEMTYPE.HEART_PIECE, 3, c);
    check("3 then 3 crosses the boundary once", heartsOf(c), 1);
    check("6 pieces held", getItemCountFromCharacter(ITEMTYPE.HEART_PIECE, c), 6);
}

say("\n== energy shards, 3 to a crystal ==");
{
    const c = hero();
    addItemToCharacter(ITEMTYPE.ENERGY_SHARD, 2, c);
    check("2 shards make none", shardsCrystals(c), 0);
    addItemToCharacter(ITEMTYPE.ENERGY_SHARD, 1, c);
    check("the 3rd makes one", shardsCrystals(c), 1);
    check("max energy +3", c.stats.energy.max, 23);
    addItemToCharacter(ITEMTYPE.ENERGY_SHARD, 6, c);
    check("6 more make two more", shardsCrystals(c), 3);
    check("max energy +9 in total", c.stats.energy.max, 29);
}

say("\n== a crystal picked up directly still applies ==");
{
    const c = hero();
    addItemToCharacter(ITEMTYPE.HEART_CRYSTAL, 1, c);
    check("max health +5", c.stats.health.max, 45);
    addItemToCharacter(ITEMTYPE.ENERGY_CRYSTAL, 2, c);
    check("two energy crystals are +6", c.stats.energy.max, 26);
}

say(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
