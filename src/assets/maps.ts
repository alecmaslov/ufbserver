import { readFileSync } from 'fs';
import { join } from 'path';



export function getMapFiles(rootPath) {
    let mapList = [];
  
    function scanDir(directory) {
      const files = fs.readdirSync(directory);
  
      for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
  
        if (stat.isDirectory()) {
          scanDir(fullPath); // Recursive scan
        } else if (file === 'map.json') {
          const parentDirName = path.basename(directory);
          mapList.push({
            name: parentDirName,
            path: directory
          });
        }
      }
    }
  
    scanDir(rootPath);
  
    return mapList;
  }