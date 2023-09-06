import { config } from "dotenv";
config();

export const {
    API_URL,
    JWT_SECRET,
    SSL_KEY_PATH,
    SSL_CERT_PATH
} = process.env;

const _port = parseInt(process.env.API_PORT);
export const API_PORT = isNaN(_port) ? 8080 : _port;

export const VERBOSE_INCOMING_REQUESTS = process.env.VERBOSE_INCOMING_REQUESTS === "true";