/*
  Warnings:

  - A unique constraint covering the columns `[tileId]` on the table `SpawnZone` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `SpawnZone_tileId_key` ON `SpawnZone`(`tileId`);
