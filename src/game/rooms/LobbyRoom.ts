// LobbyRoom.ts
import { Room, matchMaker } from "@colyseus/core";
import { LobbyState, LobbyRoomInfo } from "../schema/LobbyState";

export class LobbyRoom extends Room<LobbyState> {

  onCreate() {
    this.setState(new LobbyState());

    this.onMessage("create_room", async (client, data) => {
      let roomId: string;
      let roomExists = true;

      // Ensure uniqueness
      while (roomExists) {
        roomId = generateRoomId(4);
        roomExists = matchMaker.hasHandler(roomId);
        console.log("room id", roomId);
      }

      const room = await matchMaker.createRoom(
        "waiting",
        {
          roomId,                     // ✅ THIS IS THE ONLY VALID WAY
          sessionId: client.sessionId,
          ownerId: data.ownerId,
          name: data.name,            // map name
          maxPlayers: data.maxPlayers,
        },
      );

      console.log("create waiting room : ", room.roomId, " ", roomId);
      room.roomId = roomId;

      const info = new LobbyRoomInfo();
      info.roomId = roomId;
      info.name = data.name;
      info.maxPlayers = data.maxPlayers;
      info.playerCount = 0;

      console.log("lobby room info : ", info);
      this.state.rooms.set(roomId, info);

      client.send("create-room", roomId);
    });

    this.onMessage("delete_room", (_, roomId) => {
      this.state.rooms.delete(roomId);
    });
  }
}

function generateRoomId(length = 4): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
}

