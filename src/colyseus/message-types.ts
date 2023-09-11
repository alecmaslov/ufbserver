
export interface Coordinates {
    x: number;
    y: number;
}

export interface PathStep {
    tileId: string;
    coord: {
        x: number;
        y: number;
    };
}

export interface FindPathMessageBody {
    from: Coordinates;
    to: Coordinates;
}

export interface FoundPathMessageBody {
    from: Coordinates;
    to: Coordinates;
    path: PathStep[];
    cost: number;
}

export interface MoveMessageBody {
    destination: Coordinates;
}

export interface PlayerMovedMessageBody {
    playerId: string;
    path: PathStep[];
}

export interface ChangeMapMessageBody {
    mapName: string;
}

export interface GeneratedPlayerIdMessageBody {
    playerId: string;
}