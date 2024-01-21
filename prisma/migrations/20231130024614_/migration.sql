/*
  Warnings:

  - You are about to drop the column `godLevel` on the `CharacterClass` table. All the data in the column will be lost.
  - You are about to drop the column `sketchfabId` on the `CharacterClass` table. All the data in the column will be lost.
  - You are about to drop the column `contractAddress` on the `CharacterToken` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `CharacterToken` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHolder` on the `CharacterToken` table. All the data in the column will be lost.
  - You are about to drop the column `tokenId` on the `CharacterToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nftId]` on the table `CharacterToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `CharacterToken_contractAddress_tokenId_key` ON `CharacterToken`;

-- AlterTable
ALTER TABLE `CharacterClass` DROP COLUMN `godLevel`,
    DROP COLUMN `sketchfabId`,
    ADD COLUMN `sketchfabUrl` VARCHAR(191) NULL,
    ADD COLUMN `ultimateMove` VARCHAR(191) NOT NULL DEFAULT 'None';

-- AlterTable
ALTER TABLE `CharacterToken` DROP COLUMN `contractAddress`,
    DROP COLUMN `ownerName`,
    DROP COLUMN `tokenHolder`,
    DROP COLUMN `tokenId`,
    ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `cardUrl` VARCHAR(191) NULL,
    ADD COLUMN `nftId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `NFT` (
    `id` VARCHAR(191) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `tokenId` INTEGER NOT NULL,
    `tokenUri` VARCHAR(191) NULL,
    `tokenHolderAddress` VARCHAR(191) NOT NULL,
    `tokenHolderName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `CharacterToken_nftId_key` ON `CharacterToken`(`nftId`);

-- AddForeignKey
ALTER TABLE `CharacterToken` ADD CONSTRAINT `CharacterToken_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `NFT`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
