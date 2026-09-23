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

/** Account sessions: a separate token type from the per-client room token, so one cannot stand in for the other. */
export interface UserJwtPayload { iss: string; sub: string; aud: string; typ: "user"; iat: number; exp: number; sid: string }

export class UserJwt {
    static readonly TTL = 60 * 60 * 24 * 30;   // 30 days

    static generate(userId: string): { token: string; expiresAt: number } {
        const now = Math.floor(Date.now() / 1000);
        const exp = now + this.TTL;
        const payload: UserJwtPayload = { iss: JWT_ISSUER_SELF, sub: userId, aud: API_AUD, typ: "user", iat: now, exp, sid: nanoid(32) };
        return { token: jwt.sign(payload, JWT_SECRET), expiresAt: exp };
    }

    /** Returns the user id, or null when the token is missing, malformed, expired or not an account token. */
    static userId(token?: string | null): string | null {
        if (!token) return null;
        try {
            const p = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
            return p?.typ === "user" && typeof p.sub === "string" ? p.sub : null;
        } catch {
            return null;
        }
    }
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