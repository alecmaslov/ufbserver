import { API_URL, JWT_SECRET } from "#config";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

const THIS_HOST = API_URL;
const API_AUD = THIS_HOST;
const JWT_ISSUER_SELF = THIS_HOST;

export interface GenerateJwtOptions {
    clientId: string;
    exp?: number;
}

interface JwtPayload {
    iss: string;
    sub: string;
    aud: string;
    iat: number;
    exp: number;
    sid: string;
}

interface GenerateJwtResult {
    payload: JwtPayload;
    token: string;
}

export class Jwt {
    static defaultExp() {
        return Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    }

    // @kyle: I'm curious about this payload & JWT spec you have time to explain it
    static generate(options: GenerateJwtOptions): GenerateJwtResult {
        const payload = {
            iss: JWT_ISSUER_SELF,
            sub: options.clientId,
            aud: API_AUD,
            iat: Math.floor(Date.now() / 1000),
            exp: options.exp ?? this.defaultExp(),
            sid: nanoid(64)
        };
        return {
            payload,
            token: jwt.sign(payload, JWT_SECRET)
        };
    }

    /**
     * Will throw an error if the token is invalid
     */
    static verify(token: string) {
        return jwt.verify(token, JWT_SECRET)
    }
}