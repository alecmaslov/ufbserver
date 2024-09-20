import { EDGE_TYPE, WALL_DIRECT } from "#assets/resources";
import { getPathCost, getTileIdByDirection } from "#game/helpers/map-helpers";
import { MapState } from "#game/schema/MapState";
import { PathStep } from "#shared-types";
import createGraph, { Graph } from "ngraph.graph";
import { aStar, PathFinder as NGraphPathFinder } from "ngraph.path";

export type NavGraphLinkData = {
    energyCost: number;
};

export interface FindPathResult {
    foundPath: boolean;
    cost: number;
    path: PathStep[];
}

export class Pathfinder {
    private _mapState: MapState = null;
    private _navGraph: Graph<any, NavGraphLinkData> = null;
    private _pathFinder: NGraphPathFinder<any> = null;

    static fromMapState(mapState: MapState): Pathfinder {
        // build nav graph
        const graph = createGraph<any, NavGraphLinkData>();

        mapState.tiles.forEach(tile => {
            tile.walls.forEach((edgeType, i) => {
                let direct = "";
                if(i == WALL_DIRECT.TOP) {
                    direct = "top";
                } else if(i == WALL_DIRECT.DOWN) {
                    direct = "down";
                } else if(i == WALL_DIRECT.LEFT) {
                    direct = "left";
                } else if(i == WALL_DIRECT.RIGHT) {
                    direct = "right";
                }
                const id = getTileIdByDirection(mapState.tiles, tile.coordinates, direct);
                if(id != "") {
                    if(edgeType == EDGE_TYPE.BASIC || edgeType == EDGE_TYPE.CLIFF || edgeType == EDGE_TYPE.BRIDGE || edgeType == EDGE_TYPE.STAIR) {
                        graph.addLink(tile.id, id, {
                            energyCost: edgeType,
                        });
                    }
                }
            })
        })

        // for (const [key, item] of mapState.adjacencyList.entries()) {
        //     for (const edge of item.edges) {
        //         // @kyle - I had to add this check, otherwise the pathfinder wasn't working
        //         // correctly after moving to the database. Maybe its because the energyCost
        //         // now always exists, but will be null? Im not sure.
        //         if (edge.energyCost) {
        //             graph.addLink(edge.from, edge.to, {
        //                 energyCost: edge.energyCost,
        //             });
        //         }
        //     }
        // }
        const p = new Pathfinder();
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
