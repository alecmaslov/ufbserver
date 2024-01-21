/*
  Warnings:

  - You are about to drop the column `tokenAddress` on the `Character` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contractAddress,tokenId]` on the table `Character` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contractAddress` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenId` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Character_tokenAddress_key` ON `Character`;

-- AlterTable
ALTER TABLE `Character` DROP COLUMN `tokenAddress`,
    ADD COLUMN `contractAddress` VARCHAR(191) NOT NULL,
    ADD COLUMN `ownerName` VARCHAR(191) NULL,
    ADD COLUMN `tokenHolder` VARCHAR(191) NULL,
    ADD COLUMN `tokenId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Character_contractAddress_tokenId_key` ON `Character`(`contractAddress`, `tokenId`);

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
