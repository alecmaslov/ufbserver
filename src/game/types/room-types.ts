
export interface UfbRoomRules {
    maxPlayers: number;
    initHealth: number;
    initEnergy: number;
    turnTime: number;
}

export interface UfbRoomCreateOptions {
    mapName: string;
    rules: UfbRoomRules;
}

export interface UfbRoomJoinOptions {
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