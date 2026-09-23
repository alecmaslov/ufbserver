/**
 * Move existing figurines onto the skill trees.
 *
 * Two things happen to a character bought under the old flat level ladder:
 *   - it is rolled three elements, if it has none, because a figurine without elements has no
 *     tree to climb and every skill-tree endpoint will refuse it
 *   - the gold it spent on levels is refunded, and it drops back to level 1 with no nodes bought,
 *     because the old `100 + 50 * (level - 1)` ladder and the new per-node one are not comparable
 *
 * Dry by default. Nothing is written until --apply is passed.
 *
 *   npx tsx src/jobs/migrate-to-skill-trees.ts            # report only
 *   npx tsx src/jobs/migrate-to-skill-trees.ts --apply
 */
import db from "#db";
import { drawElements, legalDraw, ElementSlug } from "#game/skill-tree";

const APPLY = process.argv.includes("--apply");

/** What the old ladder charged to climb from level 1 to `level`. */
const oldLevelSpend = (level: number) => {
    let total = 0;
    for (let l = 1; l < level; l++) total += 100 + 50 * (l - 1);
    return total;
};

async function main() {
    const characters = await db.character.findMany({
        where: { ownerId: { not: null } },
        include: { skills: true },
    });
    console.log(`${characters.length} owned character(s)`);

    const refunds = new Map<string, number>();
    let rolled = 0;
    let reset = 0;

    for (const c of characters) {
        const els = c.elements as ElementSlug[] | null;
        const needsElements = !Array.isArray(els) || !legalDraw(els);
        const refund = c.skills.length === 0 ? oldLevelSpend(c.level) : 0;

        if (needsElements) rolled++;
        if (refund > 0) {
            reset++;
            refunds.set(c.ownerId!, (refunds.get(c.ownerId!) ?? 0) + refund);
        }
        console.log(`  ${c.className.padEnd(14)} level ${String(c.level).padStart(2)}` +
            `  elements ${needsElements ? "roll" : (els as string[]).join("+")}` +
            `  refund ${refund.toLocaleString()}`);

        if (!APPLY) continue;
        await db.$transaction(async (tx) => {
            const data: Record<string, unknown> = {};
            if (needsElements) data.elements = drawElements();
            if (refund > 0) data.level = 1;
            if (Object.keys(data).length) await tx.character.update({ where: { id: c.id }, data });
            if (refund > 0) {
                await tx.user.update({
                    where: { id: c.ownerId! },
                    data: { gold: { increment: refund } },
                });
            }
        });
    }

    console.log(`\n${rolled} rolled elements, ${reset} reset to level 1`);
    for (const [userId, gold] of refunds) console.log(`  refund ${gold.toLocaleString()} -> ${userId}`);
    console.log(APPLY ? "applied" : "dry run — pass --apply to write");
    await db.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
});
