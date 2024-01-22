import { tryGetCacheString } from "#utils/cache";
import axios from "axios";

async function getContractAbi(contractAddress: string) {
    const data = await tryGetCacheString("abi/ethereum/contractAddress", async () => {
        const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`;
        const response = await axios.get(url);
        return response.data.result;
    });
    return JSON.parse(data);
}