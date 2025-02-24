const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.INFURA_ALCHEMY_RPC_URL);

async function getNonce(address) {
    try {
        const nonce = await provider.getTransactionCount(address);
        console.log(`Nonce for ${address}:`, nonce);
        return nonce;
    } catch (error) {
        console.error("Error fetching nonce:", error);
    }
}

async function getTransactionStatus(txHash) {
    try {
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);

        if(!tx){
            console.log(`Transaction ${txHash} not found.`);
            return;
        }
        
        if (!receipt) {
            console.log(`Transaction ${txHash} is still pending.`);
            return;
        }

        console.log(`Transaction ${txHash} is confirmed. Status:`, receipt.status === 1 ? "Success" : "Failed");
    } catch (error) {
        console.error("Error fetching transaction status:", error);
    }
}

(async () => {
    const address = "0x1268AD189526AC0b386faF06eFfC46779c340eE6";
    const txHash = "0x3f520c8f2b07e5f3f6ccd90787ebcd4917df2cf639fa884d54de9bfcc117dd78";

    await getNonce(address);
    await getTransactionStatus(txHash);
})();
