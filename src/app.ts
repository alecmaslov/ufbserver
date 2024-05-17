import {
    API_PORT, DEV_MODE,
    SSL_CERT_PATH, SSL_KEY_PATH,
    VERBOSE_INCOMING_REQUESTS
} from "#config";
import { UfbRoom } from "#game/UfbRoom";
import requestLogger from "#middleware/requestLogger";
import assets from "#routes/assets";
import auth from "#routes/auth";
import dev from "#routes/dev";
import maps from "#routes/maps";
import character from "#routes/character";
import nft from "#routes/nft";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "cors";
import express, { json } from "express";
import { readFileSync } from "fs";
import https from "https";

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
app.use("/character", character);
app.use("/nft", nft);

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