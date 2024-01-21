/*
  Warnings:

  - You are about to drop the `Character` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Character` DROP FOREIGN KEY `Character_classId_fkey`;

-- DropForeignKey
ALTER TABLE `Character` DROP FOREIGN KEY `Character_ownerId_fkey`;

-- DropTable
DROP TABLE `Character`;

-- CreateTable
CREATE TABLE `CharacterToken` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `traits` JSON NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `tokenId` INTEGER NOT NULL,
    `tokenHolder` VARCHAR(191) NULL,
    `ownerName` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NULL,

    UNIQUE INDEX `CharacterToken_contractAddress_tokenId_key`(`contractAddress`, `tokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CharacterToken` ADD CONSTRAINT `CharacterToken_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `CharacterClass`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterToken` ADD CONSTRAINT `CharacterToken_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
