/*
  Warnings:

  - You are about to drop the `Nft` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CharacterToken` DROP FOREIGN KEY `CharacterToken_nftId_fkey`;

-- DropTable
DROP TABLE `Nft`;

-- CreateTable
CREATE TABLE `nft_contract` (
    `address` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `totalSupply` INTEGER NOT NULL,
    `tokenType` VARCHAR(191) NOT NULL,
    `contractDeployer` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `externalUrl` VARCHAR(191) NULL,
    `twitterUsername` VARCHAR(191) NULL,
    `discordUrl` VARCHAR(191) NULL,
    `bannerImageUrl` VARCHAR(191) NULL,
    `chainId` VARCHAR(191) NOT NULL DEFAULT 'ethereum',

    PRIMARY KEY (`address`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nft` (
    `id` VARCHAR(191) NOT NULL,
    `tokenId` VARCHAR(191) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `tokenUri` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `tokenHolderAddress` VARCHAR(191) NOT NULL,
    `tokenHolderName` VARCHAR(191) NULL,

    UNIQUE INDEX `nft_contractAddress_tokenId_key`(`contractAddress`, `tokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `nft` ADD CONSTRAINT `nft_contractAddress_fkey` FOREIGN KEY (`contractAddress`) REFERENCES `nft_contract`(`address`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterToken` ADD CONSTRAINT `CharacterToken_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `nft`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
