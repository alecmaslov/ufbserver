import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { Router } from "express";

const router = Router();

// https://api.thig.io:8080/dev/playground/
router.use("/playground", playground);
// https://api.thig.io:8080/dev/monitor/
router.use("/monitor", monitor());

export default router;