-- CreateTable
CREATE TABLE `character_data` (
    `id` VARCHAR(191) NOT NULL,
    `gold` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `kills` INTEGER NOT NULL DEFAULT 0,
    `battles` INTEGER NOT NULL DEFAULT 0,
    `damage_taken` INTEGER NOT NULL DEFAULT 0,
    `item_bags` INTEGER NOT NULL DEFAULT 0,
    `used_energies` INTEGER NOT NULL DEFAULT 0,
    `damage_deal` INTEGER NOT NULL DEFAULT 0,
    `used_stacks` INTEGER NOT NULL DEFAULT 0,
    `damage_heal` INTEGER NOT NULL DEFAULT 0,
    `collect_golds` INTEGER NOT NULL DEFAULT 0,
    `traveled_tiles` INTEGER NOT NULL DEFAULT 0,
    `chests` INTEGER NOT NULL DEFAULT 0,
    `userId` VARCHAR(191) NOT NULL,
    `characterId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `character_data_userId_key`(`userId`),
    UNIQUE INDEX `character_data_characterId_key`(`characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character_data` ADD CONSTRAINT `character_data_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_data` ADD CONSTRAINT `character_data_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `character_token`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
