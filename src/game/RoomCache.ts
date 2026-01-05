import { UfbRoom } from "./UfbRoom";

export class RoomCache {
    private static rooms: Map<string, UfbRoom> = new Map<string, UfbRoom>();

    static get<T extends UfbRoom>(roomId: string): T | undefined {
        return this.rooms.get(roomId) as T;
    }

    static set(roomId: string, room: UfbRoom): void {
        this.rooms.set(roomId, room);
    }

    static getRoom(){
        return this.rooms;
    }
}