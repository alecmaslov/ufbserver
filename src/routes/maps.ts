import db from "#db";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import { Handler, Router } from "express";
import { query } from "express-validator";

const router: Router = Router();
export default router;

const handleListMaps: Handler = async (req: any, res: any) => {
    let { limit, offset, publisher } = req.query;
    let includeUnpublished = req.query.includeUnpublished === "true";

    if (publisher === undefined || publisher === null) {
        publisher = "ufb";
    }

    if (limit === undefined || limit === null) {
        limit = "100";
    }

    if (offset === undefined || offset === null) {
        offset = "0";
    }

    const maps = await db.ufbMap.findMany({
        where: {
            publisher: publisher as string,
            isPublished: !includeUnpublished,
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
    });

    res.send({
        maps,
    });
};

const handleGetMapById: Handler = async (req: any, res: any) => {
    const { mapId } = req.params;
    const map = await db.ufbMap.findUnique({
        where: {
            id: mapId,
        },
    });
    res.send(map);
};

router.get(
    "/list",
    query("limit")
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1, max: 100 })
        .customSanitizer((value) => (value !== undefined ? value : 100))
        .toInt(),
    query("offset")
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0 })
        .customSanitizer((value) => (value !== undefined ? value : 0))
        .toInt(),
    query("publisher").optional().isString().default("ufb"),
    query("includeUnpublished").default(false).isBoolean().toBoolean(),
    validate,
    safetyNet(handleListMaps)
);

router.get(
    "/tiles",
    query("mapId").isString(),
    query("adjacencies").optional().isBoolean().toBoolean().default(false),
    validate,
    async (req: any, res: any) => {
        const { mapId, adjacencies } = req.query;
        const map = await db.ufbMap.findUnique({
            where: {
                id: mapId as string,
            },
            include: {
                tiles: {
                    include: {
                        fromTileAdjacencies: adjacencies,
                    },
                },
            },
        });
        res.send(map.tiles);
    }
);

router.post("/foo", (req: any, res: any) => {
    res.send("bar");
});

router.get("/:mapId", safetyNet(handleGetMapById));

router.get(
    "/",
    query("name").optional().isString(),
    query("size").optional().isString(),
    query("publisher").optional().isString(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt().default(100),
    query("offset").optional().isInt({ min: 0 }).toInt().default(0),
    validate,
    async (req: any, res: any) => {
        const filters = {
            name: req.query.name,
            size: req.query.size,
            publisher: req.query.publisher,
        };

        const maps = await db.ufbMap.findMany({
            where: filters,
            take: req.query.limit,
            skip: req.query.offset,
        });

        res.send({ maps });
    }
);
