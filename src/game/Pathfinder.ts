import createGraph, { Graph } from "ngraph.graph";
import { MapState } from "./schema/MapState";
import { aStar, PathFinder as NGraphPathFinder } from "ngraph.path";
import { PathStep } from "#shared-types";
import { getPathCost, tileIdToCoord } from "./map-helpers";

export type NavGraphLinkData = {
    energyCost: number;
}

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
        for (const [key, item] of mapState.adjacencyList.entries()) {
            for (const edge of item.edges) {
                graph.addLink(edge.from, edge.to, {
                    energyCost: edge.energyCost,
                });
            }
        }
        const p = new Pathfinder();
        p._mapState = mapState;
        p._navGraph = graph;
        p._pathFinder = aStar(p._navGraph, {
            distance(fromNode, toNode, link) {
                return link.data.energyCost;
            }
        });
        return p;
    }

    find(from: string, to: string): FindPathResult {
        const _path = this._pathFinder.find(from, to);
        try {
            const cost = getPathCost(_path, this._mapState.adjacencyList);
            const path: PathStep[] = _path.map(node => {
                return {
                    tileId: node.id as string,
                    // coord: { x: -69, y: -69 } 
                    // tileIdToCoord(node.id as string)
                };
            });
            path.reverse();
            return {
                foundPath: true,
                cost,
                path
            };
        }
        catch (e) {
            console.error("Error finding path", e);
            return {
                foundPath: false,
                cost: 0,
                path: []
            };
        }
    }
}