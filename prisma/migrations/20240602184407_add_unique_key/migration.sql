/*
  Warnings:

  - A unique constraint covering the columns `[tileCode,mapId]` on the table `Tile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[x,y,mapId]` on the table `Tile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Tile_tileCode_mapId_key` ON `Tile`(`tileCode`, `mapId`);

-- CreateIndex
CREATE UNIQUE INDEX `Tile_x_y_mapId_key` ON `Tile`(`x`, `y`, `mapId`);
