import db from "../db.js";
import { readFileSync } from "fs";
import type { Character, CharacterClass, Nft } from "@prisma/client";
import { getBucketManager } from "../services/AWSBucket.js";
import axios from "axios";

const DATA_PATH = "./data/nfts-full.json";
const SKETCHFAB_INFO = "./data/characters/ufb-character-classes.json";
const defaultCharacterName = (name: string) => {
    return name + " #001";
}


type CharacterData = Omit<Character, "id" | "classId" | "ownerId" | "nftId"> & {
    class: Omit<CharacterClass, "id">;
    nft: Omit<Nft, "id">;
};

const getCharacterName = (name: string) => {
    if (name.split(": ").length > 1) {
        return name.split(": ")[1];
    }
    if (name.split("- ").length > 1) {
        return name.split("- ")[1];
    }
    return name;
};


// async function updateTokenUris() {
//     const nfts = await db.nft.findMany();

//     for (const nft of nfts) {
//         const data = await axios.get(nft.tokenUri);
//         const { image } = data.data;
//         await db.nft.update({
//             where: {
//                 id: nft.id,
//             },
//             data: {
//                 imageUrl: image,
//             },
//         });
//     }
// }

async function insert(createClasses = false) {
    const data = JSON.parse(readFileSync(DATA_PATH, "utf8")) as any;
    const characterInfo = JSON.parse(
        readFileSync(SKETCHFAB_INFO, "utf8")
    ) as any;

    const { contract, nfts, collection } = data;

    const bucketManager = getBucketManager();

    const characterClasses = nfts.map((n: any) => {
        let sketchfabUrl = characterInfo.find(
            (c: any) => c.name === getCharacterName(n.name)
        )?.sketchfabUrl;

        return {
            name: getCharacterName(n.name),
            description: n.description,
            cardUrl: n.image.cachedUrl,
            sketchfabUrl,
        };
    });

    if (createClasses) {
        for (const c of characterClasses) {
            const image = await axios.get(c.cardUrl, {
                responseType: "arraybuffer",
            });

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

                    return;
                }
            );
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
            description: contract.description,
            externalUrl: contract.openSeaMetadata.externalLink,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.bannerImageUrl,
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
            description: contract.description,
            externalUrl: contract.openSeaMetadata.externalLink,
            twitterUsername: contract.openSeaMetadata.twitterUsername,
            discordUrl: contract.openSeaMetadata.discordUrl,
            bannerImageUrl: contract.openSeaMetadata.bannerImageUrl,
            chainId: "ethereum",
        },
    });

    for (const nft of nfts) {
        const newNft = await db.nft.upsert({
            where: {
                contractAddress_tokenId: {
                    contractAddress: nftContract.address,
                    tokenId: nft.tokenId,
                },
            },
            update: {
                tokenHolderAddress: nft.owners[0],
            },
            create: {
                tokenId: nft.tokenId,
                tokenUri: nft.tokenUri,
                name: nft.name,
                tokenHolderAddress: nft.owners[0],
                contract: {
                    connect: {
                        address: nftContract.address,
                    },
                },
            },
        });

        const characterClassName = getCharacterName(nft.name);

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
            }
        })
    }

    console.log("Done");
}

insert(true);

async function getNftData() {
    const characterNfts = await db.character.findMany({
        include: {
            nft: {
                include: {
                    contract: true,
                },
            },
            characterClass: true,
        },
    });

    // const transformed = characterNfts.map((c) => {
    //     const { nft, class: characterClass, ...rest } = c;
    //     return {
    //         character: {
    //             ...rest,
    //             class: characterClass,
    //         },
    //         nft,
    //     }
    // })

    console.log(JSON.stringify(characterNfts, null, 2));
}

// getNftData();
