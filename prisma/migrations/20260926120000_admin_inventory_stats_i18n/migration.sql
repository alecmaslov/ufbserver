-- Admin: figurine inventory + sales, match statistics, language events.

-- AlterTable
ALTER TABLE `figurine`
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'in_stock',
    ADD COLUMN `batch` VARCHAR(191) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `saleId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `sale` (
    `id` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `orderRef` VARCHAR(191) NULL,
    `buyerName` VARCHAR(191) NULL,
    `buyerEmail` VARCHAR(191) NULL,
    `shipTo` TEXT NULL,
    `totalCents` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `soldAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `shippedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sale_soldAt_idx`(`soldAt`),
    UNIQUE INDEX `sale_channel_orderRef_key`(`channel`, `orderRef`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_record` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL,
    `mapName` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `endReason` VARCHAR(191) NULL,
    `turns` INTEGER NOT NULL DEFAULT 0,
    `rounds` INTEGER NOT NULL DEFAULT 0,
    `humans` INTEGER NOT NULL DEFAULT 0,

    INDEX `match_record_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_player` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `isGuest` BOOLEAN NOT NULL DEFAULT true,
    `heroClass` VARCHAR(191) NOT NULL,
    `heroLevel` INTEGER NOT NULL DEFAULT 1,
    `lang` VARCHAR(191) NULL,
    `place` INTEGER NULL,
    `result` VARCHAR(191) NULL,
    `diedTurn` INTEGER NULL,
    `killedBy` VARCHAR(191) NULL,
    `damageDealt` INTEGER NOT NULL DEFAULT 0,
    `damageTaken` INTEGER NOT NULL DEFAULT 0,
    `healed` INTEGER NOT NULL DEFAULT 0,
    `tilesMoved` INTEGER NOT NULL DEFAULT 0,
    `energyUsed` INTEGER NOT NULL DEFAULT 0,
    `stacksUsed` INTEGER NOT NULL DEFAULT 0,
    `playerKills` INTEGER NOT NULL DEFAULT 0,
    `monsterKills` INTEGER NOT NULL DEFAULT 0,
    `goldEarned` INTEGER NOT NULL DEFAULT 0,
    `turnsPlayed` INTEGER NOT NULL DEFAULT 0,
    `moves` JSON NULL,
    `items` JSON NULL,
    `equipped` JSON NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,

    INDEX `match_player_heroClass_idx`(`heroClass`),
    INDEX `match_player_playerId_idx`(`playerId`),
    UNIQUE INDEX `match_player_matchId_playerId_key`(`matchId`, `playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lang_event` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `vid` VARCHAR(64) NOT NULL,
    `lang` VARCHAR(8) NOT NULL,
    `fromLang` VARCHAR(8) NULL,
    `toLang` VARCHAR(8) NULL,
    `source` VARCHAR(16) NULL,
    `path` VARCHAR(191) NOT NULL,
    `browser` VARCHAR(32) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lang_event_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `lang_event_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `figurine_saleId_idx` ON `figurine`(`saleId`);

-- CreateIndex
CREATE INDEX `figurine_status_idx` ON `figurine`(`status`);

-- AddForeignKey
ALTER TABLE `figurine` ADD CONSTRAINT `figurine_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_player` ADD CONSTRAINT `match_player_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `match_record`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
