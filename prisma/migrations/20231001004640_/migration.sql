/*
  Warnings:

  - The values [Enemy] on the enum `SpawnZone_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `SpawnZone` MODIFY `type` ENUM('Merchant', 'Portal', 'Monster', 'Chest') NOT NULL;
