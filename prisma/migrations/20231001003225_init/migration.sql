/*
  Warnings:

  - The values [Bridge,Portal] on the enum `TileAdjacency_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `TileAdjacency` MODIFY `type` ENUM('Basic', 'OverBridge', 'UnderBridge', 'Wall', 'Void') NOT NULL;

-- CreateTable
CREATE TABLE `SpawnZone` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('Merchant', 'Portal', 'Enemy', 'Chest') NOT NULL,
    `seedId` INTEGER NOT NULL,
    `tileId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SpawnZone` ADD CONSTRAINT `SpawnZone_tileId_fkey` FOREIGN KEY (`tileId`) REFERENCES `Tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
