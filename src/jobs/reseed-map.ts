/**
 * Re-seed one map from data/mapsDeploy/<name>/map.json, replacing whatever is in the database.
 * Use after editing a map (e.g. with the web map editor at /editor/).
 *
 *   npx tsx src/jobs/reseed-map.ts kaiju
 *
 * Tiles cascade-delete their spawn zones and adjacencies, so dropping the UfbMap row is enough.
 * Rooms already running on the old map keep their in-memory copy until they are recreated.
 */
import { getMap } from "#assets/maps";
import db from "#db";
import { insertMap } from "#jobs/insert-maps";

const name = process.argv[2];
if (!name) {
    console.error("usage: tsx src/jobs/reseed-map.ts <mapName>");
    process.exit(1);
}

async function main() {
    const map = getMap(name);
    const existing = await db.ufbMap.findFirst({ where: { name } });
    if (existing) {
        await db.ufbMap.delete({ where: { id: existing.id } });
        console.log(`deleted old ${name} (${existing.id})`);
    }
    await insertMap(map);
    const fresh = await db.ufbMap.findFirst({ where: { name }, include: { tiles: true } });
    console.log(`re-seeded ${name}: ${fresh?.tiles.length ?? 0} tiles`);
    await db.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
});
