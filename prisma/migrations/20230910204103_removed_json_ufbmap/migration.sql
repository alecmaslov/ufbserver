/*
  Warnings:

  - You are about to drop the column `adjacencyList` on the `UfbMap` table. All the data in the column will be lost.
  - You are about to drop the column `tiles` on the `UfbMap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `UfbMap` DROP COLUMN `adjacencyList`,
    DROP COLUMN `tiles`;
