import { Jwt } from "#auth";
import { DEV_MODE } from "#config";
import db from "#db";
import { Pathfinder } from "#game/Pathfinder";
import { RoomCache } from "#game/RoomCache";
import { initializeSpawnEntities, spawnCharacter } from "#game/helpers/map-helpers";
import { registerMessageHandlers } from "#game/message-handlers";
import {
    AdjacencyListItemState,
    TileEdgeState,
    TileState,
} from "#game/schema/MapState";
import { UfbRoomState } from "#game/schema/UfbRoomState";
import { SpawnEntityConfig, UFBMap } from "#game/types/map-types";
import { isNullOrEmpty } from "#util";
import { Client, Room } from "@colyseus/core";
import { ArraySchema, MapSchema } from "@colyseus/schema";
import { createId } from "@paralleldrive/cuid2";
import { TileType } from "@prisma/client";
import { readFile } from "fs/promises";
import { join as pathJoin } from "path";
import { Dispatcher } from "@colyseus/command";
import { UfbRoomOptions } from "./types/room-types";
import { MONSTERS, USER_TYPE } from "#assets/resources";

const DEFAULT_SPAWN_ENTITY_CONFIG: SpawnEntityConfig = {
    chests: 16,
    merchants: 4,
    portals: 2,
    monsters: 8,
};

export class UfbRoom extends Room<UfbRoomState> {
    dispatcher = new Dispatcher(this);

    maxClients = 10;
    sessionIdToPlayerId = new Map<string, string>();
    pathfinder: Pathfinder = new Pathfinder();

    async onCreate(options: UfbRoomOptions) {
        RoomCache.set(this.roomId, this);
        this.setState(new UfbRoomState());

        console.log("onCreate options", options.createOptions);
        try {
            await this.initMap(options.createOptions?.mapName ?? "kraken");
        } catch (err) {
            console.error(err);
        }
        registerMessageHandlers(this);
        console.log(`created room ${this.roomId}`);
    }

    notify(client: Client, message: string, notificationType: string = "info") {
        client.send("notification", {
            type: notificationType,
            message,
        });
    }

    async onJoin(client: Client, options: UfbRoomOptions) {
        let playerId = options.joinOptions.playerId ?? "";
        console.log("onJoin options", options);
        if (isNullOrEmpty(playerId)) {
            playerId = createId();
            client.send("generatedPlayerId", {
                playerId,
            });
        }
        this.sessionIdToPlayerId.set(client.sessionId, playerId);
        console.log(client.sessionId, "joined!");

        const tile = await db.tile.findFirst({
            where: {
                // x_y_mapId: {
                //     x: Math.floor(Math.random() * this.state.map.gridWidth),
                //     y: Math.floor(Math.random() * this.state.map.gridHeight),
                //     mapId: this.state.map.id,
                // },
                x: Math.floor(Math.random() * this.state.map.gridWidth),
                y: Math.floor(Math.random() * this.state.map.gridHeight),
                mapId: this.state.map.id,
            },
        });

        const character = spawnCharacter(
            this.state.characters,
            client.sessionId,
            tile,
            options.joinOptions.characterClass ?? "kirin",
            options.joinOptions.characterId,
            playerId,
            options.joinOptions.displayName
        );

        // @change
        this.state.turnOrder.push(character.id);

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
        this.dispatcher.stop();
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
        } catch (err) {
            console.log("auth failed: invalid token");
            return false;
        }
    }

    // custom state change actions
    incrementTurn() {
        const n = this.state.turnOrder.length;
        const nextPlayerIndex =
            (this.state.turnOrder.indexOf(this.state.currentCharacterId) + 1) %
            n;
        // could compute nextPlayerIndex from turn instead, but this works if turnOrder length changes
        this.state.currentCharacterId = this.state.turnOrder[nextPlayerIndex];
        this.state.turn++;

        // const currentCharacter =

        this.broadcast(
            "turnChanged",
            { turn: this.state.turn },
            { afterNextPatch: true }
        );
    }

    resetTurn() {
        this.state.turn = 0;
        this.state.currentCharacterId = this.state.turnOrder[0] ?? "";
    }

    // @kyle - Implemented map loading from database
    // it should have the same exact functionality
    async initMap(mapName: string) {
        const map = await db.ufbMap.findFirst({
            where: {
                name: mapName,
            },
            include: {
                tiles: {
                    include: {
                        fromTileAdjacencies: true,
                    },
                },
            },
        });

        const spawnZones = await db.spawnZone.findMany({
            where: {
                tile: {
                    mapId: map.id,
                },
            },
        });

        this.state.map.spawnEntities = initializeSpawnEntities(
            spawnZones,
            DEFAULT_SPAWN_ENTITY_CONFIG,
            async (spawnZone, type) => {
                // Spawn monsters
                const tile = await db.tile.findUnique({
                    where: { id: spawnZone.tileId },
                });
                try {
                    spawnCharacter(
                        this.state.characters,
                        "foobarbaz",
                        tile,
                        MONSTERS[type].characterClass,
                        "",
                        "",
                        "",
                        USER_TYPE.MONSTER
                    );
                } catch {
                    console.error(
                        `Tried to spawn monster at ${tile.id} but failed. | ${tile.x}, ${tile.y}`
                    );
                }
            }
        );

        this.state.map.id = map.id;
        this.state.map.name = map.name;
        this.state.map.resourceAddress = map.resourceAddress;
        this.state.map.gridWidth = map.gridWidth;
        this.state.map.gridHeight = map.gridHeight;
        this.state.map._map = map as any;

        this.state.map.adjacencyList = new MapSchema<AdjacencyListItemState>();

        for (const tile of map.tiles) {
            const tileState = new TileState();
            tileState.id = tile.id;
            tileState.type = tile.type as TileType;

            // if(tile.type != TileType.OpenTile) {
            //     console.log(`Tile Type: ${tile.type} Tile index: ${tile.id}, TilePosX : ${tile.x}, Tile Y: ${tile.y}`)
            // }

            tileState.coordinates.x = tile.x;
            tileState.coordinates.y = tile.y;
            tileState.tileCode = tile.tileCode;
            // walls can be null
            const walls = new ArraySchema<number>();
            if (tile.walls) {
                for (const wall of tile.walls as number[]) {
                    walls.push(wall);
                }
            }

            tileState.walls = walls;

            this.state.map.tiles.set(tile.id, tileState);

            // const adjacencyListItem = new AdjacencyListItemState();
            // adjacencyListItem.edges = new ArraySchema<TileEdgeState>();

            // for (const edge of tile.fromTileAdjacencies) {
            //     const edgeState = new TileEdgeState();
            //     edgeState.from = edge.fromId;
            //     edgeState.to = edge.toId;
            //     edgeState.type = edge.type as any;
            //     edgeState.energyCost = edge.energyCost;
            //     adjacencyListItem.edges.push(edgeState);
            // }

            // this.state.map.adjacencyList.set(tile.id, adjacencyListItem);
        }

        this.pathfinder = Pathfinder.fromMapState(this.state.map);

        this.broadcast("mapChanged", {}, { afterNextPatch: true });
        this.resetTurn();
    }

}
