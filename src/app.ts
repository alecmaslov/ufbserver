import express, { json } from "express";
import https from "https";
import { readFileSync } from "fs";
import { API_PORT, API_URL, SSL_CERT_PATH, SSL_KEY_PATH, VERBOSE_INCOMING_REQUESTS } from "#config";
import auth from "#routes/auth";
import requestLogger from "#middleware/requestLogger";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport"
import { playground } from "@colyseus/playground";
import { UfbRoom } from "#colyseus/UfbRoom";
import { monitor } from "@colyseus/monitor";

const app = express();

app.use(json());

if (VERBOSE_INCOMING_REQUESTS) {
    app.use(requestLogger);
}

app.use("/auth", auth);
app.use("/playground", playground);
app.use("/monitor", monitor());

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