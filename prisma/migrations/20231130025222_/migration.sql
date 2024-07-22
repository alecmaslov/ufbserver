/*
  Warnings:

  - A unique constraint covering the columns `[contractAddress,tokenId]` on the table `NFT` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `NFT_contractAddress_tokenId_key` ON `NFT`(`contractAddress`, `tokenId`);
