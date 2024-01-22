import { EtherscanProvider, Provider, Contract } from "ethers";
import { readFileSync, write, writeFile, writeFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";
import { tryGetCacheString } from "#utils/cache";
import { Network, Alchemy } from "alchemy-sdk";
dotenv.config();

const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);
const UFB_ADDRESS = "0xcb01f00562c7a70026374f29e75510e3066d2932";

async function refreshContract() {
    const response = await alchemy.nft.refreshContract(UFB_ADDRESS);
    const test = await alchemy.nft.refreshNftMetadata(UFB_ADDRESS, "1");
    console.log(response);
}

async function main() {
    const contractMetadata = await alchemy.nft.getContractMetadata(UFB_ADDRESS);
    const { nfts } = await alchemy.nft.getNftsForContract(UFB_ADDRESS);
    const allData: any = {
        contract: contractMetadata,
        nfts: [],
    };
    // if (nfts.length > 0) {
    //     allData.collection = nfts[0].collection;
    // }

    const data = await alchemy.nft.getNftMetadata(UFB_ADDRESS, nfts[0].tokenId);
    // const data = await alchemy.nft.getNftMetadata(UFB_ADDRESS, nfts[0].tokenId);
    // console.log(`Time last updated: ${data.timeLastUpdated}`);

    // for (const nft of nfts) {
    //     console.log(nft);
    //     const { owners } = await alchemy.nft.getOwnersForNft(
    //         nft.contract.address,
    //         nft.tokenId
    //     );
    //     const { contract, collection, ...rest } = nft;
    //     allData.nfts.push({
    //         ...rest,
    //         owners,
    //     });
    // }

    writeFileSync("./data/nfts-full-3.json", JSON.stringify(data, null, 2));
}

main();
// refreshContract();
