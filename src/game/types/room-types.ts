
export interface UfbRoomRules {
    maxPlayers: number;
    initHealth: number;
    initEnergy: number;
    turnTime: number;
}

export interface UfbRoomCreateOptions {
    mapName: string;
    ownerId: string;
    roomId: string;
    isPrivate: string;
    turnIds: string[];
    rules: UfbRoomRules;
    /** "normal" (default): monsters hunt only what they can see (monster-ai.ts). "hard": every monster always knows. */
    difficulty?: "normal" | "hard";
    /** single-player run: one human, room locked, saved so it can be resumed (see solo-save.ts) */
    solo?: boolean;
    /** with solo: restore the owner's saved run instead of starting a new one */
    resume?: boolean;
}

export interface UfbRoomJoinOptions {
    lang?: string;          // page language of the web client (en, ja, es, fr, de, ru, zh), for match stats
    token: string;
    playerId: string;
    displayName: string;
    /** unique id of a specific instance of a character (optional) */
    characterId?: string;
    /** e.g. "kirin" (optional) */
    characterClass?: string;
}

export interface UfbRoomOptions {
    createOptions: UfbRoomCreateOptions;
    joinOptions: UfbRoomJoinOptions;
}