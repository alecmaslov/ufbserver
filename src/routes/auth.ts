import { Handler, Router, json } from "express";
import { body } from "express-validator";
import { createId } from "@paralleldrive/cuid2";
import { Platform } from "@prisma/client";
import { Jwt } from "#auth";
import db from "#db";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";

interface RegisterClientPayload {
    platform: Platform;
}

interface RegisterClientResponse {
    clientId: string;
}

const registerClientHandler: Handler = async (req, res) => {
    const {
        platform
    } = req.body as RegisterClientPayload;
    const newClient = await db.client.create({
        data: {
            id: createId(),
            platform
        }
    });
    const response: RegisterClientResponse = {
        clientId: newClient.id
    };
    res.send(response);
};

interface TokenRequestPayload {
    clientId: string;
}

const tokenRequestHandler: Handler = async (req, res) => {
    const {
        clientId
    } = req.body as TokenRequestPayload;
    const client = await db.client.findUnique({
        where: {
            id: clientId
        }
    });
    if (!client) {
        res.status(404).send({ message: "Client not found" });
        return;
    }
    const result = Jwt.generate({
        clientId
    });
    delete result.payload;
    res.send(result);
};

const router: Router = Router();
export default router;

router.post("/register-client",
    body("platform").isIn(Object.values(Platform)).withMessage("Invalid platform"),
    validate,
    safetyNet(registerClientHandler)
);

router.post("/token",
    body("clientId").isString().withMessage("Invalid client ID"),
    validate,
    safetyNet(tokenRequestHandler)
);