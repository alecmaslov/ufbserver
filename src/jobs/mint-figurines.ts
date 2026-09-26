/**
 * Mint claim codes for a batch of figurines.
 *
 * One row per physical toy. The code printed in the box is generated here, shown here, and then
 * never recoverable — only its hash is stored, so a leak of the database is not a leak of free
 * heroes. Print the output or lose it.
 *
 *   npx tsx src/jobs/mint-figurines.ts Kirin 50            # report what it would mint
 *   npx tsx src/jobs/mint-figurines.ts Kirin 50 --apply    # write them, print the codes
 */
import db from "#db";
import { HERO_CATALOGUE } from "#routes/account";
import { hashCode, makeClaimCode as makeCode, normaliseCode } from "#routes/figurine";

const APPLY = process.argv.includes("--apply");
const className = process.argv[2];
const count = Number(process.argv[3] ?? 0);

async function main() {
    const hero = HERO_CATALOGUE.find((h) => h.className === className || h.slug === className);
    if (!hero || !Number.isInteger(count) || count < 1 || count > 5000) {
        console.error("usage: tsx src/jobs/mint-figurines.ts <hero> <count> [--apply]");
        console.error("heroes: " + HERO_CATALOGUE.map((h) => h.className).join(", "));
        process.exit(1);
    }

    const existing = await db.figurine.count({ where: { className: hero.className } });
    console.log(`${hero.className}: ${existing} minted so far, adding ${count}`);
    if (!APPLY) {
        console.log("dry run — pass --apply to mint and print the codes");
        await db.$disconnect();
        return;
    }

    console.log("\nserial                 code");
    for (let i = 0; i < count; i++) {
        const code = makeCode();
        const serial = `${hero.slug}-${String(existing + i + 1).padStart(5, "0")}`;
        await db.figurine.create({
            data: { id: serial, className: hero.className, claimHash: hashCode(normaliseCode(code)) },
        });
        console.log(`${serial.padEnd(22)} ${code}`);
    }
    console.log("\nthese codes cannot be recovered — only their hashes were stored");
    await db.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
});
