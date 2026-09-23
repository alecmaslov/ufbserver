/**
 * Skill trees: read a figurine's tree, and buy a node on it.
 *
 * Server-authoritative throughout. The client sends which node it wants and nothing else — the
 * price comes from the ladder in #game/skill-tree, the legality comes from the tree's own edges,
 * and both the gold decrement and the ledger row land in one transaction so a purchase can never
 * half-happen. The client is never trusted for a cost, a level or an element.
 */
import db from "#db";
import {
    canBuy, buyable, costOf, drawElements, effectsFor, ElementSlug,
    legalDraw, levelFor, MAX_LEVEL, NODES_PER_TREE, treeFor,
} from "#game/skill-tree";
import { requireUser } from "#middleware/requireUser";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import { HERO_CATALOGUE } from "#routes/account";
import { Handler, Router } from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, limit: 120,
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS" },
});

const heroOf = (name: string) =>
    HERO_CATALOGUE.find((h) => h.className === name || h.slug === name);

/** The three elements on a figurine, or null if it predates the skill trees. */
export function elementsOf(character: { elements: unknown }): ElementSlug[] | null {
    const els = character.elements as ElementSlug[] | null;
    return Array.isArray(els) && legalDraw(els) ? els : null;
}

/** Everything the tree screen needs for one figurine. */
async function stateFor(userId: string, characterId: string, elements: ElementSlug[]) {
    const rows = await db.characterSkill.findMany({
        where: { characterId },
        orderBy: { purchasedAt: "asc" },
    });
    const slots = elements.map((element, slot) => {
        const owned = rows.filter((r) => r.slot === slot).map((r) => r.nodeIndex);
        return {
            slot, element,
            owned,
            buyable: buyable(element, owned),
            nextCost: owned.length < NODES_PER_TREE ? costOf(owned.length) : null,
            spent: rows.filter((r) => r.slot === slot).reduce((s, r) => s + r.cost, 0),
        };
    });
    const user = await db.user.findUnique({ where: { id: userId } });
    return {
        elements,
        slots,
        level: levelFor(rows.length),
        maxLevel: MAX_LEVEL,
        purchases: rows.length,
        effects: effectsFor(rows.map((r) => ({ element: r.element as ElementSlug, nodeIndex: r.nodeIndex }))),
        gold: user?.gold ?? 0,
        crystals: user?.crystals ?? 0,
    };
}

const read: Handler = async (req: any, res: any) => {
    const hero = heroOf(String(req.params.className ?? ""));
    if (!hero) { res.status(400).send({ error: "UNKNOWN_HERO" }); return; }
    const character = await db.character.findFirst({
        where: { ownerId: req.user.id, className: hero.className },
    });
    if (!character) { res.status(403).send({ error: "NOT_OWNED" }); return; }
    const elements = elementsOf(character);
    if (!elements) { res.status(409).send({ error: "NO_ELEMENTS" }); return; }
    res.send(await stateFor(req.user.id, character.id, elements));
};

const buy: Handler = async (req: any, res: any) => {
    const hero = heroOf(String(req.body.className ?? ""));
    const slot = Number(req.body.slot);
    const nodeIndex = Number(req.body.nodeIndex);
    if (!hero) { res.status(400).send({ error: "UNKNOWN_HERO" }); return; }
    if (![0, 1, 2].includes(slot)) { res.status(400).send({ error: "BAD_SLOT" }); return; }

    const character = await db.character.findFirst({
        where: { ownerId: req.user.id, className: hero.className },
    });
    if (!character) { res.status(403).send({ error: "NOT_OWNED" }); return; }
    const elements = elementsOf(character);
    if (!elements) { res.status(409).send({ error: "NO_ELEMENTS" }); return; }

    const element = elements[slot];
    const rows = await db.characterSkill.findMany({ where: { characterId: character.id } });
    const owned = rows.filter((r) => r.slot === slot).map((r) => r.nodeIndex);
    if (owned.length >= NODES_PER_TREE) { res.status(409).send({ error: "TREE_COMPLETE" }); return; }
    if (!canBuy(element, owned, nodeIndex)) { res.status(409).send({ error: "NODE_LOCKED" }); return; }

    const cost = costOf(owned.length)!;
    const user = await db.user.findUnique({ where: { id: req.user.id } });
    if ((user?.gold ?? 0) < cost) {
        res.status(402).send({ error: "NOT_ENOUGH_GOLD", need: cost, have: user?.gold ?? 0 });
        return;
    }

    await db.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user!.id }, data: { gold: { decrement: cost } } });
        await tx.characterSkill.create({
            data: { characterId: character.id, element, slot, nodeIndex, cost },
        });
        await tx.character.update({
            where: { id: character.id },
            data: { level: levelFor(rows.length + 1) },
        });
    });

    const node = treeFor(element).nodes[nodeIndex];
    res.send({ ...(await stateFor(req.user.id, character.id, elements)), spent: cost, bought: { slot, element, nodeIndex, type: node.type } });
};

/** The layouts themselves, so the client can render without shipping its own copy out of sync. */
const layout: Handler = async (_req: any, res: any) => {
    const { trees } = await import("#game/skill-tree");
    res.send({ trees: trees(), costs: (await import("#game/skill-tree")).COSTS });
};

const router: Router = Router();
export default router;

router.get("/layout", apiLimiter, safetyNet(layout));
router.get("/:className", apiLimiter, requireUser, safetyNet(read));
router.post("/buy", apiLimiter, requireUser,
    body("className").isString(),
    body("slot").isInt({ min: 0, max: 2 }),
    body("nodeIndex").isInt({ min: 0, max: NODES_PER_TREE - 1 }),
    validate, safetyNet(buy));

export { drawElements };
