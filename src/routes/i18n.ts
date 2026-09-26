/**
 * Language events from the web client's language menu (easteregg.fun client/src/lang.ts).
 *
 * The browser sends them with navigator.sendBeacon, which posts text/plain, so this route parses its
 * own body. Nothing identifying is stored: no IP, no account — just a random per-browser id, so the
 * admin can count people rather than clicks. See the privacy policy, section 2 "Language choice".
 */
import db from "#db";
import { Router, text } from "express";
import rateLimit from "express-rate-limit";

const LANG = /^(en|ja|es|fr|de|ru|zh|ko|ar|pt)$/;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);

const limiter = rateLimit({
    windowMs: 60 * 1000, limit: 30,
    standardHeaders: "draft-7", legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS" },
});

const router: Router = Router();
export default router;

router.post("/event", limiter, text({ type: () => true, limit: "2kb" }), async (req, res) => {
    let e: any;
    try { e = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { res.status(400).end(); return; }
    const type = e?.type === "switch" || e?.type === "view" ? e.type : null;
    const vid = clip(e?.vid, 64);
    if (!type || !vid || !LANG.test(e?.lang ?? "")) { res.status(400).end(); return; }
    if (type === "switch" && !(LANG.test(e?.from ?? "") && LANG.test(e?.to ?? ""))) { res.status(400).end(); return; }
    try {
        await db.langEvent.create({
            data: {
                type, vid, lang: e.lang,
                fromLang: type === "switch" ? e.from : null,
                toLang: type === "switch" ? e.to : null,
                source: e.source === "menu" || e.source === "offer" ? e.source : null,
                path: clip(e.path, 191) ?? "/",
                browser: clip(e.browser, 32),
            },
        });
    } catch (err) {
        console.error("i18n event", err);
    }
    res.status(204).end();
});
