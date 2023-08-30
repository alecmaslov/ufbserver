import { config } from "dotenv";
config();

export const {
    API_URL,
    API_PORT,
    JWT_SECRET,
    SSL_KEY_PATH,
    SSL_CERT_PATH
} = process.env;