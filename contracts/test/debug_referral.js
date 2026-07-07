const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Referral debug", function () {
  it("check referralPercentage", async function () {
    const [owner, user1, user2] = await ethers.getSigners();
    
    const MockToken = await ethers.getContractFactory("MockToken");
    const stakingToken = await MockToken.connect(owner).deploy("BRT/WPOL", "BRT/WPOL");
    const rewardToken = await MockToken.connect(owner).deploy("BRT", "BRT");

    const factory = await ethers.getContractFactory("BroilerCoreStaking");
    const impl = await factory.deploy();
    const initData = factory.interface.encodeFunctionData("initialize", [
      await stakingToken.getAddress(),
      await rewardToken.getAddress()
    ]);
    const ERC1967Proxy = await ethers.getContractFactory("@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy");
    const proxy = await ERC1967Proxy.deploy(await impl.getAddress(), initData);
    const staking = factory.attach(await proxy.getAddress());

    console.log("referralPercentage:", (await staking.referralPercentage()).toString());
    console.log("maxBriRewardRate:", (await staking.maxBriRewardRate()).toString());
    console.log("maxXgovPointRate:", (await staking.maxXgovPointRate()).toString());
  });
});
