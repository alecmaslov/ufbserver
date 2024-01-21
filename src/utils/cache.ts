import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import dotenv from "dotenv";
import path from "path";

export async function tryGetCache(
    key: string,
    getData: () => Promise<string>
): Promise<string | null> {
    dotenv.config();
    const cachePath = path.resolve(process.env.CACHE_DIR, key);
    try {
        const data = readFileSync(cachePath, "utf8");
        console.log("Cache hit", key);
        return data;
    } catch (e) {
        if (e.code === "ENOENT") {
            console.log("Cache miss", key);
            const data = await getData();
            // check if dir exists
            const dir = path.dirname(cachePath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true }); // Recursively create the directory if it doesn't exist
            }
            writeFileSync(cachePath, data);
            return data;
        } else {
            throw e;
        }
    }
}
