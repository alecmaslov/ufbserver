/*
  Warnings:

  - You are about to drop the `CharacterClass` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CharacterToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CharacterToken` DROP FOREIGN KEY `CharacterToken_classId_fkey`;

-- DropForeignKey
ALTER TABLE `CharacterToken` DROP FOREIGN KEY `CharacterToken_nftId_fkey`;

-- DropForeignKey
ALTER TABLE `CharacterToken` DROP FOREIGN KEY `CharacterToken_ownerId_fkey`;

-- DropTable
DROP TABLE `CharacterClass`;

-- DropTable
DROP TABLE `CharacterToken`;

-- CreateTable
CREATE TABLE `character_class` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `cardUrl` VARCHAR(191) NULL,
    `sketchfabUrl` VARCHAR(191) NULL,
    `ultimateMove` VARCHAR(191) NOT NULL DEFAULT 'None',

    UNIQUE INDEX `character_class_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_token` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `traits` JSON NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `cardUrl` VARCHAR(191) NULL,
    `classId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NULL,
    `nftId` VARCHAR(191) NULL,

    UNIQUE INDEX `character_token_nftId_key`(`nftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `character_class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `nft`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
