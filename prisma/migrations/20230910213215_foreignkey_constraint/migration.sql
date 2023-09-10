-- DropForeignKey
ALTER TABLE `Tile` DROP FOREIGN KEY `Tile_mapId_fkey`;

-- DropForeignKey
ALTER TABLE `TileAdjacency` DROP FOREIGN KEY `TileAdjacency_fromId_fkey`;

-- DropForeignKey
ALTER TABLE `TileAdjacency` DROP FOREIGN KEY `TileAdjacency_tileId_fkey`;

-- DropForeignKey
ALTER TABLE `TileAdjacency` DROP FOREIGN KEY `TileAdjacency_toId_fkey`;

-- AddForeignKey
ALTER TABLE `Tile` ADD CONSTRAINT `Tile_mapId_fkey` FOREIGN KEY (`mapId`) REFERENCES `UfbMap`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TileAdjacency` ADD CONSTRAINT `TileAdjacency_fromId_fkey` FOREIGN KEY (`fromId`) REFERENCES `Tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TileAdjacency` ADD CONSTRAINT `TileAdjacency_toId_fkey` FOREIGN KEY (`toId`) REFERENCES `Tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TileAdjacency` ADD CONSTRAINT `TileAdjacency_tileId_fkey` FOREIGN KEY (`tileId`) REFERENCES `Tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
