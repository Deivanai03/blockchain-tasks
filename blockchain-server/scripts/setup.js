const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

const rawABI = fs.readFileSync("./artifacts/contracts/VusdSwap.sol/VusdSwap.json");
const vusdSwapABI = JSON.parse(rawABI).abi;

const rawERC20 = fs.readFileSync("./artifacts/contracts/MockERC20.sol/MockERC20.json");
const erc20ABI = JSON.parse(rawERC20).abi;

const provider = new ethers.JsonRpcProvider("https://virtual.polygon-amoy.rpc.tenderly.co/12c2058d-d544-4c38-854d-0081456dff05");

const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
const user = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);
const depositor = new ethers.Wallet(process.env.DEPOSITOR_PRIVATE_KEY, provider);

// Replace with deployed contract addresses
const vusdSwap = new ethers.Contract(process.env.VUSDSWAP_CONTRACT, vusdSwapABI, deployer);
const vusd = new ethers.Contract("0xC1C9d0aBb79273A51FBba0cFE4375d0C2EC6e029", erc20ABI, deployer);
const vow = new ethers.Contract("0xC1e1C83DC2c0028266f12485D1F696B0Cfc720Bc", erc20ABI, deployer);

async function setup() {
    console.log("Setting up roles and approvals...");

    // Assign roles
    const GOVERNOR_ROLE = await vusdSwap.GOVERNOR_ROLE();
    const DEPOSITOR_ROLE = await vusdSwap.DEPOSITOR_ROLE();

    await vusdSwap.grantRole(GOVERNOR_ROLE, deployer.address);
    console.log(`Governor role granted to: ${deployer.address}`);

    await vusdSwap.grantRole(DEPOSITOR_ROLE, depositor.address);
    console.log(`Depositor role granted to: ${depositor.address}`);

    // Mint tokens for testing
    await vusd.mint(user.address, ethers.parseEther("1000"));
    await vow.mint(user.address, ethers.parseEther("1000"));
    await vusd.mint(deployer.address, ethers.parseEther("1000"));
    await vow.mint(deployer.address, ethers.parseEther("1000"));
    console.log("Minted VUSD & VOW tokens.");

    // Approvals
    await vusd.connect(depositor).approve(await vusdSwap.getAddress(), ethers.MaxUint256);
    await vow.connect(depositor).approve(await vusdSwap.getAddress(), ethers.MaxUint256);

    await vusd.connect(user).approve(await vusdSwap.getAddress(), ethers.MaxUint256);
    await vow.connect(user).approve(await vusdSwap.getAddress(), ethers.MaxUint256);

    console.log("Approvals set for VUSD & VOW.");

    console.log("✅ Setup completed successfully!");
}

setup()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
