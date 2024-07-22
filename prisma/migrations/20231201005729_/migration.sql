/*
  Warnings:

  - The primary key for the `character_class` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `character_class` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `character_token` table. All the data in the column will be lost.
  - Added the required column `className` to the `character_token` table without a default value. This is not possible if the table is not empty.
  - Made the column `tokenUri` on table `nft` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `character_token` DROP FOREIGN KEY `character_token_classId_fkey`;

-- DropForeignKey
ALTER TABLE `nft` DROP FOREIGN KEY `nft_contractAddress_fkey`;

-- DropIndex
DROP INDEX `character_class_name_key` ON `character_class`;

-- AlterTable
ALTER TABLE `character_class` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`name`);

-- AlterTable
ALTER TABLE `character_token` DROP COLUMN `classId`,
    ADD COLUMN `className` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `nft` MODIFY `tokenUri` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_className_fkey` FOREIGN KEY (`className`) REFERENCES `character_class`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nft` ADD CONSTRAINT `nft_contractAddress_fkey` FOREIGN KEY (`contractAddress`) REFERENCES `nft_contract`(`address`) ON DELETE CASCADE ON UPDATE CASCADE;
