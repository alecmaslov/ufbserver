/*
  Warnings:

  - You are about to drop the column `textureUrl` on the `Tile` table. All the data in the column will be lost.
  - Added the required column `type` to the `Tile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Tile` DROP COLUMN `textureUrl`,
    ADD COLUMN `type` ENUM('Bridge', 'Floor', 'Void', 'Chest', 'Enemy', 'Portal') NOT NULL;
