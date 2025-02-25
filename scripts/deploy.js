// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {

  const provider = new ethers.JsonRpcProvider("https://sepolia.gateway.tenderly.co/22i83b2YDMFN9ovM1EJf0d");

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  const governor = new ethers.Wallet(process.env.GOVERNOR_PRIVATE_KEY, provider);
  const depositor = new ethers.Wallet(process.env.DEPOSITOR_PRIVATE_KEY, provider);

  // Deploy mock tokens first
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const vusd = await MockERC20.deploy("Virtual USD", "VUSD");
  await vusd.waitForDeployment();
  console.log("VUSD Token deployed to:", await vusd.getAddress());

  const vow = await MockERC20.deploy("VOW Token", "VOW");
  await vow.waitForDeployment();
  console.log("VOW Token deployed to:", await vow.getAddress());

  // Deploy VusdSwap with proxy
  const VusdSwap = await ethers.getContractFactory("VusdSwap");
  const vusdSwap = await upgrades.deployProxy(VusdSwap, [
    await vusd.getAddress(),
    await vow.getAddress()
  ]);
  await vusdSwap.waitForDeployment();
  console.log("VusdSwap deployed to:", await vusdSwap.getAddress());

  // Set up roles
  const GOVERNOR_ROLE = await vusdSwap.GOVERNOR_ROLE();
  const DEPOSITOR_ROLE = await vusdSwap.DEPOSITOR_ROLE();

  await vusdSwap.grantRole(GOVERNOR_ROLE, governor.address);
  console.log("Governor role granted to:", governor.address);

  await vusdSwap.grantRole(DEPOSITOR_ROLE, depositor.address);
  console.log("Depositor role granted to:", depositor.address);

  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });