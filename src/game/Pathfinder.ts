import { EDGE_TYPE, featherStep, ITEMTYPE, WALL_DIRECT } from "#assets/resources";
import { getPathCost, getTileIdByDirection } from "#game/helpers/map-helpers";
import { MapState, TileState } from "#game/schema/MapState";
import { PathStep } from "#shared-types";
import { TileType } from "@prisma/client";
import createGraph, { Graph } from "ngraph.graph";
import { aStar, PathFinder as NGraphPathFinder } from "ngraph.path";
import { UfbRoomState } from "./schema/UfbRoomState";

export type NavGraphLinkData = {
  energyCost: number;
  blocked: boolean;
  featherCost: number
};

export interface FindPathResult {
  foundPath: boolean;
  cost: number;
  featherCount: number
  path: PathStep[];
}

export class Pathfinder {
  private _mapState: MapState = null;
  private _navGraph: Graph<any, NavGraphLinkData> = null;
  private _pathFinder: NGraphPathFinder<any> = null;

  static fromMapState(room: UfbRoomState, isFeather = false): Pathfinder {

    const p = new Pathfinder();
    p._mapState = room.map;
    p._navGraph = p.getGraph(room, isFeather);
    p._pathFinder = aStar(p._navGraph, {
      distance(fromNode, toNode, link) {
        return link.data.energyCost;
      },
      blocked(fromNode, toNode, link) {
        return link.data.blocked;
      }
    });
    return p;
  }

  find(from: string, to: string): FindPathResult {
    const _path = this._pathFinder.find(from, to);
    try {
      const {cost, featherCount} = getPathCost(_path, this._navGraph);
      const path: PathStep[] = _path.map((node) => {
        return {
          tileId: node.id as string,
          // coord: { x: -69, y: -69 }
        };
      });
      path.reverse();
      return {
        foundPath: true,
        cost,
        featherCount,
        path,
      };
    } catch (e) {
      console.error("Error finding path", e);
      return {
        foundPath: false,
        cost: 0,
        featherCount: 0,
        path: [],
      };
    }
  }
  
  getGraph(room: UfbRoomState, isFeather = false): Graph<any, NavGraphLinkData> {
    const mapState: MapState = room.map;
    var characters = room.characters;

    let banTileIds: string[] = [];
    characters.forEach((character) => {
      if(character.id != room.currentCharacterId) {
        banTileIds.push(character.currentTileId);
      }
    });

    console.log(banTileIds, room.currentCharacterId);
    // build nav graph
    const graph = createGraph<any, NavGraphLinkData>();

    mapState.tiles.forEach((tile) => {
      if( 
          tile.type == TileType.DoubleBridge || tile.type == TileType.VerticalBridge || 
          tile.type == TileType.HorizontalBridge || tile.type == TileType.StairsEW || 
          tile.type == TileType.StairsNS || tile.type == TileType.StairsSN || tile.type == TileType.StairsWE
          // || banTileIds.indexOf(tile.id) != -1
      ) return;

      tile.walls.forEach((edgeType, i) => {
        let direct = "";
        if (i == WALL_DIRECT.TOP) {
            direct = "top";
        } else if (i == WALL_DIRECT.DOWN) {
            direct = "down";
        } else if (i == WALL_DIRECT.LEFT) {
            direct = "left";
        } else if (i == WALL_DIRECT.RIGHT) {
            direct = "right";
        }
        const id = getTileIdByDirection(
            mapState.tiles,
            tile.coordinates,
            direct
        );

        // if(banTileIds.indexOf(id) == -1) {
          if (id != "") {
              const state = mapState.tiles.get(id);

              if ( edgeType == EDGE_TYPE.BASIC ) {
                  graph.addLink(tile.id, id, {
                      energyCost: 1,
                      blocked: banTileIds.indexOf(id) != -1 || banTileIds.indexOf(tile.id) != -1,
                      featherCost: 0
                  });
              } else if( edgeType == EDGE_TYPE.BRIDGE ) {

                  const id1 = getTileIdByDirection(
                      mapState.tiles,
                      state.coordinates,
                      direct
                  );
                  // if(banTileIds.indexOf(id1) == -1) {
                    if(state.type == TileType.DoubleBridge || state.type == TileType.HorizontalBridge || state.type == TileType.VerticalBridge) {
                        graph.addLink(tile.id, id1, {
                          energyCost: 2,
                          blocked: banTileIds.indexOf(id1) != -1,
                          featherCost: 0
                        });
                    }
                  // }

              } else if(edgeType == EDGE_TYPE.STAIR) {
                  const id1 = getTileIdByDirection(
                      mapState.tiles,
                      state.coordinates,
                      direct
                  );

                  // if(banTileIds.indexOf(id1) == -1) {
                    if(
                        ((state.type == TileType.StairsEW || state.type == TileType.StairsWE) && (i == WALL_DIRECT.RIGHT || i == WALL_DIRECT.LEFT)) ||
                        ((state.type == TileType.StairsNS || state.type == TileType.StairsSN) && (i == WALL_DIRECT.TOP || i == WALL_DIRECT.DOWN))
                    ) {
                        graph.addLink(tile.id, id1, {
                          energyCost: 2,
                          blocked: banTileIds.indexOf(id1) != -1,
                          featherCost: 0
                        });
                    }
                  // }
              } else if((edgeType == EDGE_TYPE.WALL || edgeType == EDGE_TYPE.CLIFF) && isFeather) {
                graph.addLink(tile.id, id, {
                  energyCost: featherStep,
                  blocked: banTileIds.indexOf(id) != -1 || banTileIds.indexOf(tile.id) != -1,
                  featherCost: 1
                });
              }
          }
        // } 
      });
    });

    return graph;
  }
}

////
export class PathfinderByID {
  private _mapState: MapState = null;
  private _navGraph: Graph<any, NavGraphLinkData> = null;
  private _pathFinder: NGraphPathFinder<any> = null;

  static fromMapState(mapState: MapState): PathfinderByID {
    // build nav graph
    const graph = createGraph<any, NavGraphLinkData>();
    for (const [key, item] of mapState.adjacencyList.entries()) {
      for (const edge of item.edges) {
        // @kyle - I had to add this check, otherwise the pathfinder wasn't working
        // correctly after moving to the database. Maybe its because the energyCost
        // now always exists, but will be null? Im not sure.
        if (edge.energyCost) {
          graph.addLink(edge.from, edge.to, {
            energyCost: edge.energyCost,
          });
        }
      }
    }
    const p = new PathfinderByID();
    p._mapState = mapState;
    p._navGraph = graph;
    p._pathFinder = aStar(p._navGraph, {
      distance(fromNode, toNode, link) {
        return link.data.energyCost;
      },
    });
    return p;
  }

  find(from: string, to: string): FindPathResult {
    const _path = this._pathFinder.find(from, to);
    try {
      const cost = getPathCost(_path, this._mapState.adjacencyList);
      const path: PathStep[] = _path.map((node) => {
        return {
          tileId: node.id as string,
          // coord: { x: -69, y: -69 }
        };
      });
      path.reverse();
      return {
        foundPath: true,
        cost,
        path,
      };
    } catch (e) {
      console.error("Error finding path", e);
      return {
        foundPath: false,
        cost: 0,
        path: [],
      };
    }
  }
}
