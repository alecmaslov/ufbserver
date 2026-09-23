import { UserJwt } from "#auth";
import db from "#db";
import { Handler } from "express";

/** Reads the account session from `Authorization: Bearer <token>` and puts the user on req.user. */
export const requireUser: Handler = async (req: any, res, next) => {
    const header = String(req.headers.authorization ?? "");
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const userId = UserJwt.userId(token);
    if (!userId) {
        res.status(401).send({ error: "NOT_SIGNED_IN" });
        return;
    }
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(401).send({ error: "NOT_SIGNED_IN" });
        return;
    }
    req.user = user;
    next();
};
