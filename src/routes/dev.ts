import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

// ufb-playground is a fork of @colyseus/playground cloned locally
// but it's not working...
// import { playground } from "ufb-playground";
// import { playground } from "ufb-playground/build/index";

import { matchMaker } from "@colyseus/core";
import { Router } from "express";
import { RoomCache } from "#game/RoomCache";

const router = Router();

// https://api.thig.io:8080/dev/playground/
router.use("/playground", playground);
// https://api.thig.io:8080/dev/monitor/
router.use("/monitor", monitor());

/** 
 * convert a schema object to a vanilla object (recursively)
 */
function convertToVanilla(obj: any): any {
    // Base cases
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        return obj;
    }

    if (obj.__proto__.constructor.name === "MapSchema") {
        const result: Record<string, any> = {};
        for (const [key, value] of obj.entries()) {
            result[key] = convertToVanilla(value);
        }
        return result;
    }

    if (obj.__proto__.constructor.name === "ArraySchema") {
        const result: any[] = [];
        for (const value of obj) {
            result.push(convertToVanilla(value));
        }
        return result;
    }

    // instances of classes which inherit from Schema
    // can be converted to simple objects by iterating over their keys
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
        result[key] = convertToVanilla(obj[key]);
    }

    return result;
}

router.get("/inspect-room/:roomId", async (req, res) => {
    const {
        roomId,
    } = req.params;
    const roomListingData = await matchMaker.driver.findOne({
        roomId,
    });
    const room = RoomCache.get(roomId);
    if (!room) {
        res.send({
            roomListingData,
            state: null,
        });
        return;
    }
    res.send({
        roomListingData,
        state: convertToVanilla(room.state),
    })
});

export default router;