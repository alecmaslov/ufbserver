export const CLIENT_SERVER_MESSAGE = {
    GET_HIGHLIGHT_RECT: "GET_HIGHLIGHT_RECT",
    SET_DICE_ROLL: "SET_DICE_ROLL",
    SET_POWER_MOVE_ITEM: "SET_POWER_MOVE_ITEM",
    SET_MOVE_ITEM: "SET_MOVE_ITEM",
    END_POWER_MOVE_ITEM: "END_POWER_MOVE_ITEM",
}

export const SERVER_TO_CLIENT_MESSAGE = {
    INIT_TURN : "InitTurn",
    TURN_CHANGED : "turnChanged",
    SPAWN_INIT : "spawnInit",
    RECEIVE_POWERMOVE_LIST : "ReceivePowerMoveList",
    RECEIVE_MOVEITEM : "ReceiveMoveItem",
    SET_MOVEITEM : "SetMoveItem",
    ADD_EXTRA_SCORE : "addExtraScore",
    GET_BOMB_DAMAGE : "getBombDamage",
    GET_MERCHANT_DATA : "getMerchantData",
    RESPAWN_MERCHANT : "respawnMerchant",
    UNEQUIP_POWER_RECEIVED : "unEquipPowerReceived",
    CHARACTER_MOVED : "characterMoved",
    SET_HIGHLIGHT_RECT : "setHighLightRect",
    SET_DICE_ROLL : "SET_DICE_ROLL",
    ENEMY_DICE_ROLL: "ENEMY_DICE_ROLL"
}
