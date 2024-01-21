-- CreateTable
CREATE TABLE `god_level_nft` (
    `characterClassName` VARCHAR(191) NOT NULL,
    `nftId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `god_level_nft_characterClassName_key`(`characterClassName`),
    UNIQUE INDEX `god_level_nft_nftId_key`(`nftId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `god_level_nft` ADD CONSTRAINT `god_level_nft_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `nft`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `god_level_nft` ADD CONSTRAINT `god_level_nft_characterClassName_fkey` FOREIGN KEY (`characterClassName`) REFERENCES `character_class`(`name`) ON DELETE CASCADE ON UPDATE CASCADE;
