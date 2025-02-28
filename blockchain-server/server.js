const { ethers } = require("ethers");
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const rawABI = fs.readFileSync("./artifacts/contracts/VusdSwap.sol/VusdSwap.json");
const contractABI = JSON.parse(rawABI).abi;

const app = express();
app.use(express.json());
app.use(cors());

const provider = new ethers.JsonRpcProvider("https://virtual.polygon-amoy.rpc.tenderly.co/12c2058d-d544-4c38-854d-0081456dff05");

const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
const userWallet = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);
const depositorWallet = new ethers.Wallet(process.env.DEPOSITOR_PRIVATE_KEY, provider);

const deployer = new ethers.Contract(process.env.VUSDSWAP_CONTRACT, contractABI, deployerWallet);
const user = new ethers.Contract(process.env.VUSDSWAP_CONTRACT, contractABI, userWallet);
const depositor = new ethers.Contract(process.env.VUSDSWAP_CONTRACT, contractABI, depositorWallet);

app.get("/contract-info", async (req, res) => {
    try {
        const [vowPool, swapRate] = await deployer.contractInfo();
        res.json({ vowPool: vowPool.toString(), swapRate: swapRate.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/node-info/:address", async (req, res) => {
    try {
        const { address } = req.params;
        const [deposits, withdrawals] = await deployer.nodeInfo(address);
        res.json({ deposits: deposits.toString(), withdrawals: withdrawals.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/deposit", async (req, res) => {
    try {
        const { amount } = req.body;
        const tx = await depositor.deposit(ethers.parseUnits(amount, 18));
        await tx.wait();
        res.json({ success: true, transaction: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/swap", async (req, res) => {
    try {
        const { amount, depositor } = req.body;
        const getExchangeAmount = await user.getExchangeAmount(amount);
        console.log("getExchangeAmount",getExchangeAmount.toString());
        const tx = await user.swap(ethers.parseUnits(amount, 18), depositor);
        await tx.wait();
        res.json({ 
            success: true, 
            transaction: tx.hash, 
            getExchangeAmount: getExchangeAmount.toString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/withdraw", async (req, res) => {
    try {
        const tx = await depositor.withdraw();
        await tx.wait();
        res.json({ success: true, transaction: tx.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
