import { join as pathJoin } from "path";
import { readFile } from "fs/promises";
import { Room, Client } from "@colyseus/core";
import { UfbRoomState } from "./schema/UfbRoomState";
import { PlayerState } from "./schema/PlayerState";
import { isNullOrEmpty } from "#util";
import { Jwt } from "#auth";
import { DEV_MODE } from "#config";
import { AdjacencyListItem, coordToTileId, loadMap, tileIdToCoord } from "#colyseus/schema/MapState";
import { aStar } from "ngraph.path";
import { RoomCache } from "./RoomCache";
import { Node } from "ngraph.graph";
import { MapSchema } from "@colyseus/schema";

interface UfbRoomRules {
  maxPlayers: number;
  initHealth: number;
  initEnergy: number;
  turnTime: number;
}

interface UfbRoomOptions {
  mapName: string;
  rules: UfbRoomRules;
  token: string;
}

interface Coordinates {
  x: number;
  y: number;
}

interface PathStep {
  tileId: string;
  coord: {
    x: number;
    y: number;
  };
}

interface FindPathMessageBody {
  from: Coordinates;
  to: Coordinates;
}

interface FoundPathMessageBody {
  from: Coordinates;
  to: Coordinates;
  path: PathStep[];
  cost: number;
}

interface PlayerMovedMessageBody {
  playerId: string;
  path: PathStep[];
}

interface MoveMessageBody {
  toCoord: Coordinates;
}

interface ChangeMapMessageBody {
  mapName: string;
}

const getPathCost = (p: Node<any>[], adjacencyList: MapSchema<AdjacencyListItem, string>) => {
  let cost = 0;
  for (let i = 1; i < p.length; i++) {
    const from = p[i - 1].id as string;
    const to = p[i].id as string;
    const edgeCollection = adjacencyList.get(from);
    if (!edgeCollection) {
      throw new Error(`no adjacency list for ${from}`);
    }
    let edge: { energyCost: number } | undefined;
    for (const e of edgeCollection.edges) {
      if (e.to === to) {
        edge = e;
        break;
      }
    }
    if (!edge) {
      throw new Error(`no edge from ${from} to ${to}`);
    }
    cost += edge.energyCost;
  }
  return cost;
};

export class UfbRoom extends Room<UfbRoomState> {
  maxClients = 10;

  async onCreate(options: UfbRoomOptions) {
    RoomCache.set(this.roomId, this);
    this.setState(new UfbRoomState());

    console.log("onCreate options", options);
    try {
      await loadMap(this, options.mapName);
    }
    catch (err) {
      console.error(err);
    }

    this.onMessage("whoami", (client, message) => {
      console.log("whoami", message);
      client.send("whoami", {
        clientId: client.id
      });
    });

    this.onMessage("move", (client, message: MoveMessageBody) => {
      console.log("move", {
        clientId: client.id,
        message
      });

      const player = this.state.players.get(client.id);

      if (!player) {
        this.notify(client, "You are not in this game!", "error");
      }

      const playerTileId = coordToTileId(player);
      const toTileId = coordToTileId(message.toCoord);

      const pathFinder = aStar(this.state.map._navGraph, {
        distance(fromNode, toNode, link) {
          return link.data.energyCost;
        }
      });
      const adjacencyList = this.state.map.adjacencyList;

      const path = pathFinder.find(playerTileId, toTileId);
      const p: any[] = [];
      for(const node of path) {
        console.log("node", node.id);
        p.push({
          id: node.id,
        });
      }

      const cost = getPathCost(path, adjacencyList);
      // player must have enough energy to move along the path
      if (player.stats.energy < cost) {
        this.notify(client, "You don't have enough energy to move there!", "error");
        return;
      }

      console.log("path", JSON.stringify(path, null, 2));
      this.broadcast("playerMoved", {
        playerId: client.id,
        path: p
      });

      player.stats.energy -= cost;
      if (player.stats.energy == 0) {
        this.notify(client, "You are too tired to continue.");
        this.incrementTurn();
      }
    });

    this.onMessage("findPath", (client, message: FindPathMessageBody) => {
      const fromTileId = coordToTileId(message.from);
      const toTileId = coordToTileId(message.to);

      const pathFinder = aStar(this.state.map._navGraph, {
        distance(fromNode, toNode, link) {
          return link.data.energyCost;
        }
      });
      const adjacencyList = this.state.map.adjacencyList;

      const path = pathFinder.find(fromTileId, toTileId);
      if (!path || path.length === 0) {
        this.notify(client, "No path found", "error");
        return;
      }

      const pathSteps: PathStep[] = path.map(node => {
        return {
          tileId: node.id as string,
          coord: tileIdToCoord(node.id as string)
        };
      });

      const cost = getPathCost(path, adjacencyList);

      client.send("foundPath", {
        from: message.from,
        to: message.to,
        path: pathSteps,
        cost: cost
      });
    });

    this.onMessage("endTurn", (client, message) => {
      console.log("endTurn", message);
      const player = this.state.players.get(client.id);
      if (player.id !== this.state.currentPlayerId) {
        this.notify(client, "It's not your turn!", "error");
        return;
      }
      this.incrementTurn();
    });

    this.onMessage("changeMap", async (client, message: ChangeMapMessageBody) => {
      console.log("changeMap", message);
      await loadMap(this, message.mapName);
    });
  }

  incrementTurn() {
    const n = this.state.turnOrder.length;
    const nextPlayerIndex = (this.state.turnOrder.indexOf(this.state.currentPlayerId) + 1) % n;
    // could compute nextPlayerIndex from turn instead, but this works if turnOrder length changes
    this.state.currentPlayerId = this.state.turnOrder[nextPlayerIndex];
    this.state.turn++;
  }

  notify(client: Client, message: string, notificationType: string = "info") {
    client.send("notification", {
      type: notificationType,
      message
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.id, new PlayerState());
    const player = this.state.players.get(client.id);
    player.id = client.id;
    player.x = Math.floor(Math.random() * 28);
    player.y = Math.floor(Math.random() * 28);
    this.notify(client, "Welcome to the game, " + client.id + "!");
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
