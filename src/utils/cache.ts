import {
    readFileSync,
    writeFileSync,
    existsSync,
    mkdirSync,
    statSync,
} from "fs";
import dotenv from "dotenv";
import path from "path";

export async function tryGetCacheString(
    key: string,
    getData: () => Promise<string>,
    expireDays: number = 30
): Promise<string | null> {
    dotenv.config();
    const cachePath = path.resolve(process.env.CACHE_DIR, key);

    const getAndWrite = async () => {
        const data = await getData();
        const dir = path.dirname(cachePath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true }); // Recursively create the directory if it doesn't exist
        }
        writeFileSync(cachePath, data);
        return data;
    };

    try {
        const data = readFileSync(cachePath, "utf8");
        console.log("Cache hit", key);

        if (expireDays) {
            const stats = statSync(cachePath);
            const now = new Date();
            const created = new Date(stats.ctime);
            const diff = now.getTime() - created.getTime();
            const diffDays = diff / (1000 * 3600 * 24);
            if (diffDays > expireDays) {
                console.log("Cache expired", key);
                return await getAndWrite();
            }
        }

        return data;
    } catch (e) {
        if (e.code === "ENOENT") {
            console.log("Cache miss", key);
            return await getAndWrite();
        } else {
            throw e;
        }
    }
}

export async function tryGetCache<T>(
    key: string,
    getData: () => Promise<T>,
    expireDays: number = 30
): Promise<T | null> {
    const data = await tryGetCacheString(key, async () => {
        const data = await getData();
        return JSON.stringify(data);
    }, expireDays);
    if (data) {
        return JSON.parse(data);
    } else {
        return null;
    }
}
