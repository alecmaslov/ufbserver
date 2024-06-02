/*
  Warnings:

  - You are about to alter the column `type` on the `tile` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `tile` MODIFY `type` ENUM('VerticalBridge', 'HorizontalBridge', 'DoubleBridge', 'Void', 'StairsNS', 'StairsSN', 'StairsEW', 'StairsWE', 'Upper', 'Lower', 'OpenTile', 'BlockNorth', 'BlockEast', 'BlockSouth', 'BlockWest', 'BlockNS', 'BlockEW', 'BlockNE', 'BlockES', 'BlockSW', 'BlockNW', 'BlockESW', 'BlockSWN', 'BlockWNE', 'BlockNES') NOT NULL DEFAULT 'OpenTile';
