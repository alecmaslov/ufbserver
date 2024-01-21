import { EtherscanProvider, Provider, Contract } from "ethers";
import { readFileSync, write, writeFile, writeFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";
import { tryGetCache } from "#utils/cache";
import { Network, Alchemy } from "alchemy-sdk";
dotenv.config();

const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

// Get all the NFTs owned by an address
const nfts = alchemy.nft.getNftsForOwner("vitalik.eth");

const UFB_ADDRESS = "0xcb01f00562c7a70026374f29e75510e3066d2932";

async function main() {
    const contractMetadata = await alchemy.nft.getContractMetadata(UFB_ADDRESS);
    console.log(contractMetadata);

    const { nfts } = await alchemy.nft.getNftsForContract(UFB_ADDRESS);

    const allData: any = {
        contract: contractMetadata,
        nfts: [],
    };

    if (nfts.length > 0) {
        allData.collection = nfts[0].collection;
    }

    for (const nft of nfts) {
        console.log(nft);
        const { owners } = await alchemy.nft.getOwnersForNft(
            nft.contract.address,
            nft.tokenId
        );
        const { contract, collection, ...rest } = nft;
        allData.nfts.push({
            ...rest,
            owners,
        });
    }

    writeFileSync("./data/nfts-full-4.json", JSON.stringify(allData, null, 2));

    // for await (const nft of alchemy.nft.getNftsForContractIterator(UFB_ADDRESS))
}

main();
