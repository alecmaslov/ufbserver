import { EtherscanProvider, Provider, Contract } from "ethers";
import { readFileSync, write, writeFile, writeFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";
import {
    Network,
    Alchemy,
    NftContractForNft,
    Nft,
    NftCollection,
    NftTokenType,
    NftImage,
    NftRawMetadata,
    AcquiredAt,
    NftMint,
} from "alchemy-sdk";
dotenv.config();

const UFB_ADDRESS = "0xcb01f00562c7a70026374f29e75510e3066d2932";

export interface NftCollectionInfo {
    contract: NftContractForNft;
    nfts: {
        tokenId: string;
        tokenType: NftTokenType;
        name?: string;
        description?: string;
        tokenUri?: string;
        image: NftImage;
        raw: NftRawMetadata;
        mint?: NftMint;
        owners: string[];
        timeLastUpdated: string;
        acquiredAt?: AcquiredAt;
    }[];
    collection: NftCollection;
}

export async function fetchNftCollectionInfo(
    contractAddress: string = UFB_ADDRESS
): Promise<NftCollectionInfo> {
    const alchemy = new Alchemy({
        apiKey: process.env.ALCHEMY_API_KEY,
        network: Network.ETH_MAINNET,
    });
    const contractMetadata = await alchemy.nft.getContractMetadata(contractAddress);
    const { nfts } = await alchemy.nft.getNftsForContract(contractAddress);
    const allData: any = {
        contract: contractMetadata,
        nfts: [],
    };
    if (nfts.length > 0) {
        allData.collection = nfts[0].collection;
    }

    for (const nft of nfts) {
        const { owners } = await alchemy.nft.getOwnersForNft(
            nft.contract.address,
            nft.tokenId
        );
        const { contract, collection, ...rest } = nft;
        const data = {
            ...rest,
            owners,
        };
        allData.nfts.push({
            ...rest,
            owners,
        });
    }

    return allData as NftCollectionInfo;
}

const allData = await fetchNftCollectionInfo();
writeFileSync("./data/nfts-full-4.json", JSON.stringify(allData, null, 2));
