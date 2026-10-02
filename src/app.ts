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
import user from "#routes/user";
import lobby from "#routes/lobby";
import account from "#routes/account";
import skillTree from "#routes/skill-tree";
import figurine from "#routes/figurine";
import solo from "#routes/solo";
import admin from "#routes/admin";
import i18n from "#routes/i18n";

import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "cors";
import express, { json } from "express";
import { readFileSync } from "fs";
import https from "https";
import http from "http";
import { LobbyRoom } from "#game/rooms/LobbyRoom";
import { WaitingRoom } from "#game/rooms/WaitingRoom";

const app = express();
// Nginx is the only way in (ufb-api listens on 127.0.0.1). Trust it for X-Forwarded-For so the rate
// limits count each visitor, not every visitor as one "127.0.0.1".
app.set("trust proxy", "loopback");

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
app.use("/lobby", lobby);
app.use("/user", user);
app.use("/account", account);
app.use("/account/skill-tree", skillTree);
app.use("/account/figurine", figurine);
app.use("/solo", solo);
app.use("/i18n", i18n);
app.use("/admin", admin);   // secret header from Nginx + basic auth there; see routes/admin.ts

if (DEV_MODE) {
    console.log("🚧🚧 Warning: DEV_MODE is enabled! 🚧🚧");
    app.use("/dev", dev);
}

console.log(SSL_KEY_PATH)

// DEPLOY -- HTTPS PART
// const httpsServer = https.createServer({
//     key: readFileSync(SSL_KEY_PATH as string),
//     cert: readFileSync(SSL_CERT_PATH as string),
// }, app);

// const colyseusServer = new Server({
//     greet: false,
//     transport: new WebSocketTransport({
//         server: httpsServer
//     }),
// });

// DEVELOPMENT PART
const httpServer = http.createServer(app);

const colyseusServer = new Server({
    greet: false,
    transport: new WebSocketTransport({
        server: httpServer
    }),
});

// Bind loopback only. Nginx is the sole client (proxy_pass http://127.0.0.1:8080),
// so a public bind buys nothing and leaves the firewall as the only thing between
// the internet and this process. Override with API_HOST if that ever changes.
const API_HOST = process.env.API_HOST ?? "127.0.0.1";

colyseusServer.listen(API_PORT, API_HOST, undefined, () => {
    console.log(`✨ UFB Server listening on ${API_HOST}:${API_PORT} ✨`);
    colyseusServer.define("lobby", LobbyRoom);
    colyseusServer.define("waiting", WaitingRoom);
    colyseusServer.define("ufbRoom", UfbRoom);
});

export const gameServer = colyseusServer;