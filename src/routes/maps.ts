import express, { Handler, Router, json } from "express";
import { body, query } from "express-validator";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import db from "#db";

const router: Router = Router();
export default router;

const handleListMaps: Handler = async (req, res) => {
    const { limit, offset, publisher } = req.query;
    
    const maps = await db.ufbMap.findMany({
        where: {
            publisher: publisher as string,
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
    });

    res.send({
        maps,
    });
};

router.get(
    "/list",
    query("limit").isInt({ min: 1, max: 100 }).toInt().default(100),
    query("offset").isInt({ min: 0 }).toInt().default(0),
    query("publisher").isString().default("ufb"),
    validate,
    safetyNet(handleListMaps)
);
