import { readFileSync, statSync } from "fs";
import { basename, join as pathJoin } from "path";

export function getMapFiles(rootPath) {
    let mapList = [];
  
    function scanDir(directory) {
      const files = readFileSync(directory);
  
      // @carl - commented this out
      // for (const file of files) {
      //   const fullPath = pathJoin(directory, file);
      //   const stat = statSync(fullPath);
  
      //   if (stat.isDirectory()) {
      //     scanDir(fullPath); // Recursive scan
      //   } else if (file === "map.json") {
      //     const parentDirName = path.basename(directory);
      //     mapList.push({
      //       name: parentDirName,
      //       path: directory
      //     });
      //   }
      // }
    }
  
    scanDir(rootPath);
  
    return mapList;
  }