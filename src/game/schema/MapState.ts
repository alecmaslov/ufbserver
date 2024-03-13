import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import { CoordinatesState } from "#game/schema/CharacterState";
import { TileType, AdjacencyType, SpawnZoneType } from "@prisma/client";
import { UFBMap, SpawnEntityType, Spawnable } from "#game/types/map-types";

// chests, merchants, maybe small loot sacks
// monsters will be considered characters
export class SpawnEntity extends Schema {
    @type("string") id: string = "";
    @type("string") gameId: string = ""; // e.g. "chest_12"
    @type("string") prefabAddress: string = ""; // e.g. "prefabs/chest"
    @type("string") type: SpawnZoneType = "Chest"; // tells the client what to load
    @type("string") tileId: string = ""; // where to spawn
    @type("string") parameters: string = ""; // e.g. "seedId=1234"
}

export class TileState extends Schema {
    @type("string") id: string = "";
    @type("string") tileCode: string = ""; // e.g. "tile_A_1"
    @type("string") type: TileType = "Default";
    @type(["uint8"]) walls: ArraySchema<number> = new ArraySchema<number>(); // @kyle - Added walls
    @type(CoordinatesState) coordinates: CoordinatesState =
        new CoordinatesState();
}

export class TileEdgeState extends Schema {
    @type("string") from: string = "";
    @type("string") to: string = "";
    @type("string") type: AdjacencyType = "Basic";
    @type("number") energyCost: number = 1;
}

export class AdjacencyListItemState extends Schema {
    @type([TileEdgeState]) edges = new ArraySchema<TileEdgeState>();
}

// export class MapConfigurationState extends Schema {
//     @type("string") name: string = "";
//     @type("string") resourceAddress: string = "";
//     @type("number") gridWidth: number = 0;
//     @type("number") gridHeight: number = 0;
// }

export class MapState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "";
    @type("string") resourceAddress: string = ""; // address of the map image file
    @type("number") gridWidth: number = 0;
    @type("number") gridHeight: number = 0;
    @type({ map: TileState }) tiles = new MapSchema<TileState>();
    @type({ map: AdjacencyListItemState }) adjacencyList =
        new MapSchema<AdjacencyListItemState>();
    @type([SpawnEntity]) spawnEntities = new ArraySchema<SpawnEntity>();

    /** raw representation for internal use */
    _map: UFBMap | null = null;
}
