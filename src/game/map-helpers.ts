import { ok } from "assert";
import { Node } from "ngraph.graph";
import { MapSchema } from "@colyseus/schema";
import { CoordinatesState } from "./schema/CharacterState";
import { AdjacencyListItemState } from "./schema/MapState";

const TILE_LETTERS = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

export const coordToTileId = (coordinates: CoordinatesState): string => {
    return `tile_${TILE_LETTERS[coordinates.y]}_${coordinates.x + 1}`;
};

export const tileIdToCoord = (tileId: string): CoordinatesState => {
    const parts = tileId.split("_");
    const y = TILE_LETTERS.indexOf(parts[1]);
    const x = parseInt(parts[2]) - 1;
    const c = { x, y } as CoordinatesState;
    ok(coordToTileId(c) === tileId);
    return c;
};

export const getPathCost = (p: Node<any>[], adjacencyList: MapSchema<AdjacencyListItemState, string>) => {
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
