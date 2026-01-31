-- CreateTable
CREATE TABLE `client` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `platform` ENUM('WEB', 'ANDROID', 'IOS', 'STEAM', 'UNITY_EDITOR') NOT NULL DEFAULT 'WEB',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Client_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `gold` INTEGER NOT NULL DEFAULT 0,
    `email` VARCHAR(191) NOT NULL,
    `profileImageUrl` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `gamesession` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hostClientId` VARCHAR(191) NOT NULL,

    INDEX `GameSession_hostClientId_fkey`(`hostClientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `gameSessionId` VARCHAR(191) NOT NULL,
    `lastSeen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Player_clientId_fkey`(`clientId`),
    INDEX `Player_gameSessionId_fkey`(`gameSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `playergamestate` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `energy` INTEGER NOT NULL,
    `health` INTEGER NOT NULL,

    INDEX `PlayerGameState_playerId_fkey`(`playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gamesessionstate` (
    `id` VARCHAR(191) NOT NULL,
    `gameSessionId` VARCHAR(191) NOT NULL,

    INDEX `GameSessionState_gameSessionId_fkey`(`gameSessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset` (
    `objectKey` VARCHAR(191) NOT NULL,
    `bucketName` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`objectKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bundleasset` (
    `id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,

    INDEX `BundleAsset_assetId_fkey`(`assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ufbmap` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `gridWidth` INTEGER NOT NULL,
    `gridHeight` INTEGER NOT NULL,
    `publisher` VARCHAR(191) NULL,
    `resourceAddress` VARCHAR(191) NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tile` (
    `id` VARCHAR(191) NOT NULL,
    `tileCode` VARCHAR(191) NOT NULL,
    `mapId` VARCHAR(191) NOT NULL,
    `x` INTEGER NOT NULL,
    `y` INTEGER NOT NULL,
    `legacyCode` VARCHAR(191) NULL,
    `type` ENUM('VerticalBridge', 'HorizontalBridge', 'DoubleBridge', 'Void', 'StairsNS', 'StairsSN', 'StairsEW', 'StairsWE', 'Upper', 'Lower', 'OpenTile', 'BlockNorth', 'BlockEast', 'BlockSouth', 'BlockWest', 'BlockNS', 'BlockEW', 'BlockNE', 'BlockES', 'BlockSW', 'BlockNW', 'BlockESW', 'BlockSWN', 'BlockWNE', 'BlockNES') NOT NULL DEFAULT 'OpenTile',
    `walls` JSON NULL,

    INDEX `Tile_mapId_fkey`(`mapId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spawnzone` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('Merchant', 'Portal', 'Monster', 'Chest') NOT NULL,
    `seedId` INTEGER NOT NULL,
    `tileId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `spawnzone_tileId_key`(`tileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tileadjacency` (
    `id` VARCHAR(191) NOT NULL,
    `fromId` VARCHAR(191) NOT NULL,
    `toId` VARCHAR(191) NOT NULL,
    `type` ENUM('Basic', 'OverBridge', 'UnderBridge', 'Wall', 'Void') NOT NULL,
    `energyCost` INTEGER NULL,
    `tileId` VARCHAR(191) NULL,

    INDEX `TileAdjacency_tileId_fkey`(`tileId`),
    INDEX `TileAdjacency_toId_fkey`(`toId`),
    UNIQUE INDEX `tileadjacency_fromId_toId_key`(`fromId`, `toId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `connectedbrowser` (
    `ipAddress` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `disconnectedAt` DATETIME(3) NULL,

    INDEX `ConnectedBrowser_clientId_fkey`(`clientId`),
    PRIMARY KEY (`ipAddress`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_class` (
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `cardUrl` VARCHAR(191) NULL,
    `sketchfabUrl` VARCHAR(191) NULL,
    `ultimateMove` VARCHAR(191) NOT NULL DEFAULT 'None',

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `character_token` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `traits` JSON NULL,
    `ownerId` VARCHAR(191) NULL,
    `nftId` VARCHAR(191) NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `className` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `character_token_nftId_key`(`nftId`),
    INDEX `character_token_className_fkey`(`className`),
    INDEX `character_token_ownerId_fkey`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `charactertest` (
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

    UNIQUE INDEX `charactertest_name_key`(`name`),
    UNIQUE INDEX `charactertest_nftId_key`(`nftId`),
    INDEX `character_token_className_fkey`(`className`),
    INDEX `character_token_ownerId_fkey`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

    UNIQUE INDEX `character_data_userId_characterId_key`(`userId`, `characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nft` (
    `id` VARCHAR(191) NOT NULL,
    `tokenId` VARCHAR(191) NOT NULL,
    `contractAddress` VARCHAR(191) NOT NULL,
    `tokenUri` VARCHAR(191) NOT NULL,
    `tokenHolderAddress` VARCHAR(191) NOT NULL,
    `tokenHolderName` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `tokenHolderUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `nft_contractAddress_tokenId_key`(`contractAddress`, `tokenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `slug` VARCHAR(191) NULL,

    PRIMARY KEY (`address`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `god_level_nft` (
    `characterClassName` VARCHAR(191) NOT NULL,
    `nftId` VARCHAR(191) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `god_level_nft_characterClassName_key`(`characterClassName`),
    UNIQUE INDEX `god_level_nft_nftId_key`(`nftId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `nftId` VARCHAR(191) NULL,

    UNIQUE INDEX `item_nftId_key`(`nftId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `itembehavior` (
    `id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `client` ADD CONSTRAINT `client_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_data` ADD CONSTRAINT `user_data_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gamesession` ADD CONSTRAINT `gamesession_hostClientId_fkey` FOREIGN KEY (`hostClientId`) REFERENCES `client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player` ADD CONSTRAINT `player_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player` ADD CONSTRAINT `player_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `gamesession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `playergamestate` ADD CONSTRAINT `playergamestate_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gamesessionstate` ADD CONSTRAINT `gamesessionstate_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `gamesession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bundleasset` ADD CONSTRAINT `bundleasset_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `asset`(`objectKey`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tile` ADD CONSTRAINT `tile_mapId_fkey` FOREIGN KEY (`mapId`) REFERENCES `ufbmap`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spawnzone` ADD CONSTRAINT `spawnzone_tileId_fkey` FOREIGN KEY (`tileId`) REFERENCES `tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tileadjacency` ADD CONSTRAINT `tileadjacency_fromId_fkey` FOREIGN KEY (`fromId`) REFERENCES `tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tileadjacency` ADD CONSTRAINT `tileadjacency_tileId_fkey` FOREIGN KEY (`tileId`) REFERENCES `tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tileadjacency` ADD CONSTRAINT `tileadjacency_toId_fkey` FOREIGN KEY (`toId`) REFERENCES `tile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `connectedbrowser` ADD CONSTRAINT `connectedbrowser_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_className_fkey` FOREIGN KEY (`className`) REFERENCES `character_class`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `nft`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_data` ADD CONSTRAINT `character_data_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_data` ADD CONSTRAINT `character_data_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `character_token`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nft` ADD CONSTRAINT `nft_contractAddress_fkey` FOREIGN KEY (`contractAddress`) REFERENCES `nft_contract`(`address`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `god_level_nft` ADD CONSTRAINT `god_level_nft_characterClassName_fkey` FOREIGN KEY (`characterClassName`) REFERENCES `character_class`(`name`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `god_level_nft` ADD CONSTRAINT `god_level_nft_nftId_fkey` FOREIGN KEY (`nftId`) REFERENCES `nft`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
