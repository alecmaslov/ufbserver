-- CreateTable
CREATE TABLE `CharacterTest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `traits` JSON NULL,
    `ownerId` VARCHAR(191) NULL,
    `nftId` VARCHAR(191) NULL,
    `className` VARCHAR(191) NOT NULL,
    `maxEnergy` VARCHAR(191) NOT NULL,
    `energy` VARCHAR(191) NOT NULL,
    `maxHealth` VARCHAR(191) NOT NULL,
    `health` VARCHAR(191) NOT NULL,
    `ultimate` VARCHAR(191) NOT NULL,
    `maxUltimate` VARCHAR(191) NOT NULL,
    `gold` VARCHAR(191) NOT NULL,
    `melee` VARCHAR(191) NOT NULL,
    `maxMelee` VARCHAR(191) NOT NULL,
    `mana` VARCHAR(191) NOT NULL,
    `maxMana` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CharacterTest_name_key`(`name`),
    UNIQUE INDEX `CharacterTest_nftId_key`(`nftId`),
    INDEX `character_token_className_fkey`(`className`),
    INDEX `character_token_ownerId_fkey`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
