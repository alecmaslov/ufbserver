-- AlterTable
ALTER TABLE `user` ADD COLUMN `crystals` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `character_token` ADD COLUMN `elements` JSON NULL,
    ADD COLUMN `keystones` JSON NULL;

-- CreateTable
CREATE TABLE `character_skill` (
    `id` VARCHAR(191) NOT NULL,
    `characterId` VARCHAR(191) NOT NULL,
    `element` VARCHAR(191) NOT NULL,
    `slot` INTEGER NOT NULL,
    `nodeIndex` INTEGER NOT NULL,
    `cost` INTEGER NOT NULL,
    `purchasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `character_skill_characterId_idx`(`characterId`),
    UNIQUE INDEX `character_skill_characterId_slot_nodeIndex_key`(`characterId`, `slot`, `nodeIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character_skill` ADD CONSTRAINT `character_skill_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `character_token`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

