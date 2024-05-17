/*
  Warnings:

  - You are about to drop the `NFT` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CharacterToken` DROP FOREIGN KEY `CharacterToken_nftId_fkey`;

-- DropTable
DROP TABLE `NFT`;

-- CreateTable
CREATE TABLE `Nft` (
    `id` VARCHAR(191) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `tokenId` INTEGER NOT NULL,
    `tokenUri` VARCHAR(191) NULL,
    `tokenHolderAddress` VARCHAR(191) NOT NULL,
    `tokenHolderName` VARCHAR(191) NULL,

    UNIQUE INDEX `Nft_contractAddress_tokenId_key`(`contractAddress`, `tokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CharacterToken` ADD CONSTRAINT `CharacterToken_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `Nft`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
