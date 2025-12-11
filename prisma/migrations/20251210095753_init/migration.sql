-- AlterTable
ALTER TABLE `character_token` ADD COLUMN `level` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `user_data` (
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

    UNIQUE INDEX `user_data_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_data` ADD CONSTRAINT `user_data_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
