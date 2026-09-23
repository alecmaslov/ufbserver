/**
 * Player accounts: sign up / sign in, the hero roster (owned vs buyable), buying and levelling heroes.
 *
 * Rules (UFB User Account deck):
 *  - Anyone can play; guests are always level 1 and bank nothing.
 *  - Gold is earned by playing and is written by the game server only (see UfbRoom.BankGold).
 *  - A hero must be bought before it can be levelled; levels cost gold and raise the hero's stat ceilings.
 *
 * Everything money-related is server-authoritative: the client never sends a gold amount.
 */
import { UserJwt } from "#auth";
import db from "#db";
import { requireUser } from "#middleware/requireUser";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import { drawElements, levelFor, MAX_LEVEL as TREE_MAX_LEVEL } from "#game/skill-tree";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcrypt";
import { Handler, Router } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";

/**
 * Heroes that have models and can be played.
 *
 * Heroes are NOT bought with gold. A hero is a physical figurine with an NFC chip, bought with
 * real money; claiming one here is registering a figurine you already own. Account gold only ever
 * pays for skill-tree nodes. `price` is kept only so the storefront can show what a figurine
 * costs in real currency, and nothing in this file spends gold against it.
 */
export const HERO_CATALOGUE = [
    { className: "Kirin", slug: "kirin", price: 400 },
    { className: "Data Avenger", slug: "data", price: 400 },
    { className: "Mevisto", slug: "mevisto", price: 600 },
    { className: "Ophaia", slug: "ophaia", price: 600 },
];
const MAX_LEVEL = 50;
export const levelCost = (level: number) => 100 + 50 * (level - 1);
/** Stat ceilings a hero reaches at a given level; the game applies these when the player spawns. */
export const statsForLevel = (level: number) => ({
    maxHealth: 40 + (level - 1) * 3,
    maxEnergy: 20 + (level - 1) * 2,
    maxUltimate: 100 + (level - 1) * 5,
    maxMelee: 2 + Math.floor((level - 1) / 5),
    maxMana: 2 + Math.floor((level - 1) / 5),
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "TOO_MANY_ATTEMPTS" } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "TOO_MANY_REQUESTS" } });

const publicUser = (u: any) => ({
    id: u.id, email: u.email, displayName: u.displayName,
    gold: u.gold, crystals: u.crystals ?? 0, createdAt: u.createdAt,
});

async function rosterFor(userId: string) {
    const owned = await db.character.findMany({
        where: { ownerId: userId },
        include: { characterData: true, skills: true },
    });
    return HERO_CATALOGUE.map((h) => {
        const mine = owned.find((c) => c.className === h.className);
        // level is now simply how many skill-tree nodes the figurine has bought
        const level = mine ? levelFor(mine.skills.length) : 1;
        return {
            className: h.className, slug: h.slug, price: h.price,
            owned: !!mine, characterId: mine?.id ?? null, level,
            elements: (mine?.elements as string[] | null) ?? null,
            maxLevel: TREE_MAX_LEVEL,
            nextLevelCost: null,
            stats: statsForLevel(level),
            record: mine?.characterData?.[0]
                ? { battles: mine.characterData[0].battles, wins: mine.characterData[0].wins, kills: mine.characterData[0].kills, gold: mine.characterData[0].collect_golds }
                : { battles: 0, wins: 0, kills: 0, gold: 0 },
        };
    });
}

const signUp: Handler = async (req: any, res: any) => {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const displayName = String(req.body.displayName ?? "").trim().slice(0, 18) || "Player";
    if (password.length < 8) { res.status(400).send({ error: "PASSWORD_TOO_SHORT" }); return; }
    if (await db.user.findUnique({ where: { email } })) { res.status(409).send({ error: "ALREADY_EXIST" }); return; }

    const user = await db.user.create({
        data: { id: createId(), email, displayName, profileImageUrl: "", passwordHash: bcrypt.hashSync(password, 12) },
    });
    await db.userData.create({ data: { userId: user.id } });
    const { token, expiresAt } = UserJwt.generate(user.id);
    res.send({ token, expiresAt, user: publicUser(user), heroes: await rosterFor(user.id) });
};

const signIn: Handler = async (req: any, res: any) => {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const user = await db.user.findUnique({ where: { email } });
    // one message for both cases, so the endpoint can't be used to test which emails exist
    if (!user?.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
        res.status(401).send({ error: "BAD_CREDENTIALS" });
        return;
    }
    const { token, expiresAt } = UserJwt.generate(user.id);
    res.send({ token, expiresAt, user: publicUser(user), heroes: await rosterFor(user.id) });
};

const me: Handler = async (req: any, res: any) => {
    const data = await db.userData.findUnique({ where: { userId: req.user.id } });
    res.send({ user: publicUser(req.user), heroes: await rosterFor(req.user.id), record: data ?? null });
};

/**
 * Superseded by the figurine claim. A hero is a physical toy bought with real money, so there is
 * nothing here to buy — POST /account/figurine/claim with the code from the box instead.
 *
 * Kept as an explicit refusal rather than deleted: with the gold cost gone this endpoint would
 * otherwise hand out heroes for nothing, which is the paywall wide open.
 */
const buyHero: Handler = async (_req: any, res: any) => {
    res.status(410).send({ error: "USE_CLAIM_CODE" });
};

const buyHeroLegacy: Handler = async (req: any, res: any) => {
    const className = String(req.body.className ?? "");
    const hero = HERO_CATALOGUE.find((h) => h.className === className || h.slug === className);
    if (!hero) { res.status(400).send({ error: "UNKNOWN_HERO" }); return; }
    if (await db.character.findFirst({ where: { ownerId: req.user.id, className: hero.className } })) {
        res.status(409).send({ error: "ALREADY_OWNED" }); return;
    }
    const user = await db.user.findUnique({ where: { id: req.user.id } });

    // TODO(nfc): the real gate is proof of the figurine — an NFC chip read, or a claim code from
    // the purchase. Until that exists this endpoint registers a hero to the account for nothing,
    // so it must not ship to a public launch as it stands.
    const base = statsForLevel(1);
    await db.$transaction(async (tx) => {
        await tx.characterClass.upsert({ where: { name: hero.className }, create: { name: hero.className }, update: {} });
        // three elements, rolled once and permanent — the figurine's whole identity
        const character = await tx.character.create({
            data: {
                className: hero.className, name: hero.className, ownerId: user!.id,
                level: 1, elements: drawElements(),
            },
        });
        await tx.characterData.create({
            data: { characterId: character.id, userId: user!.id, health: base.maxHealth, energy: base.maxEnergy, ...base },
        });
    });
    const fresh = await db.user.findUnique({ where: { id: req.user.id } });
    res.send({ user: publicUser(fresh), heroes: await rosterFor(req.user.id) });
};

/**
 * Superseded by the skill tree: levels are bought node by node at POST /account/skill-tree/buy.
 * Kept as an explicit refusal rather than deleted, because letting the old flat ladder write a
 * level would contradict "level = nodes bought" and silently corrupt a figurine's progress.
 */
const levelUp: Handler = async (_req: any, res: any) => {
    res.status(410).send({ error: "USE_SKILL_TREE" });
};

const levelUpLegacy: Handler = async (req: any, res: any) => {
    const className = String(req.body.className ?? "");
    const hero = HERO_CATALOGUE.find((h) => h.className === className || h.slug === className);
    if (!hero) { res.status(400).send({ error: "UNKNOWN_HERO" }); return; }
    const character = await db.character.findFirst({ where: { ownerId: req.user.id, className: hero.className } });
    if (!character) { res.status(403).send({ error: "NOT_OWNED" }); return; }
    if (character.level >= MAX_LEVEL) { res.status(409).send({ error: "MAX_LEVEL" }); return; }

    const cost = levelCost(character.level);
    const user = await db.user.findUnique({ where: { id: req.user.id } });
    if ((user?.gold ?? 0) < cost) { res.status(402).send({ error: "NOT_ENOUGH_GOLD", need: cost, have: user?.gold ?? 0 }); return; }

    const next = statsForLevel(character.level + 1);
    await db.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user!.id }, data: { gold: { decrement: cost } } });
        await tx.character.update({ where: { id: character.id }, data: { level: { increment: 1 } } });
        await tx.characterData.updateMany({ where: { characterId: character.id, userId: user!.id }, data: next });
    });
    const fresh = await db.user.findUnique({ where: { id: req.user.id } });
    res.send({ user: publicUser(fresh), heroes: await rosterFor(req.user.id), spent: cost });
};

const changeName: Handler = async (req: any, res: any) => {
    const displayName = String(req.body.displayName ?? "").trim().slice(0, 18);
    if (displayName.length < 2) { res.status(400).send({ error: "NAME_TOO_SHORT" }); return; }
    const user = await db.user.update({ where: { id: req.user.id }, data: { displayName } });
    res.send({ user: publicUser(user) });
};

const router: Router = Router();
export default router;

router.post("/sign-up", authLimiter,
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isString().isLength({ min: 8 }).withMessage("Password too short"),
    validate, safetyNet(signUp));

router.post("/sign-in", authLimiter,
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isString().withMessage("Invalid password"),
    validate, safetyNet(signIn));

router.get("/me", apiLimiter, requireUser, safetyNet(me));
router.post("/buy-hero", apiLimiter, requireUser, body("className").isString(), validate, safetyNet(buyHero));
router.post("/level-up", apiLimiter, requireUser, body("className").isString(), validate, safetyNet(levelUp));
router.post("/change-name", apiLimiter, requireUser, body("displayName").isString(), validate, safetyNet(changeName));
router.get("/catalogue", apiLimiter, (_req, res) => res.send({ heroes: HERO_CATALOGUE.map((h) => ({ ...h, stats: statsForLevel(1) })) }));
