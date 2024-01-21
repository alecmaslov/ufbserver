/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `character_token` table. All the data in the column will be lost.
  - You are about to drop the column `cardUrl` on the `character_token` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `character_token` DROP COLUMN `avatarUrl`,
    DROP COLUMN `cardUrl`;
