import { Room } from "colyseus";

export class RoomCache {
    private static rooms: Map<string, Room> = new Map<string, Room>();

    static get<T extends Room>(roomId: string): T | undefined {
        return this.rooms.get(roomId) as T;
    }

    static set(roomId: string, room: Room): void {
        this.rooms.set(roomId, room);
    }
}