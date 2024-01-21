/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `cardUrl` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `class` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `sketchfabUrl` on the `Character` table. All the data in the column will be lost.
  - Added the required column `classId` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Character` DROP COLUMN `avatarUrl`,
    DROP COLUMN `cardUrl`,
    DROP COLUMN `class`,
    DROP COLUMN `sketchfabUrl`,
    ADD COLUMN `classId` VARCHAR(191) NOT NULL,
    ADD COLUMN `ownerId` VARCHAR(191) NULL,
    ADD COLUMN `tokenAddress` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `CharacterClass` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `cardUrl` VARCHAR(191) NULL,
    `sketchfabUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `CharacterClass`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
