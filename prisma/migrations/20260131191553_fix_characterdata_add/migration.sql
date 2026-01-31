-- DropForeignKey
ALTER TABLE `character_token` DROP FOREIGN KEY `character_token_ownerId_fkey`;

-- AddForeignKey
ALTER TABLE `character_token` ADD CONSTRAINT `character_token_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
