import { Jwt } from "#auth";
import db from "#db";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import { createId } from "@paralleldrive/cuid2";
import { Platform } from "@prisma/client";
import { Handler, Router } from "express";
import { body } from "express-validator";

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

const validateTokenHandler: Handler = async (req, res) => {
    const {
        token
    } = req.body as { token: string };
    const result = Jwt.verify(token);

    if (!result) {
        res.status(401).send({ message: "Invalid token" });
        return;
    }

    res.send({clientId: result.sub});
}

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

// @kyle: Adding an endpoint to validate token, so if a client has a token
// already stored in local storage, it can be checked for validity. This also sends back the clientId
// if its not needed/redundant, let me know
router.post("/validate-token",
    body("token").isString().withMessage("Invalid token"),
    validate,
    safetyNet(validateTokenHandler)
)