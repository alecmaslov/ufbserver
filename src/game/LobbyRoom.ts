
import { LobbyState } from "./schema/LobbyState";
import { nanoid } from "nanoid";
import { Dispatcher } from "@colyseus/command";
import { Client, Room } from "@colyseus/core";
import { RoomData } from "./schema/RoomData";
import { RoomCache } from "./RoomCache";
import { RESPONSE_TYPE } from "#shared-types";
import { UfbRoom } from "./UfbRoom";

export class LobbyRoom extends Room<LobbyState> {
    dispatcher = new Dispatcher(this);

    maxClients = 10;
  async onCreate() {
    this.setState(new LobbyState());

    this.onMessage("create", (client, data) => {
      const roomId = nanoid();
      const inviteToken = data.isPrivate ? nanoid(8) : undefined;

      const room = new RoomData();
      room.id = roomId;
      room.name = data.name;
      room.maxPlayers = data.maxPlayers;
      room.playerCount = 0;
      room.ownerId = client.sessionId;
      room.inviteToken = inviteToken;
      room.isPrivate = data.isPrivate;

      this.state.rooms.set(roomId, room);
    });

    this.onMessage("delete", (client, roomId: string) => {
      const room = this.state.rooms.get(roomId);
      if (room && room.ownerId === client.sessionId) {
        this.state.rooms.delete(roomId);
      }
    });

    this.onMessage("join", (client, data) => {
      const room = this.state.rooms.get(data.roomId);
      if (!room) return;

      if (room.isPrivate && room.inviteToken !== data.inviteToken) return;

      this.presence.publish("join_room", {
        roomId: room.id,
        sessionId: client.sessionId
      });
    });

    this.onMessage("room-by-id", (client, roomId) => {
            
        const room = RoomCache.get(roomId) as UfbRoom;
    
        if(room == null) {
            const response = {
                error: RESPONSE_TYPE.NOT_EXIST
            };
            return;
        }
    
        const characterList: any = [];
        room.state.characters.forEach((data: { characterId: any; displayName: any; characterClass: any; }) => {
            characterList.push({
                id: data.characterId,
                name: data.displayName,
                characterClass: data.characterClass
            }) 
        })
    
        const roomData = {
            id : room.roomId,
            name: room.roomName,
            ownerId : room.roomOption.createOptions.ownerId,
            inviteToken: room.inviteToken,
            characters: characterList
        };

        client.send("room-by-id", roomData);
    })
  }
}