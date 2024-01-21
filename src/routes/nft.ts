import db from "#db";
import { Handler, Router } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { query } from "express-validator";
import { validate } from "#middleware/validate";

const router: Router = Router();
export default router;

const handleGetGodLevelNftsParams: Handler = async (req, res) => {
    try {
        const { names } = req.params;

        const godLevels = await db.godLevelNft.findMany({
            where: {
                characterClassName: {
                    in: names.split(","),
                },
            },
            select: {
                characterClass: true,
                nft: true,
            },
        });

        const transformed = godLevels.map((gl) => {
            return {
                ...gl.characterClass,
                nft: gl.nft,
            };
        });
        res.send(transformed);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

const handleGetAllGodLevelNfts: Handler = async (req, res) => {
    try {
        const godLevels = await db.godLevelNft.findMany({
            where: {
                isPublished: true, // eventually add includeUnpublished
            },
            select: {
                characterClass: true,
                nft: true,
            },
        });

        const transformed = godLevels.map((gl) => {
            return {
                ...gl.characterClass,
                nft: gl.nft,
            };
        });
        res.send(transformed);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

router.get(
    "/god-levels",
    query("includeUnpublished") // TODO - add authentication to includeUnpublished
        .optional({ nullable: true, checkFalsy: true })
        .isBoolean()
        .toBoolean(),
    handleGetAllGodLevelNfts
);

router.get("/god-levels/:names", validate, handleGetGodLevelNftsParams);
