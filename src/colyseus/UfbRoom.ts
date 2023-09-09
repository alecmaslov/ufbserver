import { join as pathJoin } from "path";
import { readFile } from "fs/promises";
import { Room, Client } from "@colyseus/core";
import { UfbRoomState } from "./schema/UfbRoomState";
import { PlayerState } from "./schema/PlayerState";
import { isNullOrEmpty } from "#util";
import { Jwt } from "#auth";
import { DEV_MODE } from "#config";
import { loadMap } from "#colyseus/schema/MapState";

export class UfbRoom extends Room<UfbRoomState> {
  maxClients = 10;

  onCreate(options: any) {
    this.setState(new UfbRoomState());

    console.log("onCreate options", options);
    loadMap(this, "kraken").then(() => {
      // debug print the map tiles / adjacency
      console.log(this.state.map.tiles);
      console.log(this.state.map._adjacencyList);
      console.log(this.state.map.adjacencyList);
    });

    this.onMessage("whoami", (client, message) => {
      console.log("whoami", message);
      client.send("whoami", {
        clientId: client.id
      });
    });

    this.onMessage("move", (client, message) => {
      console.log("move", message);
      const player = this.state.players.get(client.id);
      // TODO validation logic
      player.x = message.x;
      player.y = message.y;
      this.broadcast("playerMoved", {
        playerId: client.id,
        x: player.x,
        y: player.y
      });
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.id, new PlayerState());
    const player = this.state.players.get(client.id);
    player.id = client.id;
    player.x = Math.floor(Math.random() * 28);
    player.y = Math.floor(Math.random() * 28);

    client.send("playerJoined", {
      clientId: client.id,
      isMe: true,
      x: player.x,
      y: player.y
    });

    // send to all other clients
    this.broadcast("playerJoined", {
      clientId: client.id,
      isMe: false,
      x: player.x,
      y: player.y
    }, { except: client });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  onAuth(client: Client, options: Record<string, any>) {
    if (DEV_MODE) {
      return true;
    }
    const token = options.token as string;
    if (isNullOrEmpty(token)) {
      console.log("auth failed: no token");
      return false;
    }
    try {
      Jwt.verify(token);
      return true;
    }
    catch (err) {
      console.log("auth failed: invalid token");
      return false;
    }
  }
}
