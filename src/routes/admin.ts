/**
 * Admin API for easteregg.fun/admin: figurine inventory, sales, accounts, game and language stats.
 *
 * Two locks, both required:
 *  1. Nginx puts HTTP basic auth on /admin/ and /game/admin/ (the same login as thig.io/dashboard).
 *  2. For /game/admin/ only, Nginx adds `X-Ufb-Admin: <ADMIN_PROXY_SECRET>`, and it clears that
 *     header on every other /game/ request. This router refuses anything without the secret, so a
 *     mistake in the Nginx config fails closed instead of opening the admin to the internet.
 *
 * Claim codes are shown exactly once, in the response that creates them — only their hash is kept
 * (see routes/figurine.ts). Everything else here is ordinary reads and writes.
 */
import db from "#db";
import { HERO_CATALOGUE } from "#routes/account";
import { hashCode, makeClaimCode } from "#routes/figurine";
import { safetyNet } from "#middleware/safetyNet";
import { Prisma } from "@prisma/client";
import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response, Router } from "express";

const SECRET = process.env.ADMIN_PROXY_SECRET ?? "";
export const FIGURINE_STATUS = ["in_stock", "reserved", "sold", "shipped", "returned", "lost", "retired"] as const;
const CLAIM_URL = "https://easteregg.fun/account/?claim=";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const got = Buffer.from(String(req.headers["x-ufb-admin"] ?? ""));
    const want = Buffer.from(SECRET);
    if (!SECRET || got.length !== want.length || !timingSafeEqual(got, want)) {
        res.status(404).send({ error: "NOT_FOUND" });
        return;
    }
    next();
}

const str = (v: unknown, max = 191) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const int = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
const date = (v: unknown) => { if (!v) return null; const d = new Date(String(v)); return isNaN(+d) ? null : d; };
const since = (req: Request) => {
    const days = Math.min(3650, Math.max(1, Number(req.query.days) || 30));
    return new Date(Date.now() - days * 86400e3);
};
/** BigInt from COUNT(*) etc. doesn't survive JSON. */
const plain = (rows: any[]) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v])));

const router: Router = Router();
export default router;
router.use(requireAdmin);

// ─── overview ────────────────────────────────────────────────────────────────────────────────
router.get("/overview", safetyNet(async (_req, res) => {
    const week = new Date(Date.now() - 7 * 86400e3);
    const [byStatus, claimed, sales, revenue, users, matches7, players7, switches7] = await Promise.all([
        db.figurine.groupBy({ by: ["className", "status"], _count: { _all: true } }),
        db.figurine.count({ where: { ownerId: { not: null } } }),
        db.sale.count(),
        db.sale.groupBy({ by: ["currency"], _sum: { totalCents: true } }),
        db.user.count(),
        db.matchRecord.count({ where: { startedAt: { gte: week } } }),
        db.matchPlayer.findMany({ where: { joinedAt: { gte: week } }, select: { playerId: true }, distinct: ["playerId"] }),
        db.langEvent.count({ where: { type: "switch", createdAt: { gte: week } } }),
    ]);
    res.send({
        heroes: HERO_CATALOGUE.map((h) => h.className),
        statuses: FIGURINE_STATUS,
        figurines: byStatus.map((r) => ({ className: r.className, status: r.status, count: r._count._all })),
        claimed, sales,
        revenue: revenue.map((r) => ({ currency: r.currency, cents: r._sum.totalCents ?? 0 })),
        users, matches7, players7: players7.length, switches7,
    });
}));

// ─── figurines ───────────────────────────────────────────────────────────────────────────────
router.get("/figurines", safetyNet(async (req, res) => {
    const where: Prisma.FigurineWhereInput = {};
    if (str(req.query.status)) where.status = str(req.query.status)!;
    if (str(req.query.hero)) where.className = str(req.query.hero)!;
    const q = str(req.query.q);
    if (q) where.OR = [
        { id: { contains: q } }, { batch: { contains: q } }, { nfcUid: { contains: q } },
        { owner: { email: { contains: q } } }, { owner: { displayName: { contains: q } } },
        { sale: { buyerName: { contains: q } } }, { sale: { buyerEmail: { contains: q } } }, { sale: { orderRef: { contains: q } } },
    ];
    const rows = await db.figurine.findMany({
        where, orderBy: [{ className: "asc" }, { id: "asc" }], take: 2000,
        include: {
            owner: { select: { id: true, email: true, displayName: true } },
            character: { select: { level: true, elements: true } },
            sale: { select: { id: true, buyerName: true, buyerEmail: true, orderRef: true, channel: true, soldAt: true, shippedAt: true } },
        },
    });
    res.send({ figurines: rows.map(({ claimHash, ...f }) => f) });
}));

/** Mint a batch. The response is the only time the codes exist in readable form. */
router.post("/figurines/mint", safetyNet(async (req, res) => {
    const hero = HERO_CATALOGUE.find((h) => h.className === req.body.className || h.slug === req.body.className);
    const count = int(req.body.count) ?? 0;
    if (!hero || count < 1 || count > 1000) { res.status(400).send({ error: "BAD_REQUEST", detail: "hero and 1–1000 count" }); return; }
    const batch = str(req.body.batch);
    const out: { id: string; className: string; code: string; claimUrl: string }[] = [];
    await db.$transaction(async (tx) => {
        // continue the serial numbering the mint job uses: <slug>-00001
        const last = await tx.figurine.findMany({ where: { id: { startsWith: `${hero.slug}-` } }, select: { id: true } });
        let n = last.reduce((m, f) => Math.max(m, Number(f.id.split("-").pop()) || 0), 0);
        for (let i = 0; i < count; i++) {
            const code = makeClaimCode();
            const id = `${hero.slug}-${String(++n).padStart(5, "0")}`;
            await tx.figurine.create({ data: { id, className: hero.className, claimHash: hashCode(code), batch } });
            out.push({ id, className: hero.className, code, claimUrl: CLAIM_URL + code });
        }
    });
    console.log(`admin: minted ${count} ${hero.className}${batch ? ` (${batch})` : ""}`);
    res.send({ minted: out });
}));

router.patch("/figurines/:id", safetyNet(async (req, res) => {
    const data: Prisma.FigurineUpdateInput = {};
    if ("status" in req.body) {
        if (!FIGURINE_STATUS.includes(req.body.status)) { res.status(400).send({ error: "BAD_STATUS" }); return; }
        data.status = req.body.status;
    }
    if ("batch" in req.body) data.batch = str(req.body.batch);
    if ("notes" in req.body) data.notes = str(req.body.notes, 5000);
    if ("nfcUid" in req.body) data.nfcUid = str(req.body.nfcUid, 64);
    if ("saleId" in req.body) data.sale = req.body.saleId ? { connect: { id: String(req.body.saleId) } } : { disconnect: true };
    try {
        const f = await db.figurine.update({ where: { id: req.params.id }, data });
        const { claimHash, ...rest } = f;
        res.send({ figurine: rest });
    } catch (e: any) {
        if (e?.code === "P2002") { res.status(409).send({ error: "NFC_UID_IN_USE" }); return; }
        if (e?.code === "P2025") { res.status(404).send({ error: "NOT_FOUND" }); return; }
        throw e;
    }
}));

/** New code for a figurine whose box card was lost or leaked. The old code stops working. */
router.post("/figurines/:id/new-code", safetyNet(async (req, res) => {
    const code = makeClaimCode();
    const f = await db.figurine.update({ where: { id: req.params.id }, data: { claimHash: hashCode(code) } }).catch(() => null);
    if (!f) { res.status(404).send({ error: "NOT_FOUND" }); return; }
    console.log(`admin: new claim code for ${f.id}`);
    res.send({ id: f.id, code, claimUrl: CLAIM_URL + code });
}));

/** Take a figurine off an account (refund, fraud, support). Its hero and tree stay with the figurine. */
router.post("/figurines/:id/unclaim", safetyNet(async (req, res) => {
    const f = await db.figurine.findUnique({ where: { id: req.params.id } });
    if (!f) { res.status(404).send({ error: "NOT_FOUND" }); return; }
    await db.$transaction(async (tx) => {
        if (f.characterId) await tx.character.update({ where: { id: f.characterId }, data: { ownerId: null } });
        await tx.figurine.update({ where: { id: f.id }, data: { ownerId: null, claimedAt: null } });
    });
    console.log(`admin: unclaimed ${f.id} from ${f.ownerId}`);
    res.send({ unclaimed: f.id });
}));

// ─── sales ───────────────────────────────────────────────────────────────────────────────────
router.get("/sales", safetyNet(async (_req, res) => {
    const sales = await db.sale.findMany({
        orderBy: { soldAt: "desc" }, take: 1000,
        include: { figurines: { select: { id: true, className: true, status: true, ownerId: true, owner: { select: { email: true, displayName: true } } } } },
    });
    res.send({ sales });
}));

function saleFields(b: any) {
    return {
        channel: str(b.channel, 64) ?? "manual",
        orderRef: str(b.orderRef),
        buyerName: str(b.buyerName),
        buyerEmail: str(b.buyerEmail),
        shipTo: str(b.shipTo, 2000),
        totalCents: int(b.totalCents),
        currency: (str(b.currency, 3) ?? "USD").toUpperCase(),
        soldAt: date(b.soldAt) ?? new Date(),
        shippedAt: date(b.shippedAt),
        notes: str(b.notes, 5000),
    };
}

/** Record a sale and attach figurines to it (they become "sold", or "shipped" if shippedAt is set). */
router.post("/sales", safetyNet(async (req, res) => {
    const ids: string[] = Array.isArray(req.body.figurineIds) ? req.body.figurineIds.map(String) : [];
    const fields = saleFields(req.body);
    try {
        const sale = await db.$transaction(async (tx) => {
            const taken = await tx.figurine.findMany({ where: { id: { in: ids }, saleId: { not: null } }, select: { id: true } });
            if (taken.length) throw Object.assign(new Error("taken"), { taken: taken.map((t) => t.id) });
            const s = await tx.sale.create({ data: fields });
            if (ids.length) await tx.figurine.updateMany({
                where: { id: { in: ids } }, data: { saleId: s.id, status: fields.shippedAt ? "shipped" : "sold" },
            });
            return s;
        });
        res.send({ sale });
    } catch (e: any) {
        if (e?.taken) { res.status(409).send({ error: "ALREADY_SOLD", figurines: e.taken }); return; }
        if (e?.code === "P2002") { res.status(409).send({ error: "ORDER_EXISTS" }); return; }
        throw e;
    }
}));

router.patch("/sales/:id", safetyNet(async (req, res) => {
    const f = saleFields({ ...req.body });
    const data: Prisma.SaleUpdateInput = {};
    for (const k of Object.keys(f) as (keyof typeof f)[]) if (k in req.body) (data as any)[k] = f[k];
    const sale = await db.sale.update({ where: { id: req.params.id }, data }).catch(() => null);
    if (!sale) { res.status(404).send({ error: "NOT_FOUND" }); return; }
    // shipping a sale ships its figurines (unless one was since marked returned/lost)
    if ("shippedAt" in req.body) await db.figurine.updateMany({
        where: { saleId: sale.id, status: { in: ["sold", "shipped"] } },
        data: { status: sale.shippedAt ? "shipped" : "sold" },
    });
    res.send({ sale });
}));

// ─── accounts ────────────────────────────────────────────────────────────────────────────────
router.get("/accounts", safetyNet(async (req, res) => {
    const q = str(req.query.q);
    const users = await db.user.findMany({
        where: q ? { OR: [{ email: { contains: q } }, { displayName: { contains: q } }, { id: q }] } : {},
        orderBy: { createdAt: "desc" }, take: 500,
        select: {
            id: true, email: true, displayName: true, gold: true, createdAt: true,
            userData: { select: { battles: true, wins: true, losses: true } },
            figurines: { select: { id: true, className: true, claimedAt: true } },
            character: { select: { className: true, level: true } },
        },
    });
    res.send({ users });
}));

// ─── game stats ──────────────────────────────────────────────────────────────────────────────
router.get("/stats", safetyNet(async (req, res) => {
    const from = since(req);
    const mode = req.query.mode === "solo" || req.query.mode === "party" ? String(req.query.mode) : null;
    const modeSql = mode ? Prisma.sql`AND m.mode = ${mode}` : Prisma.empty;

    const [perDay, matches, heroes, killers, levels, langs, players] = await Promise.all([
        db.$queryRaw<any[]>`SELECT DATE(m.startedAt) AS day, COUNT(*) AS matches, COUNT(DISTINCT p.playerId) AS players
            FROM match_record m LEFT JOIN match_player p ON p.matchId = m.id
            WHERE m.startedAt >= ${from} ${modeSql} GROUP BY day ORDER BY day`,
        db.$queryRaw<any[]>`SELECT m.mode, m.mapName, m.endReason, COUNT(*) AS n,
                AVG(m.turns) AS avgTurns, AVG(m.rounds) AS avgRounds,
                AVG(TIMESTAMPDIFF(SECOND, m.startedAt, m.endedAt)) AS avgSeconds
            FROM match_record m WHERE m.startedAt >= ${from} ${modeSql}
            GROUP BY m.mode, m.mapName, m.endReason`,
        db.$queryRaw<any[]>`SELECT p.heroClass, COUNT(*) AS picks,
                SUM(p.result = 'win') AS wins, SUM(p.result = 'died') AS deaths,
                SUM(p.result = 'quit') AS quits, SUM(p.result = 'unfinished' OR p.result IS NULL) AS unfinished,
                AVG(p.place) AS avgPlace, AVG(p.damageDealt) AS avgDealt, AVG(p.damageTaken) AS avgTaken,
                AVG(p.healed) AS avgHealed, AVG(p.tilesMoved) AS avgTiles, AVG(p.goldEarned) AS avgGold,
                AVG(p.monsterKills) AS avgMonsterKills, AVG(p.playerKills) AS avgPlayerKills,
                AVG(p.turnsPlayed) AS avgRounds, AVG(p.diedTurn) AS avgDiedTurn
            FROM match_player p JOIN match_record m ON m.id = p.matchId
            WHERE m.startedAt >= ${from} ${modeSql} GROUP BY p.heroClass ORDER BY picks DESC`,
        db.$queryRaw<any[]>`SELECT COALESCE(p.killedBy, '?') AS killedBy, COUNT(*) AS n
            FROM match_player p JOIN match_record m ON m.id = p.matchId
            WHERE m.startedAt >= ${from} ${modeSql} AND p.result = 'died' GROUP BY killedBy ORDER BY n DESC`,
        db.$queryRaw<any[]>`SELECT p.heroLevel, COUNT(*) AS n, SUM(p.result = 'win') AS wins
            FROM match_player p JOIN match_record m ON m.id = p.matchId
            WHERE m.startedAt >= ${from} ${modeSql} GROUP BY p.heroLevel ORDER BY p.heroLevel`,
        db.$queryRaw<any[]>`SELECT COALESCE(p.lang, '?') AS lang, COUNT(*) AS n, COUNT(DISTINCT p.playerId) AS players
            FROM match_player p JOIN match_record m ON m.id = p.matchId
            WHERE m.startedAt >= ${from} ${modeSql} GROUP BY lang ORDER BY n DESC`,
        db.matchPlayer.findMany({
            where: { match: { startedAt: { gte: from }, ...(mode ? { mode } : {}) } },
            select: { heroClass: true, moves: true, equipped: true, result: true, isGuest: true },
        }),
    ]);

    // move usage: summed from the per-player JSON, split by hero, with win share of the users
    const moves: Record<string, { uses: number; players: number; wins: number; heroes: Record<string, number> }> = {};
    const equipped: Record<string, { n: number; wins: number }> = {};
    let guests = 0;
    for (const p of players) {
        if (p.isGuest) guests++;
        for (const [name, n] of Object.entries((p.moves ?? {}) as Record<string, number>)) {
            const m = (moves[name] ??= { uses: 0, players: 0, wins: 0, heroes: {} });
            m.uses += n; m.players++; if (p.result === "win") m.wins++;
            m.heroes[p.heroClass] = (m.heroes[p.heroClass] ?? 0) + n;
        }
        for (const name of (p.equipped ?? []) as string[]) {
            const e = (equipped[name] ??= { n: 0, wins: 0 });
            e.n++; if (p.result === "win") e.wins++;
        }
    }

    res.send({
        from, mode,
        perDay: plain(perDay), matches: plain(matches), heroes: plain(heroes), killers: plain(killers),
        levels: plain(levels), langs: plain(langs),
        players: players.length, guests,
        moves: Object.entries(moves).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.uses - a.uses),
        equipped: Object.entries(equipped).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.n - a.n),
    });
}));

/** Recent matches, newest first, with their heroes — for reading individual games. */
router.get("/matches", safetyNet(async (req, res) => {
    const matches = await db.matchRecord.findMany({
        where: { startedAt: { gte: since(req) } }, orderBy: { startedAt: "desc" }, take: 200,
        include: { players: { orderBy: { place: "asc" } } },
    });
    res.send({ matches });
}));

// ─── languages ───────────────────────────────────────────────────────────────────────────────
router.get("/languages", safetyNet(async (req, res) => {
    const from = since(req);
    const [switches, switchPeople, sources, views, perDay, browserVsChosen, paths] = await Promise.all([
        db.$queryRaw<any[]>`SELECT toLang, COUNT(*) AS n FROM lang_event WHERE type = 'switch' AND createdAt >= ${from} GROUP BY toLang ORDER BY n DESC`,
        db.$queryRaw<any[]>`SELECT toLang, COUNT(DISTINCT vid) AS people FROM lang_event WHERE type = 'switch' AND createdAt >= ${from} GROUP BY toLang ORDER BY people DESC`,
        db.$queryRaw<any[]>`SELECT COALESCE(source, '?') AS source, toLang, COUNT(*) AS n FROM lang_event WHERE type = 'switch' AND createdAt >= ${from} GROUP BY source, toLang`,
        db.$queryRaw<any[]>`SELECT lang, COUNT(DISTINCT vid) AS people, COUNT(*) AS days FROM lang_event WHERE type = 'view' AND createdAt >= ${from} GROUP BY lang ORDER BY people DESC`,
        db.$queryRaw<any[]>`SELECT DATE(createdAt) AS day, lang, COUNT(DISTINCT vid) AS people FROM lang_event WHERE type = 'view' AND createdAt >= ${from} GROUP BY day, lang ORDER BY day`,
        db.$queryRaw<any[]>`SELECT LEFT(COALESCE(browser, '?'), 2) AS browser, toLang, COUNT(DISTINCT vid) AS people FROM lang_event WHERE type = 'switch' AND createdAt >= ${from} GROUP BY browser, toLang ORDER BY people DESC LIMIT 50`,
        db.$queryRaw<any[]>`SELECT path, COUNT(*) AS n FROM lang_event WHERE type = 'switch' AND createdAt >= ${from} GROUP BY path ORDER BY n DESC LIMIT 20`,
    ]);
    const totalPeople = await db.$queryRaw<any[]>`SELECT COUNT(DISTINCT vid) AS people FROM lang_event WHERE createdAt >= ${from}`;
    const switchedPeople = await db.$queryRaw<any[]>`SELECT COUNT(DISTINCT vid) AS people FROM lang_event WHERE type = 'switch' AND createdAt >= ${from}`;
    res.send({
        from,
        people: Number(totalPeople[0]?.people ?? 0), switchedPeople: Number(switchedPeople[0]?.people ?? 0),
        switches: plain(switches), switchPeople: plain(switchPeople), sources: plain(sources),
        views: plain(views), perDay: plain(perDay), browserVsChosen: plain(browserVsChosen), paths: plain(paths),
    });
}));
