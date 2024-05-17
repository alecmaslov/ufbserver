import { parseArgs } from "node:util";
import { parseOldFormatMaps } from "./parseMap";

const getArgs = () => {
    return parseArgs({
        options: {
            inputMapFile: {
                type: "string",
            },
            outputDir: {
                type: "string",
            }
        },
    });
};

const {values} = getArgs();
if (!values.inputMapFile || !values.outputDir) {
    console.error("Usage: parse-map --inputMapFile <inputFile> --outputDir <outputDir>");
    process.exit(1);
}
parseOldFormatMaps(values.inputMapFile, values.outputDir);