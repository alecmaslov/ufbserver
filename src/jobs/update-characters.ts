import db from "../db.js";
import { readFileSync } from "fs";
import type { Character, CharacterClass, Nft } from "@prisma/client";
import { getBucketManager } from "../services/AWSBucket.js";
import axios from "axios";
import {
    fetchNftCollectionInfo,
    NftCollectionInfo,
} from "../nft/token-info.js";
import { tryGetCache } from "../utils/cache.js";

const SKETCHFAB_INFO = "./data/characters/god-level-sketchfab.json";

const defaultCharacterName = (name: string) => {
    return name + " #001";
};

type CharacterData = Omit<Character, "id" | "classId" | "ownerId" | "nftId"> & {
    class: Omit<CharacterClass, "id">;
    nft: Omit<Nft, "id">;
};

interface GodLevelNftMetadata {
    name: string;
    owner: {
        name: string;
        url: string;
    };
    description: string;
    image: string;
    attributes: {
        trait_type: string;
        value: string;
    }[];
}

// removes leading # and number from character name
const removeLeadingNumber = (name: string) => {
    return name.replace(/^#\d+\s*/, "");
};

async function upsertGodLevelNfts(updateClasses = false, uploadImages = false) {
    // get the collection info from cache, with 30 day expiration
    const collectionInfo = await tryGetCache<NftCollectionInfo>(
        "god-level-nfts.json",
        async () => await fetchNftCollectionInfo(),
        30
    );

    const sketchfabInfo = JSON.parse(readFileSync(SKETCHFAB_INFO, "utf8")) as {
        name: string;
        sketchfabUrl: string;
    }[];

    const { contract, nfts, collection } = collectionInfo;

    const bucketManager = getBucketManager("ufb-assets");

    const characterClasses = nfts.map((n) => {
        let sketchfabUrl = sketchfabInfo.find(
            (c: any) => c.name === removeLeadingNumber(n.name)
        )?.sketchfabUrl;
        // console.log(n);

        let ultimateMove = n.raw.metadata.attributes.find(
            (a: any) => a.trait_type === "Ultimate Move"
        )?.value;

        return {
            name: removeLeadingNumber(n.name),
            description: n.description,
            cardUrl: n.image.cachedUrl,
            sketchfabUrl,
            ultimateMove,
        };
    });

    if (updateClasses) {
        for (const c of characterClasses) {
            const image = await axios.get(c.cardUrl, {
                responseType: "arraybuffer",
            });

            // for now just do this, but eventually check if the card URL exists
            c.cardUrl = bucketManager.getObjectUrl(
                `images/characters/${c.name
                    .toLowerCase()
                    .replace(" ", "-")}-card.png`
            );

            const updateClass = async () => {
                await db.characterClass.upsert({
                    where: {
                        name: c.name,
                    },
                    update: {
                        ...c,
                    },
                    create: {
                        ...c,
                    },
                });
            };

            if (uploadImages) {
                bucketManager.upload(
                    {
                        Key: `images/characters/${c.name
                            .toLowerCase()
                            .replace(" ", "-")}-card.png`,
                        Body: image.data,
                        ContentType: "image/png",
                    },
                    (progress) => {
                        console.log(progress);
                    },
                    async (err, data) => {
                        if (!err) {
                            c.cardUrl = data.Location;
                        } else {
                            console.error(err);
                        }
                        await updateClass();
                        return;
                    }
                );
            } else {
                await updateClass();
            }
        }
    }

    // create the nftContract
    const nftContract = await db.nftContract.upsert({
        where: {
            address: contract.address,
        },
        update: {
            name: contract.name,
            slug: collection.slug,
            symbol: contract.symbol,
            totalSupply: parseInt(contract.totalSupply),
            tokenType: contract.tokenType,
            contractDeployer: contract.contractDeployer,
            imageUrl: contract.openSeaMetadata.imageUrl,
            description: contract.openSeaMetadata.description,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.imageBannerUrl,
            chainId: "ethereum",
        },
        create: {
            address: contract.address,
            name: contract.name,
            slug: collection.slug,
            symbol: contract.symbol,
            totalSupply: parseInt(contract.totalSupply),
            tokenType: contract.tokenType,
            contractDeployer: contract.contractDeployer,
            imageUrl: contract.openSeaMetadata.imageUrl,
            description: contract.openSeaMetadata.description,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.imageBannerUrl,
            chainId: "ethereum",
        },
    });

    for (const nft of nfts) {
        const tokenHolderName = nft.raw.metadata.owner?.name;
        const tokenHolderUrl = nft.raw.metadata.owner?.url;

        const newNft = await db.nft.upsert({
            where: {
                contractAddress_tokenId: {
                    contractAddress: nftContract.address,
                    tokenId: nft.tokenId,
                },
            },
            update: {
                name: nft.name,
                tokenId: nft.tokenId,
                tokenUri: nft.tokenUri,
                tokenHolderAddress: nft.owners[0],
                tokenHolderName,
                tokenHolderUrl,
                contract: {
                    connect: {
                        address: nftContract.address,
                    },
                },
            },
            create: {
                name: nft.name,
                tokenId: nft.tokenId,
                tokenUri: nft.tokenUri,
                tokenHolderAddress: nft.owners[0],
                tokenHolderName,
                tokenHolderUrl,
                contract: {
                    connect: {
                        address: nftContract.address,
                    },
                },
            },
        });

        const characterClassName = removeLeadingNumber(nft.name);

        await db.character.upsert({
            where: {
                name: defaultCharacterName(characterClassName),
            },
            update: {
                name: defaultCharacterName(characterClassName),
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
            },
            create: {
                name: defaultCharacterName(characterClassName),
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
            },
        });

        console.log(`Upserting ${characterClassName}...`);

        await db.godLevelNft.upsert({
            where: {
                characterClassName,
            },
            update: {},
            create: {
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
                nft: {
                    connect: {
                        id: newNft.id,
                    },
                },
            },
        });
    }

    console.log("Done");
}

////
async function updateCharacter(updateClasses = false, uploadImages = false) {
    // get the collection info from cache, with 30 day expiration
    const collectionInfo = await tryGetCache<NftCollectionInfo>(
        "god-level-nfts.json",
        async () => await fetchNftCollectionInfo(),
        30
    );

    const sketchfabInfo = JSON.parse(readFileSync(SKETCHFAB_INFO, "utf8")) as {
        name: string;
        sketchfabUrl: string;
    }[];

    const { contract, nfts, collection } = collectionInfo;

    const bucketManager = getBucketManager("ufb-assets");

    const characterClasses = nfts.map((n) => {
        let sketchfabUrl = sketchfabInfo.find(
            (c: any) => c.name === removeLeadingNumber(n.name)
        )?.sketchfabUrl;
        // console.log(n);

        let ultimateMove = n.raw.metadata.attributes.find(
            (a: any) => a.trait_type === "Ultimate Move"
        )?.value;

        return {
            name: removeLeadingNumber(n.name),
            description: n.description,
            cardUrl: n.image.cachedUrl,
            sketchfabUrl,
            ultimateMove,
        };
    });

    if (updateClasses) {
        for (const c of characterClasses) {
            const image = await axios.get(c.cardUrl, {
                responseType: "arraybuffer",
            });

            // for now just do this, but eventually check if the card URL exists
            c.cardUrl = bucketManager.getObjectUrl(
                `images/characters/${c.name
                    .toLowerCase()
                    .replace(" ", "-")}-card.png`
            );

            const updateClass = async () => {
                await db.characterClass.upsert({
                    where: {
                        name: c.name,
                    },
                    update: {
                        ...c,
                    },
                    create: {
                        ...c,
                    },
                });
            };

            if (uploadImages) {
                bucketManager.upload(
                    {
                        Key: `images/characters/${c.name
                            .toLowerCase()
                            .replace(" ", "-")}-card.png`,
                        Body: image.data,
                        ContentType: "image/png",
                    },
                    (progress) => {
                        console.log(progress);
                    },
                    async (err, data) => {
                        if (!err) {
                            c.cardUrl = data.Location;
                        } else {
                            console.error(err);
                        }
                        await updateClass();
                        return;
                    }
                );
            } else {
                await updateClass();
            }
        }
    }

    // create the nftContract
    const nftContract = await db.nftContract.upsert({
        where: {
            address: contract.address,
        },
        update: {
            name: contract.name,
            slug: collection.slug,
            symbol: contract.symbol,
            totalSupply: parseInt(contract.totalSupply),
            tokenType: contract.tokenType,
            contractDeployer: contract.contractDeployer,
            imageUrl: contract.openSeaMetadata.imageUrl,
            description: contract.openSeaMetadata.description,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.imageBannerUrl,
            chainId: "ethereum",
        },
        create: {
            address: contract.address,
            name: contract.name,
            slug: collection.slug,
            symbol: contract.symbol,
            totalSupply: parseInt(contract.totalSupply),
            tokenType: contract.tokenType,
            contractDeployer: contract.contractDeployer,
            imageUrl: contract.openSeaMetadata.imageUrl,
            description: contract.openSeaMetadata.description,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.imageBannerUrl,
            chainId: "ethereum",
        },
    });

    for (const nft of nfts) {
        const tokenHolderName = nft.raw.metadata.owner?.name;
        const tokenHolderUrl = nft.raw.metadata.owner?.url;

        const newNft = await db.nft.upsert({
            where: {
                contractAddress_tokenId: {
                    contractAddress: nftContract.address,
                    tokenId: nft.tokenId,
                },
            },
            update: {
                name: nft.name,
                tokenId: nft.tokenId,
                tokenUri: nft.tokenUri,
                tokenHolderAddress: nft.owners[0],
                tokenHolderName,
                tokenHolderUrl,
                contract: {
                    connect: {
                        address: nftContract.address,
                    },
                },
            },
            create: {
                name: nft.name,
                tokenId: nft.tokenId,
                tokenUri: nft.tokenUri,
                tokenHolderAddress: nft.owners[0],
                tokenHolderName,
                tokenHolderUrl,
                contract: {
                    connect: {
                        address: nftContract.address,
                    },
                },
            },
        });

        const characterClassName = removeLeadingNumber(nft.name);

        await db.character.upsert({
            where: {
                name: defaultCharacterName(characterClassName),
            },
            update: {
                name: defaultCharacterName(characterClassName),
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
            },
            create: {
                name: defaultCharacterName(characterClassName),
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
            },
        });

        console.log(`Upserting ${characterClassName}...`);

        await db.godLevelNft.upsert({
            where: {
                characterClassName,
            },
            update: {},
            create: {
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
                nft: {
                    connect: {
                        id: newNft.id,
                    },
                },
            },
        });
    }

    console.log("Done");
}

//// Resource panel
async function updateResource(updateResource = false) {
    // get the collection info from cache, with 30 day expiration
    const collectionInfo = await tryGetCache<NftCollectionInfo>(
        "god-level-nfts.json",
        async () => await fetchNftCollectionInfo(),
        30
    );

    const sketchfabInfo = JSON.parse(readFileSync(SKETCHFAB_INFO, "utf8")) as {
        name: string;
        sketchfabUrl: string;
    }[];

    const { contract, nfts, collection } = collectionInfo;

    const bucketManager = getBucketManager("ufb-assets");

    const characterClasses = nfts.map((n) => {
        let sketchfabUrl = sketchfabInfo.find(
            (c: any) => c.name === removeLeadingNumber(n.name)
        )?.sketchfabUrl;
        // console.log(n);

        let ultimateMove = n.raw.metadata.attributes.find(
            (a: any) => a.trait_type === "Ultimate Move"
        )?.value;

        return {
            name: removeLeadingNumber(n.name),
            description: n.description,
            cardUrl: n.image.cachedUrl,
            sketchfabUrl,
            ultimateMove,
        };
    });

    if (updateResource) {
        for (const c of characterClasses) {
            const image = await axios.get(c.cardUrl, {
                responseType: "arraybuffer",
            });

            // for now just do this, but eventually check if the card URL exists
            c.cardUrl = bucketManager.getObjectUrl(
                `images/characters/${c.name
                    .toLowerCase()
                    .replace(" ", "-")}-card.png`
            );

            const updateClass = async () => {
                await db.characterClass.upsert({
                    where: {
                        name: c.name,
                    },
                    update: {
                        ...c,
                    },
                    create: {
                        ...c,
                    },
                });
            };
        }
    }

    // create the nftContract
    const nftContract = await db.nftContract.upsert({
        where: {
            address: contract.address,
        },
        update: {
            name: contract.name,
            slug: collection.slug,
            symbol: contract.symbol,
            totalSupply: parseInt(contract.totalSupply),
            tokenType: contract.tokenType,
            contractDeployer: contract.contractDeployer,
            imageUrl: contract.openSeaMetadata.imageUrl,
            description: contract.openSeaMetadata.description,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.imageBannerUrl,
            chainId: "ethereum",
        },
        create: {
            address: contract.address,
            name: contract.name,
            slug: collection.slug,
            symbol: contract.symbol,
            totalSupply: parseInt(contract.totalSupply),
            tokenType: contract.tokenType,
            contractDeployer: contract.contractDeployer,
            imageUrl: contract.openSeaMetadata.imageUrl,
            description: contract.openSeaMetadata.description,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.imageBannerUrl,
            chainId: "ethereum",
        },
    });

    for (const nft of nfts) {
        const tokenHolderName = nft.raw.metadata.owner?.name;
        const tokenHolderUrl = nft.raw.metadata.owner?.url;

        const newNft = await db.nft.upsert({
            where: {
                contractAddress_tokenId: {
                    contractAddress: nftContract.address,
                    tokenId: nft.tokenId,
                },
            },
            update: {
                name: nft.name,
                tokenId: nft.tokenId,
                tokenUri: nft.tokenUri,
                tokenHolderAddress: nft.owners[0],
                tokenHolderName,
                tokenHolderUrl,
                contract: {
                    connect: {
                        address: nftContract.address,
                    },
                },
            },
            create: {
                name: nft.name,
                tokenId: nft.tokenId,
                tokenUri: nft.tokenUri,
                tokenHolderAddress: nft.owners[0],
                tokenHolderName,
                tokenHolderUrl,
                contract: {
                    connect: {
                        address: nftContract.address,
                    },
                },
            },
        });

        const characterClassName = removeLeadingNumber(nft.name);

        await db.character.upsert({
            where: {
                name: defaultCharacterName(characterClassName),
            },
            update: {
                name: defaultCharacterName(characterClassName),
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
            },
            create: {
                name: defaultCharacterName(characterClassName),
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
            },
        });

        console.log(`Upserting ${characterClassName}...`);

        await db.godLevelNft.upsert({
            where: {
                characterClassName,
            },
            update: {},
            create: {
                characterClass: {
                    connect: {
                        name: characterClassName,
                    },
                },
                nft: {
                    connect: {
                        id: newNft.id,
                    },
                },
            },
        });
    }

    console.log("Done");
}

upsertGodLevelNfts(true, false);
