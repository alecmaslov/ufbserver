import db from "#db";
import { Handler, Router } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router: Router = Router();
export default router;


const getAssetsForBundleHandler: Handler = async (req, res) => {
    const {
        version
    } = req.query as { version: string };

    // // this is how it should evnetually work
    const assets = await db.bundleAsset.findMany({
        where: {
            version
        }
    });


    if (!assets) {
        res.status(404).send({ message: "Asset bundle not found" });
        return;
    }
    res.send(assets);
};

// const getAllMapsHandler: Handler = async (req, res) => {

//     const allMaps = ALL_MAPS.map(m => getMap(m));
//     res.send(ALL_MAPS.map(m => m.name));
// }


// router.get("/maps", safetyNet(getAllMapsHandler));