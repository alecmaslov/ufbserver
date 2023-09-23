import { join as pathJoin } from "path";
import { readFile } from "fs/promises";
import { Room, Client } from "@colyseus/core";
import { UfbRoomState } from "./schema/UfbRoomState";
import { CharacterState } from "./schema/CharacterState";
import { isNullOrEmpty } from "#util";
import { Jwt } from "#auth";
import { DEV_MODE } from "#config";
import { AdjacencyListItemState, TileEdgeState, TileState, UFBMap } from "#game/schema/MapState";
import { RoomCache } from "./RoomCache";
import { ArraySchema, MapSchema } from "@colyseus/schema";
import { createId } from "@paralleldrive/cuid2";
import { registerMessageHandlers } from "./message-handlers";
import { Pathfinder } from "./Pathfinder";

interface UfbRoomRules {
  maxPlayers: number;
  initHealth: number;
  initEnergy: number;
  turnTime: number;
}

interface UfbRoomCreateOptions {
  mapName: string;
  rules: UfbRoomRules;
}

interface UfbRoomJoinOptions {
  token: string;
  playerId: string;
  displayName: string;
  /** unique id of a specific instance of a character (optional) */
  characterId?: string;
  /** e.g. "kirin" (optional) */
  characterClass?: string;
}

interface UfbRoomOptions {
  createOptions: UfbRoomCreateOptions;
  joinOptions: UfbRoomJoinOptions;
}

export class UfbRoom extends Room<UfbRoomState> {
  maxClients = 10;
  sessionIdToPlayerId = new Map<string, string>();
  pathfinder: Pathfinder = new Pathfinder();

  async onCreate(options: UfbRoomOptions) {
    RoomCache.set(this.roomId, this);
    this.setState(new UfbRoomState());

    console.log("onCreate options", options.createOptions);
    try {
      await this.initMap(options.createOptions?.mapName ?? "kraken");
    }
    catch (err) {
      console.error(err);
    }
    registerMessageHandlers(this);
    console.log(`created room ${this.roomId}`);
  }

  notify(client: Client, message: string, notificationType: string = "info") {
    client.send("notification", {
      type: notificationType,
      message
    });
  }

  onJoin(client: Client, options: UfbRoomOptions) {
    let playerId = options.joinOptions.playerId ?? "";
    console.log("onJoin options", options);
    if (isNullOrEmpty(playerId)) {
      playerId = createId();
      client.send("generatedPlayerId", {
        playerId
      });
    }
    this.sessionIdToPlayerId.set(client.sessionId, playerId);
    console.log(client.sessionId, "joined!");
    this.state.characters.set(playerId, new CharacterState());
    const player = this.state.characters.get(playerId);
    player.id = playerId;
    player.sessionId = client.sessionId;
    player.characterId = options.joinOptions?.characterId ?? "kirin";
    player.displayName = options.joinOptions?.displayName ?? [player.characterId, playerId].join(" ");
    player.coordinates.x = Math.floor(Math.random() * 28);
    player.coordinates.y = Math.floor(Math.random() * 28);
    this.state.turnOrder.push(client.sessionId);
    if (this.state.turnOrder.length === 1) {
      this.state.currentCharacterId = playerId;
      console.log("first player, setting current player id to", playerId);
    }
    this.notify(client, "Welcome to the game, " + playerId + "!");
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
    const nextPlayerIndex = (this.state.turnOrder.indexOf(this.state.currentCharacterId) + 1) % n;
    // could compute nextPlayerIndex from turn instead, but this works if turnOrder length changes
    this.state.currentCharacterId = this.state.turnOrder[nextPlayerIndex];
    this.state.turn++;
  }

  resetTurn() {
    this.state.turn = 0;
    this.state.currentCharacterId = this.state.turnOrder[0] ?? "";
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
      tileSchema.x = tile.coordinates.x;
      tileSchema.y = tile.coordinates.y;
      this.state.map.tiles.set(tile.id, tileSchema);
    }

    this.state.map.adjacencyList = new MapSchema<AdjacencyListItemState>();
    for (const key in ufbMap.adjacencyList) {
      const edges = ufbMap.adjacencyList[key]!;
      const item = new AdjacencyListItemState();
      item.edges = new ArraySchema<TileEdgeState>();
      for (const edge of edges) {
        const edgeSchema = new TileEdgeState();
        edgeSchema.from = edge.from;
        edgeSchema.to = edge.to;
        edgeSchema.type = edge.type;
        edgeSchema.energyCost = edge.energyCost;
        item.edges.push(edgeSchema);
      }
      this.state.map.adjacencyList.set(key, item);
    }

    this.pathfinder = Pathfinder.fromMapState(this.state.map);

    this.broadcast("mapChanged", {}, { afterNextPatch: true });
    this.resetTurn();
  }
}
