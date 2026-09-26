/**
 * Figurines: the paywall.
 *
 * A hero is a physical figurine with an NFC chip, bought with real money. Claiming one here is
 * registering a figurine you already hold — by tapping its chip, or by entering the code printed
 * in its box. Gold is never involved; account gold only ever pays for skill-tree nodes.
 *
 * Two rules the rest of the design leans on:
 *
 *  - the claim code is stored only as a hash, and compared in constant time. A readable code in
 *    the database is free inventory for anyone who gets a look at it.
 *  - progress belongs to the figurine, not the account. The character and its skill tree hang off
 *    the Figurine row, so releasing one and claiming it elsewhere carries the tree along, the way
 *    a physical toy does when it changes hands.
 */
import db from "#db";
import { drawElements } from "#game/skill-tree";
import { requireUser } from "#middleware/requireUser";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import { HERO_CATALOGUE, statsForLevel } from "#routes/account";
import { createId } from "@paralleldrive/cuid2";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { Handler, Router } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";

/** Claim attempts are the one place a brute force pays, so they get their own tight limit. */
const claimLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10,
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { error: "TOO_MANY_ATTEMPTS" },
});
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, limit: 60,
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS" },
});

/** Codes are case-insensitive and ignore the dashes people type back in. */
export const normaliseCode = (raw: string) =>
    String(raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

// no vowels, no 0/O/1/I — a code gets read off cardboard and typed in by hand
const CODE_ALPHABET = "23456789ACDEFGHJKLMNPQRTUVWXYZ";

/** A new claim code, XXXX-XXXX-XXXX-XXXX. Show it once and store only hashCode(code). */
export function makeClaimCode(): string {
    let out = "";
    for (let i = 0; i < 16; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    return out.match(/.{4}/g)!.join("-");
}

export const hashCode = (raw: string) =>
    createHash("sha256").update(normaliseCode(raw)).digest("hex");

const sameHash = (a: string, b: string) => {
    const x = Buffer.from(a, "utf8");
    const y = Buffer.from(b, "utf8");
    return x.length === y.length && timingSafeEqual(x, y);
};

const publicFigurine = (f: any) => ({
    id: f.id, className: f.className, claimedAt: f.claimedAt,
    hasChip: !!f.nfcUid, characterId: f.characterId,
});

/**
 * Claim a figurine onto this account.
 *
 * The lookup is by hash, so the code itself never travels further than this function. A figurine
 * already held by someone else is refused; one the caller already holds is a no-op rather than an
 * error, so a double tap of the same chip is harmless.
 */
const claim: Handler = async (req: any, res: any) => {
    const code = normaliseCode(req.body.code);
    const nfcUid = req.body.nfcUid ? String(req.body.nfcUid).trim() : null;
    if (code.length < 8) { res.status(400).send({ error: "BAD_CODE" }); return; }

    const wanted = hashCode(code);
    const figurine = await db.figurine.findUnique({ where: { claimHash: wanted } });
    // one message whether the code is wrong or simply does not exist, so this cannot be used to
    // probe which codes are real
    if (!figurine || !sameHash(figurine.claimHash, wanted)) {
        res.status(404).send({ error: "BAD_CODE" }); return;
    }
    if (figurine.ownerId && figurine.ownerId === req.user.id) {
        res.send({ figurine: publicFigurine(figurine), alreadyYours: true });
        return;
    }
    if (figurine.ownerId) { res.status(409).send({ error: "ALREADY_CLAIMED" }); return; }

    const hero = HERO_CATALOGUE.find((h) => h.className === figurine.className);
    if (!hero) { res.status(500).send({ error: "UNKNOWN_HERO" }); return; }

    const claimed = await db.$transaction(async (tx) => {
        let characterId = figurine.characterId;
        if (!characterId) {
            // first claim: this figurine gets its character and its three permanent elements
            const base = statsForLevel(1);
            await tx.characterClass.upsert({
                where: { name: hero.className }, create: { name: hero.className }, update: {},
            });
            const character = await tx.character.create({
                data: {
                    id: createId(), className: hero.className, name: hero.className,
                    ownerId: req.user.id, level: 1, elements: drawElements(),
                },
            });
            await tx.characterData.create({
                data: { characterId: character.id, userId: req.user.id, health: base.maxHealth, energy: base.maxEnergy, ...base },
            });
            characterId = character.id;
        } else {
            // changing hands: the character and its skill tree come with the figurine
            await tx.character.update({ where: { id: characterId }, data: { ownerId: req.user.id } });
        }
        return tx.figurine.update({
            where: { id: figurine.id },
            data: { ownerId: req.user.id, characterId, claimedAt: new Date(), ...(nfcUid ? { nfcUid } : {}) },
        });
    });

    res.send({ figurine: publicFigurine(claimed) });
};

/** Let go of a figurine so it can be sold on. Its tree stays with it, not with this account. */
const release: Handler = async (req: any, res: any) => {
    const figurine = await db.figurine.findFirst({
        where: { id: String(req.body.id ?? ""), ownerId: req.user.id },
    });
    if (!figurine) { res.status(404).send({ error: "NOT_YOURS" }); return; }

    await db.$transaction(async (tx) => {
        if (figurine.characterId) {
            await tx.character.update({ where: { id: figurine.characterId }, data: { ownerId: null } });
        }
        await tx.figurine.update({ where: { id: figurine.id }, data: { ownerId: null, claimedAt: null } });
    });
    res.send({ released: figurine.id });
};

const mine: Handler = async (req: any, res: any) => {
    const rows = await db.figurine.findMany({ where: { ownerId: req.user.id }, orderBy: { claimedAt: "asc" } });
    res.send({ figurines: rows.map(publicFigurine) });
};

const router: Router = Router();
export default router;

router.get("/", apiLimiter, requireUser, safetyNet(mine));
router.post("/claim", claimLimiter, requireUser, body("code").isString(), validate, safetyNet(claim));
router.post("/release", apiLimiter, requireUser, body("id").isString(), validate, safetyNet(release));
