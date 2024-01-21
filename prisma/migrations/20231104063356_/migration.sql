/*
  Warnings:

  - You are about to drop the column `sketchfabUrl` on the `CharacterClass` table. All the data in the column will be lost.
  - Added the required column `godLevel` to the `CharacterClass` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CharacterClass` DROP COLUMN `sketchfabUrl`,
    ADD COLUMN `godLevel` INTEGER NOT NULL,
    ADD COLUMN `sketchfabId` VARCHAR(191) NULL;
