import express, { json, Handler, Request, Response, NextFunction } from "express";
import https from "https";
import { readFileSync } from "fs";
import { API_PORT, API_URL, SSL_CERT_PATH, SSL_KEY_PATH } from "#config";
import { Client, Platform } from "@prisma/client";
import { createId } from '@paralleldrive/cuid2';
import { safetyNet } from "#middleware/safetyNet";
import db from "#db";
import { Jwt } from "#auth";
import { UfbServer } from "#UfbServer";

const app = express();

const server = https.createServer({
    key: readFileSync(SSL_KEY_PATH as string),
    cert: readFileSync(SSL_CERT_PATH as string),
}, app);

server.listen(process.env.API_PORT, () => {
    console.log(`API running at ${API_URL}:${API_PORT}`)
});

app.get(`/test`, (req, res) => {
    res.send("Hello World!");
});

interface RegisterClientPayload {
    platform: Platform;
}

interface RegisterClientResponse {
    clientId: string;
}

const registerClientHandler = async (req, res) => {
    const {
        platform
    } = req.body as RegisterClientPayload;
    const newClient = await db.client.create({
        data: {
            id: createId(),
            platform
        }
    });
    res.send({ clientId: newClient.id });
};

app.post("/register-client", json(), safetyNet(registerClientHandler));

interface TokenRequestPayload {
    clientId: string;
}

app.post("/token", json(), safetyNet(async (req, res) => {
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
}));

UfbServer.init(server);