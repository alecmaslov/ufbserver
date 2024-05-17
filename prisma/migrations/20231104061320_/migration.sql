-- CreateTable
CREATE TABLE `ConnectedBrowser` (
    `ipAddress` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `disconnectedAt` DATETIME(3) NULL,

    PRIMARY KEY (`ipAddress`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Character` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `class` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `cardUrl` VARCHAR(191) NULL,
    `sketchfabUrl` VARCHAR(191) NULL,
    `traits` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConnectedBrowser` ADD CONSTRAINT `ConnectedBrowser_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
