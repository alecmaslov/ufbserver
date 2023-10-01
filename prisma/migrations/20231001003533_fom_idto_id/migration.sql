/*
  Warnings:

  - A unique constraint covering the columns `[fromId,toId]` on the table `TileAdjacency` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `TileAdjacency_fromId_toId_key` ON `TileAdjacency`(`fromId`, `toId`);
