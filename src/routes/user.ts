import { Jwt } from "#auth";
import db from "#db";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import { createId } from "@paralleldrive/cuid2";
import { Platform } from "@prisma/client";
import { Handler, Router } from "express";
import { body } from "express-validator";
import bcrypt from 'bcrypt';
import { RESPONSE_TYPE } from "#shared-types";


interface TokenRequestPayload {
    clientId: string;
}

const tokenRequestHandler: Handler = async (req: any, res: any) => {
    console.log("tokey request handler")
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

const validateTokenHandler: Handler = async (req: any, res: any) => {
    const {
        token
    } = req.body as { token: string };
    const result = Jwt.verify(token);

    if (!result) {
        res.status(401).send({ message: "Invalid token" });
        return;
    }

    res.send({ clientId: result.sub });
}

interface RegisterUserPayload {
    email: string;
    password: string;
    deviceId: string;
    profileImageUrl: string;
    // passwordHash: string;
}

interface SignInUserPayload {
    email: string,
    password: string
}

interface RegisterUserResponse {
    clientId: string;
    error: string;
}

interface SignInUserResponse {
    clientId: string,
    error: string
}

const registerUserHandler: Handler = async (req: any, res: any) => {
    const {
        email,
        password,
        deviceId
    } = req.body as RegisterUserPayload;

    const existClient = await db.user.findUnique({
        where: {
            email: email
        }
    });

    console.log(existClient)

    if (existClient != null) {
        const response: RegisterUserResponse = {
            clientId: '-1',
            error: RESPONSE_TYPE.ALREADY_EXIST
        };
        res.send(response);
        return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);


    const newClient = await db.user.create({
        data: {
            id: createId(),
            email,
            profileImageUrl: "",
            passwordHash: hashedPassword,
            displayName: ""
        }
    });
    const response: RegisterUserResponse = {
        clientId: newClient.id,
        error: RESPONSE_TYPE.SUCCESS
    };
    res.send(response);
};

const signInUserHandler: Handler = async (req: any, res: any) => {

    const { email, password } = req.body as SignInUserPayload;

    console.log("sigin api", email, password);

    const existClient = await db.user.findUnique({
        where: {
            email: email
        }
    });

    if (existClient == null) {
        const response: SignInUserResponse = {
            clientId: 'sdaf',
            error: RESPONSE_TYPE.NOT_EXIST
        };
        res.send(response);
        return;
    }

    if (bcrypt.compareSync(password, existClient.passwordHash)) {
        const response: RegisterUserResponse = {
            clientId: existClient.id,
            error: RESPONSE_TYPE.SUCCESS
        };
        res.send(response);
    } else {
        const response: RegisterUserResponse = {
            clientId: "newClient.id",
            error: RESPONSE_TYPE.WRONG_PASSWORD
        };
        res.send(response);
    }
}


const router: Router = Router();
export default router;

router.post("/sign-up",
    body("email").isString().withMessage("Invalid mail"),
    body("password").isString().withMessage("Invalid password"),
    validate,
    safetyNet(registerUserHandler)
);

router.post("/sign-in",
    body("email").isString().withMessage("Invalid mail"),
    body("password").isString().withMessage("Invalid password"),
    validate,
    safetyNet(signInUserHandler)
);

// @kyle: Adding an endpoint to validate token, so if a client has a token
// already stored in local storage, it can be checked for validity. This also sends back the clientId
// if its not needed/redundant, let me know
router.post("/forgot-password",
    body("token").isString().withMessage("Invalid token"),
    validate,
    safetyNet(validateTokenHandler)
)