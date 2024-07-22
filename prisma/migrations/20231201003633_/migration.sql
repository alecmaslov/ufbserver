/*
  Warnings:

  - You are about to drop the column `description` on the `nft` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `character_token` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `nft` DROP COLUMN `description`;

-- CreateIndex
CREATE UNIQUE INDEX `character_token_name_key` ON `character_token`(`name`);
