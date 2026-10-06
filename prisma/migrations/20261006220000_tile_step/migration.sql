-- CreateTable
CREATE TABLE `tile_step` (
    `mapName` VARCHAR(64) NOT NULL,
    `tileId` VARCHAR(64) NOT NULL,
    `steps` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tile_step_mapName_steps_idx`(`mapName`, `steps`),
    PRIMARY KEY (`mapName`, `tileId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

