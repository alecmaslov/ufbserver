import { readFile, readFileSync } from "fs";
import { CharacterClass } from "@prisma/client";
import db from "#db";

const CHARACTER_CLASS_DATA_PATH = "./data/characters/ufb-character-classes.json";
const OWNED_CHARACTER_CLASS_DATA_PATH = "./data/characters/ufb-owned-characters.json";

async function insertCharacterClasses() {
    const data = JSON.parse(readFileSync(CHARACTER_CLASS_DATA_PATH, "utf-8")) as {
        name: string;
        godLevel: number;
        avatarUrl: string;
        cardUrl: string;
        sketchfabId: string;
    }[];

    for (const d of data) {
        console.log(`Inserting ${d.name}...`)
        try {
            await db.characterClass.create({
                data: {
                    name: d.name,
                    godLevel: d.godLevel,
                    avatarUrl: d.avatarUrl,
                    cardUrl: d.cardUrl,
                    sketchfabId: d.sketchfabId,
                },
            });
        } catch (e) {
            console.error(e);
        }
    }
}

async function insertCharacterTokens() {
    const data = JSON.parse(readFileSync(OWNED_CHARACTER_CLASS_DATA_PATH, "utf-8")) as {
        name: string;
        className: string;
        contractAddress: string;
        tokenId: number;
    }[];

    for (const d of data) {
        try {
            console.log(`Inserting ${d.name}...`);
            const characterClass = await db.characterClass.findUnique({
                where: {
                    name: d.className,
                },
            });

            if (!characterClass) {
                console.error(`Could not find character class ${d.className}`);
                continue;
            }

            await db.characterToken.create({
                data: {
                    name: d.name,
                    classId: characterClass.id,
                    contractAddress: d.contractAddress,
                    tokenId: d.tokenId,
                },
            });
        } catch(e) {
            console.error(e);
        }
    }
}


// insertCharacterClasses();
insertCharacterTokens();
