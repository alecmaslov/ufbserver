import db from "#db";
import { Handler, Router } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { query } from "express-validator";
import { validate } from "#middleware/validate";
import { RESPONSE_TYPE } from "#shared-types";

const router: Router = Router();
export default router;

// const handleGetCharacterNft: Handler = async (req: any, res: any) => {
//     try {
//         // const { contractAddress, tokenId } = req.params;
//         const id = req.params.id as string;
//         const nft = await db.nft.findUnique({
//             where: {
//                 contractAddress_tokenId: {
//                     contractAddress,
//                     tokenId: parseInt(tokenId),
//                 },
//             },
//             include: {
//                 character: true,
//             },
//         });
//         res.send(nft);
//     } catch (e) {
//         console.error(e);
//         res.sendStatus(500);
//     }
// };

const handleGetCharacter: Handler = async (req: any, res: any) => {
    try {
        const id = req.query.id as string;
        const character = await db.character.findUnique({
            where: {
                id,
            },
            include: {
                characterClass: true,
                nft: true,
            },
        });
        res.send(character);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

const handleGetCharacterClass: Handler = async (req: any, res: any) => {
    try {
        const { name } = req.params;
        const characterClass = await db.characterClass.findUnique({
            where: {
                name: name as string,
            },
        });
        res.send(characterClass);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

const handleGetCharacterData: Handler = async (req: any, res: any) => {
    try {

        const { userId, characterClass } = req.params;

        // const character = await db.character.findFirst({
        //     where: {
        //         ownerId: userId,
        //         className: characterClass
        //     },
        // });

        // console.log(character.id);

        const characterData = await db.characterData.findFirst({
            where: {
                userId: userId,
                // characterId: character.id
            }
        });

        console.log(userId, characterClass, characterData.id)

        res.send({
            ...characterData,
            error: RESPONSE_TYPE.SUCCESS
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
}

router.post("/get-hero-detail", 
    validate,
    handleGetCharacterData
)

router.get("/:id", handleGetCharacter);

router.get(
    "/class/:name",
    validate,
    handleGetCharacterClass
);

// router.get("/:contractAddress/:tokenId", handleGetCharacterNft);
