-- CreateTable
CREATE TABLE `Tile` (
    `id` VARCHAR(191) NOT NULL,
    `tileCode` VARCHAR(191) NOT NULL,
    `mapId` VARCHAR(191) NOT NULL,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `legacyCode` VARCHAR(191) NULL,
    `textureUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `Tile_tileCode_mapId_key`(`tileCode`, `mapId`),
    UNIQUE INDEX `Tile_x_y_mapId_key`(`x`, `y`, `mapId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TileAdjacency` (
    `id` VARCHAR(191) NOT NULL,
    `fromId` VARCHAR(191) NOT NULL,
    `toId` VARCHAR(191) NOT NULL,
    `type` ENUM('BASIC', 'BRIDGE', 'PORTAL') NOT NULL,
    `energyCost` INTEGER NOT NULL,
    `tileId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tile` ADD CONSTRAINT `Tile_mapId_fkey` FOREIGN KEY (`mapId`) REFERENCES `UfbMap`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TileAdjacency` ADD CONSTRAINT `TileAdjacency_fromId_fkey` FOREIGN KEY (`fromId`) REFERENCES `Tile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TileAdjacency` ADD CONSTRAINT `TileAdjacency_toId_fkey` FOREIGN KEY (`toId`) REFERENCES `Tile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TileAdjacency` ADD CONSTRAINT `TileAdjacency_tileId_fkey` FOREIGN KEY (`tileId`) REFERENCES `Tile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
