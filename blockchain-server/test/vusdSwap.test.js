const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("VusdSwap", function () {
  let VusdSwap;
  let vusdSwap;
  let MockERC20;
  let vusd;
  let vow;
  let owner;
  let governor;
  let depositor;
  let user;

  beforeEach(async function () {
    // Get signers
    [owner, governor, depositor, user] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    MockERC20 = await ethers.getContractFactory("MockERC20");
    vusd = await MockERC20.deploy("Virtual USD", "VUSD");
    vow = await MockERC20.deploy("VOW Token", "VOW");

    // Deploy VusdSwap via upgradeable proxy
    VusdSwap = await ethers.getContractFactory("VusdSwap");
    vusdSwap = await upgrades.deployProxy(VusdSwap, [await vusd.getAddress(), await vow.getAddress()]);
    
    // Setup roles
    const GOVERNOR_ROLE = await vusdSwap.GOVERNOR_ROLE();
    const DEPOSITOR_ROLE = await vusdSwap.DEPOSITOR_ROLE();
    
    await vusdSwap.grantRole(GOVERNOR_ROLE, governor.address);
    await vusdSwap.grantRole(DEPOSITOR_ROLE, depositor.address);
    
    // Mint tokens for testing
    await vusd.mint(user.address, ethers.parseEther("1000"));
    await vow.mint(depositor.address, ethers.parseEther("1000"));
    
    // Approvals
    await vusd.connect(user).approve(await vusdSwap.getAddress(), ethers.MaxUint256);
    await vow.connect(depositor).approve(await vusdSwap.getAddress(), ethers.MaxUint256);
  });

  describe("Initialization", function () {
    it("Should set the correct token addresses", async function () {
      const contractInfo = await vusdSwap.contractInfo();
      expect(contractInfo.swapRate).to.equal(2500);
    });

    it("Should set the initial roles", async function () {
      const GOVERNOR_ROLE = await vusdSwap.GOVERNOR_ROLE();
      const DEPOSITOR_ROLE = await vusdSwap.DEPOSITOR_ROLE();
      
      expect(await vusdSwap.hasRole(GOVERNOR_ROLE, governor.address)).to.be.true;
      expect(await vusdSwap.hasRole(DEPOSITOR_ROLE, depositor.address)).to.be.true;
    });
  });

  describe("Deposit", function () {
    it("Should allow depositor to deposit VOW tokens", async function () {
      const depositAmount = ethers.parseEther("100");
      
      await expect(vusdSwap.connect(depositor).deposit(depositAmount))
        .to.emit(vusdSwap, "Deposit")
        .withArgs(depositor.address, depositAmount);
      
      const nodeInfo = await vusdSwap.nodeInfo(depositor.address);
      expect(nodeInfo.deposits).to.equal(depositAmount);
      
      // Check token balance
      const contractBalance = await vow.balanceOf(await vusdSwap.getAddress());
      expect(contractBalance).to.equal(depositAmount);
    });
    
    it("Should revert if deposit amount is 0", async function () {
      await expect(vusdSwap.connect(depositor).deposit(0))
        .to.be.revertedWithCustomError(vusdSwap, "AmountIsZero");
    });
    
    it("Should revert if depositor has insufficient balance", async function () {
      const largeAmount = ethers.parseEther("2000"); // More than the minted amount
      await expect(vusdSwap.connect(depositor).deposit(largeAmount))
        .to.be.revertedWithCustomError(vusdSwap, "InvalidBalance");
    });
    
    it("Should revert if caller is not a depositor", async function () {
      const depositAmount = ethers.parseEther("100");
      await expect(vusdSwap.connect(user).deposit(depositAmount))
        .to.be.revertedWith("AccessControl: account " + user.address.toLowerCase() + " is missing role " + await vusdSwap.DEPOSITOR_ROLE());
    });
  });
  
  describe("Swap", function () {
    beforeEach(async function () {
      // Depositor deposits tokens first
      const depositAmount = ethers.parseEther("100");
      await vusdSwap.connect(depositor).deposit(depositAmount);
    });
    
    it("Should allow users to swap VUSD for VOW", async function () {
      const swapAmount = ethers.parseEther("10");
      const expectedVowAmount = await vusdSwap.getExchangeAmount(swapAmount);
      
      await expect(vusdSwap.connect(user).swap(swapAmount, depositor.address))
        .to.emit(vusdSwap, "Swap")
        .withArgs(user.address, swapAmount);
      
      // Check balances and accounting
      const nodeInfo = await vusdSwap.nodeInfo(depositor.address);
      expect(nodeInfo.withdrawals).to.equal(expectedVowAmount);
      
      // User should have received VOW tokens
      expect(await vow.balanceOf(user.address)).to.equal(expectedVowAmount);
      
      // Depositor should have received VUSD tokens
      expect(await vusd.balanceOf(depositor.address)).to.equal(swapAmount);
    });
    
    it("Should revert if swap amount is 0", async function () {
      await expect(vusdSwap.connect(user).swap(0, depositor.address))
        .to.be.revertedWithCustomError(vusdSwap, "AmountIsZero");
    });
    
    it("Should revert if depositor address is zero", async function () {
      const swapAmount = ethers.parseEther("10");
      await expect(vusdSwap.connect(user).swap(swapAmount, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(vusdSwap, "InvalidDepositorAddress");
    });
    
    it("Should revert if depositor has insufficient withdrawable balance", async function () {
      const largeAmount = ethers.parseEther("500"); // Would exceed depositor's withdrawable amount with the exchange rate
      await expect(vusdSwap.connect(user).swap(largeAmount, depositor.address))
        .to.be.revertedWithCustomError(vusdSwap, "InvalidDepositorBalance");
    });
  });
  
  describe("Withdraw", function () {
    beforeEach(async function () {
      // Depositor deposits tokens first
      const depositAmount = ethers.parseEther("100");
      await vusdSwap.connect(depositor).deposit(depositAmount);
      
      // User swaps some tokens
      const swapAmount = ethers.parseEther("10");
      await vusdSwap.connect(user).swap(swapAmount, depositor.address);
    });
    
    it("Should allow depositor to withdraw tokens", async function () {
      const initialWithdrawable = await vusdSwap.withdrawable(depositor.address);
      expect(initialWithdrawable).to.be.gt(0);
      
      const initialBalance = await vow.balanceOf(depositor.address);
      
      await expect(vusdSwap.connect(depositor).withdraw())
        .to.emit(vusdSwap, "Withdraw")
        .withArgs(depositor.address, initialWithdrawable);
      
      // Depositor should have received VOW tokens
      const finalBalance = await vow.balanceOf(depositor.address);
      expect(finalBalance - initialBalance).to.equal(initialWithdrawable);
      
      // Withdrawable should now be 0
      expect(await vusdSwap.withdrawable(depositor.address)).to.equal(0);
    });
    
    it("Should revert if nothing to withdraw", async function () {
      // First withdraw everything
      await vusdSwap.connect(depositor).withdraw();
      
      // Then try to withdraw again
      await expect(vusdSwap.connect(depositor).withdraw())
        .to.be.revertedWithCustomError(vusdSwap, "AmountIsZero");
    });
  });
  
  describe("Swap Ratio Management", function () {
    it("Should allow governor to update swap ratio", async function () {
      const newRate = 3000;
      
      await expect(vusdSwap.connect(governor).setSwapRatio(newRate))
        .to.emit(vusdSwap, "RateUpdated")
        .withArgs(newRate);
      
      const contractInfo = await vusdSwap.contractInfo();
      expect(contractInfo.swapRate).to.equal(newRate);
    });
    
    it("Should revert if non-governor tries to update swap ratio", async function () {
      const newRate = 3000;
      await expect(vusdSwap.connect(user).setSwapRatio(newRate))
        .to.be.revertedWith("AccessControl: account " + user.address.toLowerCase() + " is missing role " + await vusdSwap.GOVERNOR_ROLE());
    });
    
    it("Should revert if rate is set to 0", async function () {
      await expect(vusdSwap.connect(governor).setSwapRatio(0))
        .to.be.revertedWithCustomError(vusdSwap, "AmountIsZero");
    });
    
    it("Should correctly calculate exchange amounts with updated rate", async function () {
      const amount = ethers.parseEther("10");
      
      // Check with initial rate (2500)
      let expectedAmount = amount * BigInt(2500) / BigInt(10000);
      expect(await vusdSwap.getExchangeAmount(amount)).to.equal(expectedAmount);
      
      // Update rate
      const newRate = 5000;
      await vusdSwap.connect(governor).setSwapRatio(newRate);
      
      // Check with new rate
      expectedAmount = amount * BigInt(newRate) / BigInt(10000);
      expect(await vusdSwap.getExchangeAmount(amount)).to.equal(expectedAmount);
    });
  });
});