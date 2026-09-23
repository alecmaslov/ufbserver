-- CreateTable
CREATE TABLE `figurine` (
    `id` VARCHAR(191) NOT NULL,
    `className` VARCHAR(191) NOT NULL,
    `claimHash` VARCHAR(191) NOT NULL,
    `nfcUid` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NULL,
    `characterId` VARCHAR(191) NULL,
    `claimedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `figurine_claimHash_key`(`claimHash`),
    UNIQUE INDEX `figurine_nfcUid_key`(`nfcUid`),
    UNIQUE INDEX `figurine_characterId_key`(`characterId`),
    INDEX `figurine_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `figurine` ADD CONSTRAINT `figurine_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `figurine` ADD CONSTRAINT `figurine_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `character_token`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

