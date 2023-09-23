// import { Coordinates } from "#shared-types";
// import { UfbRoom } from "./UfbRoom";
// import { createId } from "@paralleldrive/cuid2";

// interface GameItem<TData> {
//     id: string;
//     // typeId: string;
//     canPickUp: boolean;
//     canUse: boolean;
//     data: TData;
//     onPickedUp?: <TOpts>(room: UfbRoom, playerId: string, options: TOpts) => void;
//     /** not applicable to items which are picked up */
//     onWalkOver?: (room: UfbRoom, playerId: string) => void;
//     onUse?: <TOpts>(room: UfbRoom, playerId: string, options: TOpts) => void;
// }

// interface PortalData {
//     destinationPortalId: string;
// }

// function teleportPlayer(room: UfbRoom, playerId: string, destinationPortalId: string) {
//     const player = room.state.players.get(playerId);
//     if (!player) {
//         return;
//     }
// }

// class GameItemFactory {
//     createPortals(c0: Coordinates, c1: Coordinates) {
//         const basePortal: GameItem<PortalData> = {
//             id: "",
//             canPickUp: false,
//             canUse: false,
//             data: {
//                 destinationPortalId: ""
//             }
//         };

//         const id0 = createId();
//         const id1 = createId();

//         const portal0: GameItem<PortalData> = {
//             ...basePortal,
//             id: createId(),
//             data: {
//                 destinationPortalId: id1
//             },
//             onWalkOver: (room, playerId) => {

//         };

//         const portal1: GameItem<PortalData> = {
//             ...basePortal,
//             id: createId(),
//             data: {
//                 destinationPortalId: id0
//             }
//         };

//         return [portal0, portal1];
//     }
// }