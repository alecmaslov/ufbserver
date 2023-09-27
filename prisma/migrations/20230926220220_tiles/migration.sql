-- AlterTable
ALTER TABLE `Tile` MODIFY `type` ENUM('Default', 'Bridge', 'Floor', 'Void', 'Chest', 'Enemy', 'Portal') NOT NULL DEFAULT 'Default';
