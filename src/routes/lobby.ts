import { USER_TYPE } from "#assets/resources";
import { RoomCache } from "#game/RoomCache";
import { UfbRoom } from "#game/UfbRoom";
import { safetyNet } from "#middleware/safetyNet";
import { validate } from "#middleware/validate";
import { RESPONSE_TYPE } from "#shared-types";
import { Handler, Router } from "express";
import { body } from "express-validator";

const getRoomDataById: Handler = async (req: any, res: any) => {
    const { roomId } = req.body;
    
    const room = RoomCache.get(roomId) as UfbRoom;

    if(room == null) {
        const response = {
            error: RESPONSE_TYPE.NOT_EXIST
        };
        res.send(response);
        return;
    }

    console.log(room.sessionIdToPlayerId.values.length);
    const characterList: any = [];
    room.state.characters.forEach(data => {
        if(data.type == USER_TYPE.USER){
            characterList.push({
                id: data.characterId,
                name: data.displayName,
                characterClass: data.characterClass
            }) 
        }

    })

    const roomData = {
        id : room.roomId,
        name: room.roomName,
        ownerId : room.roomOption.createOptions.ownerId,
        inviteToken: room.inviteToken,
        members: characterList
    };
    console.log("data", ".....", roomData)

    res.send(roomData)
}

const getAllRoomData: Handler = async (req: any, res: any) => {
    const rooms = RoomCache.getRoom();

    const roomAll: any = [];
    rooms.forEach(rm => {
        const room = rm as UfbRoom;

        const characterList: any = [];
        room.state.characters.forEach(data => {
            characterList.push({
                id: data.characterId,
                name: data.displayName,
                characterClass: data.characterClass
            }) 
        })

        const roomData = {
            id : room.roomId,
            name: room.roomName,
            ownerId : room.roomOption.createOptions.onwerId,
            inviteToken: room.inviteToken,
            characters: characterList
        };

        roomAll.push(roomData);
    });

    res.send({
        error: RESPONSE_TYPE.SUCCESS,
        data: roomAll
    })
}

const router: Router = Router();
export default router;

router.post("/get-room",
    body("roomId").isString().withMessage("Invalid room id"),
    validate,
    safetyNet(getRoomDataById)
);

router.post("/get-room-all",
    body("roomId").isString().withMessage("Invalid room id"),
    validate,
    safetyNet(getAllRoomData)
);