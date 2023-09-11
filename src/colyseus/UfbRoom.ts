import { join as pathJoin } from "path";
import { readFile } from "fs/promises";
import { Room, Client } from "@colyseus/core";
import { UfbRoomState } from "./schema/UfbRoomState";
import { PlayerState } from "./schema/PlayerState";
import { isNullOrEmpty } from "#util";
import { Jwt } from "#auth";
import { DEV_MODE } from "#config";
import { AdjacencyListItem, Coordinates, NavGraphLinkData, TileColor, TileEdgeSchema, TileState, UFBMap } from "#colyseus/schema/MapState";
import { aStar } from "ngraph.path";
import { RoomCache } from "./RoomCache";
import createGraph, { Node } from "ngraph.graph";
import { ArraySchema, MapSchema } from "@colyseus/schema";
import { ok } from "assert";
import { MoveMessageBody, FindPathMessageBody, PathStep, ChangeMapMessageBody, PlayerMovedMessageBody } from "./message-types";
import { createId } from "@paralleldrive/cuid2";

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

const TILE_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

export const coordToTileId = (coordinates: Coordinates): string => {
  return `tile_${TILE_LETTERS[coordinates.y]}_${coordinates.x + 1}`;
};

export const tileIdToCoord = (tileId: string): Coordinates => {
  const parts = tileId.split("_");
  const y = TILE_LETTERS.indexOf(parts[1]);
  const x = parseInt(parts[2]) - 1;
  const c = { x, y };
  ok(coordToTileId(c) === tileId);
  return c;
};

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
      await this.initMap(options.mapName ?? "kraken");
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

      if (player.id !== this.state.currentPlayerId) {
        this.notify(client, "It's not your turn!", "error");
        return;
      }

      const playerTileId = coordToTileId(player);
      const toTileId = coordToTileId(message.destination);

      const pathFinder = aStar(this.state.map._navGraph, {
        distance(fromNode, toNode, link) {
          return link.data.energyCost;
        }
      });
      const adjacencyList = this.state.map.adjacencyList;

      const path = pathFinder.find(playerTileId, toTileId);
      const p: PathStep[] = [];
      for(const node of path) {
        console.log("node", node.id);
        p.push({
          tileId: node.id as string,
          coord: tileIdToCoord(node.id as string)
        });
      }

      const cost = getPathCost(path, adjacencyList);
      // player must have enough energy to move along the path
      if (player.stats.energy < cost) {
        this.notify(client, "You don't have enough energy to move there!", "error");
        return;
      }

      player.x = message.destination.x;
      player.y = message.destination.y;
      player.stats.energy -= cost;

      console.log("path", JSON.stringify(path, null, 2));
      const playerMovedMessage: PlayerMovedMessageBody = {
        playerId: client.id,
        path: p
      };
      this.broadcast("playerMoved", playerMovedMessage);

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
      await this.initMap(message.mapName);
    });

    console.log(`created room ${this.roomId}`);
  }

  notify(client: Client, message: string, notificationType: string = "info") {
    client.send("notification", {
      type: notificationType,
      message
    });
  }

  onJoin(client: Client, options: any) {
    let playerId = options.playerId ?? "";
    console.log("onJoin options", options);
    if (isNullOrEmpty(playerId)) {
      playerId = createId();
      client.send("generatedPlayerId", {
        playerId
      });
    }
    console.log(client.sessionId, "joined!");
    this.state.players.set(playerId, new PlayerState());
    const player = this.state.players.get(playerId);
    player.id = playerId;
    player.clientId = client.id;
    player.name = options.name ?? [ "Player", playerId ].join(" ");
    player.x = Math.floor(Math.random() * 28);
    player.y = Math.floor(Math.random() * 28);
    this.state.turnOrder.push(client.id);
    if (this.state.turnOrder.length === 1) {
      this.state.currentPlayerId = client.id;
      console.log("first player, setting current player id to", client.id);
    }
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

  // custom state change actions

  incrementTurn() {
    const n = this.state.turnOrder.length;
    const nextPlayerIndex = (this.state.turnOrder.indexOf(this.state.currentPlayerId) + 1) % n;
    // could compute nextPlayerIndex from turn instead, but this works if turnOrder length changes
    this.state.currentPlayerId = this.state.turnOrder[nextPlayerIndex];
    this.state.turn++;
  }

  resetTurn() {
    this.state.turn = 0;
    this.state.currentPlayerId = this.state.turnOrder[0] ?? "";
  }

  async initMap(mapKey: string) {
    const path = pathJoin("data", "maps", mapKey, "map.json");
    const data = await readFile(path);
    const parsed = JSON.parse(data.toString());
    const ufbMap = parsed as UFBMap;
    this.state.map.id = mapKey;
    this.state.map.name = mapKey;
    this.state.map.gridWidth = ufbMap.gridWidth;
    this.state.map.gridHeight = ufbMap.gridHeight;
    this.state.map._map = ufbMap;

    for (const tile of ufbMap.tiles) {
        const tileSchema = new TileState();
        tileSchema.id = tile.id;
        tileSchema.type = tile.type;
        tileSchema.layerName = tile.layerName;
        tileSchema.legacyCode = tile.legacyCode;
        tileSchema.color = new TileColor();
        tileSchema.color.name = tile.color!.name;
        tileSchema.color.color = tile.color!.color;
        tileSchema.x = tile.coordinates.x;
        tileSchema.y = tile.coordinates.y;
        this.state.map.tiles.set(tile.id, tileSchema);
    }

    this.state.map.adjacencyList = new MapSchema<AdjacencyListItem>();
    for (const key in ufbMap.adjacencyList) {
        const edges = ufbMap.adjacencyList[key]!;
        const item = new AdjacencyListItem();
        item.edges = new ArraySchema<TileEdgeSchema>();
        for (const edge of edges) {
            const edgeSchema = new TileEdgeSchema();
            edgeSchema.from = edge.from;
            edgeSchema.to = edge.to;
            edgeSchema.type = edge.type;
            edgeSchema.energyCost = edge.energyCost;
            item.edges.push(edgeSchema);
        }
        this.state.map.adjacencyList.set(key, item);
    }

    // build nav graph
    const graph = createGraph<any, NavGraphLinkData>();
    for (const key in ufbMap.adjacencyList) {
        const edges = ufbMap.adjacencyList[key]!;
        for (const edge of edges) {
            graph.addLink(edge.from, edge.to, {
                energyCost: edge.energyCost,
            });
        }
    }
    this.state.map._navGraph = graph;
    this.broadcast("mapChanged", {}, { afterNextPatch: true });
    this.resetTurn();
  }
}
