import https from "https";
import { readFileSync } from "fs";
import express, { json } from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport"
import { UfbRoom } from "#colyseus/UfbRoom";
import requestLogger from "#middleware/requestLogger";
import auth from "#routes/auth";
import dev from "#routes/dev";
import assets from "#routes/assets";
import {
    API_PORT, DEV_MODE,
    SSL_CERT_PATH, SSL_KEY_PATH,
    VERBOSE_INCOMING_REQUESTS
} from "#config";
import { Room } from "colyseus";

const app = express();

app.use(json());
app.use(cors({
    origin: "*"
}));

if (VERBOSE_INCOMING_REQUESTS) {
    app.use(requestLogger);
}

app.use("/auth", auth);
app.use("/assets", assets);

if (DEV_MODE) {
    app.use("/dev", dev);
}

const httpsServer = https.createServer({
    key: readFileSync(SSL_KEY_PATH as string),
    cert: readFileSync(SSL_CERT_PATH as string),
}, app);

const colyseusServer = new Server({
    transport: new WebSocketTransport({
        server: httpsServer
    }),
});

colyseusServer.listen(API_PORT, undefined, undefined, () => {
    console.log(`Listening on ${API_PORT}`);
    colyseusServer.define("ufbRoom", UfbRoom);
});

export const gameServer = colyseusServer;
export const ROOMS: Record<string, Room> = {};