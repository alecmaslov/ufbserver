-- CreateTable
CREATE TABLE `solo_save` (
    `ownerId` VARCHAR(191) NOT NULL,
    `mapName` VARCHAR(191) NOT NULL,
    `heroClass` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `turn` INTEGER NOT NULL,
    `state` MEDIUMBLOB NOT NULL,
    `extra` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ownerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
