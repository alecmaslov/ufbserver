/*
  Warnings:

  - The values [BASIC,BRIDGE,PORTAL] on the enum `TileAdjacency_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `TileAdjacency` MODIFY `type` ENUM('Basic', 'Bridge', 'Portal') NOT NULL,
    MODIFY `energyCost` INTEGER NULL;
