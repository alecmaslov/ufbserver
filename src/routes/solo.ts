/**
 * The saved solo run for the web client's home screen ("Continue"): look it up or discard it.
 * Owner is the guest "web-…" id, or an account id, which requires that account's session token.
 */
import { UserJwt } from "#auth";
import { discardSolo, soloSummary } from "#game/solo-save";
import { safetyNet } from "#middleware/safetyNet";
import { Handler, Router } from "express";
import rateLimit from "express-rate-limit";

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false });

/** The owner id a request may act for, or null. */
function owner(req: any): string | null {
    const id = String(req.params.ownerId ?? "");
    if (!id || id.length > 64) return null;
    if (id.startsWith("web-")) return id;
    const header = String(req.headers.authorization ?? "");
    return UserJwt.userId(header.startsWith("Bearer ") ? header.slice(7) : null) === id ? id : null;
}

const get: Handler = async (req, res) => {
    const id = owner(req); if (!id) { res.status(403).send({ error: "FORBIDDEN" }); return; }
    res.send({ save: await soloSummary(id) });
};
const remove: Handler = async (req, res) => {
    const id = owner(req); if (!id) { res.status(403).send({ error: "FORBIDDEN" }); return; }
    await discardSolo(id);
    res.send({ ok: true });
};

const router: Router = Router();
router.get("/:ownerId", limiter, safetyNet(get));
router.delete("/:ownerId", limiter, safetyNet(remove));
export default router;
