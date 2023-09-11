import { readFileSync, statSync, readdirSync } from "fs";
import { basename, join as pathJoin } from "path";
import { UFBMap } from "#game/schema/MapState";

const MAPS_ROOT = pathJoin("data", "maps");

export function getAllMapFiles() : { name: string, path: string }[] {
  let mapList: any[] = [];

  function scanDir(directory: string) {
    const files = readdirSync(directory);
    for (const file of files) {
      const fullPath = pathJoin(directory, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath); // Recursive scan
      } else if (file === "map.json") {
        const parentDirName = basename(directory);
        mapList.push({
          name: parentDirName,
          path: pathJoin(directory, file)
        });
      }
    }
  }

  scanDir(MAPS_ROOT);
  return mapList;
}

// export const ALL_MAPS = getAllMapFiles().map(m => m.name);

export function getMap(mapKey: string) {
  const map = getAllMapFiles().find(m => m.name === mapKey);
  if (!map) {
    throw new Error(`Map not found: ${mapKey}`);
  }
  const data = readFileSync(map.path);
  const parsed = JSON.parse(data.toString());
  return parsed as UFBMap;
}

// const path = pathJoin("data", "maps", mapKey, "map.json");
// const data = await readFile(path);
// const parsed = JSON.parse(data.toString());
// const ufbMap = parsed as UFBMap;