-- CreateTable
CREATE TABLE `UfbMap` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `gridWidth` INTEGER NOT NULL,
    `gridHeight` INTEGER NOT NULL,
    `tiles` JSON NOT NULL,
    `adjacencyList` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
