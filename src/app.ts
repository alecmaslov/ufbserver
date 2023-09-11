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
import maps from "#routes/maps";
import {
    API_PORT, DEV_MODE,
    SSL_CERT_PATH, SSL_KEY_PATH,
    VERBOSE_INCOMING_REQUESTS
} from "#config";

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
app.use("/maps", maps);

if (DEV_MODE) {
    console.log("🚧🚧 Warning: DEV_MODE is enabled! 🚧🚧");
    app.use("/dev", dev);
}

const httpsServer = https.createServer({
    key: readFileSync(SSL_KEY_PATH as string),
    cert: readFileSync(SSL_CERT_PATH as string),
}, app);

const colyseusServer = new Server({
    greet: false,
    transport: new WebSocketTransport({
        server: httpsServer
    }),
});

colyseusServer.listen(API_PORT, undefined, undefined, () => {
    console.log(`✨ UFB Server listening on port ${API_PORT} ✨`);
    colyseusServer.define("ufbRoom", UfbRoom);
});

export const gameServer = colyseusServer;