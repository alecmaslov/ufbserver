-- CreateTable
CREATE TABLE `Asset` (
    `objectKey` VARCHAR(191) NOT NULL,
    `bucketName` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`objectKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BundleAsset` (
    `id` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BundleAsset` ADD CONSTRAINT `BundleAsset_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `Asset`(`objectKey`) ON DELETE RESTRICT ON UPDATE CASCADE;
