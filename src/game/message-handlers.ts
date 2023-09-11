import { Client } from "@colyseus/core";
import { UfbRoom } from "./UfbRoom";
import { coordToTileId, getPathCost, tileIdToCoord } from "./map-helpers";
import { aStar } from "ngraph.path";
import { PathStep } from "#shared-types";
import { PlayerMovedMessage } from "./message-types";

type MessageHandler<TMessage> = (room: UfbRoom, client: Client, message: TMessage) => void;

export interface MessageHandlers {
    [key: string]: MessageHandler<any>;
};

export const messageHandlers: MessageHandlers = {
    "move": (room, client, message) => {
        const playerId = room.sessionIdToPlayerId.get(client.sessionId);

        console.log("move", {
            playerId,
            message
        });

        const player = room.state.players.get(playerId);

        if (!player) {
            room.notify(client, "You are not in room game!", "error");
        }

        if (player.id !== room.state.currentPlayerId) {
            room.notify(client, "It's not your turn!", "error");
            return;
        }

        const playerTileId = coordToTileId(player);
        const toTileId = coordToTileId(message.destination);

        const pathFinder = aStar(room.state.map._navGraph, {
            distance(fromNode, toNode, link) {
                return link.data.energyCost;
            }
        });
        const adjacencyList = room.state.map.adjacencyList;

        const path = pathFinder.find(playerTileId, toTileId);
        const p: PathStep[] = [];
        for (const node of path) {
            console.log("node", node.id);
            p.push({
                tileId: node.id as string,
                coord: tileIdToCoord(node.id as string)
            });
        }

        const cost = getPathCost(path, adjacencyList);
        // player must have enough energy to move along the path
        if (player.stats.energy < cost) {
            room.notify(client, "You don't have enough energy to move there!", "error");
            return;
        }

        player.x = message.destination.x;
        player.y = message.destination.y;
        player.stats.energy -= cost;

        console.log("path", JSON.stringify(path, null, 2));
        const playerMovedMessage: PlayerMovedMessage = {
            playerId,
            path: p
        };
        room.broadcast("playerMoved", playerMovedMessage);

        if (player.stats.energy == 0) {
            room.notify(client, "You are too tired to continue.");
            room.incrementTurn();
        }
    },

    "findPath": (room, client, message) => {
        const fromTileId = coordToTileId(message.from);
      const toTileId = coordToTileId(message.to);

      const pathFinder = aStar(room.state.map._navGraph, {
        distance(fromNode, toNode, link) {
          return link.data.energyCost;
        }
      });
      const adjacencyList = room.state.map.adjacencyList;

      const path = pathFinder.find(fromTileId, toTileId);
      if (!path || path.length === 0) {
        room.notify(client, "No path found", "error");
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
    },

    "endTurn": (room, client, message) => {
        console.log("endTurn", message);
        const playerId = room.sessionIdToPlayerId.get(client.sessionId);
        const player = room.state.players.get(playerId);
        if (player.id !== room.state.currentPlayerId) {
            room.notify(client, "It's not your turn!", "error");
          return;
        }
        room.incrementTurn();
    },

    "changeMap": async (room, client, message) => {
        console.log("changeMap", message);
        await room.initMap(message.mapName);
    },
};

export function registerMessageHandlers(room: UfbRoom) {
    for (const [key, handler] of Object.entries(messageHandlers)) {
        room.onMessage<any>(key, handler.bind(room));
    }
}