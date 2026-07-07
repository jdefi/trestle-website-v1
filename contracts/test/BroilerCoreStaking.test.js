const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BroilerCoreStaking", function () {
  this.timeout(120000);
  let stakingToken, rewardToken, staking;
  let owner, user1, user2, user3;

  const DAY = 86400;
  const LOCK_6M = 180 * DAY;
  const LOCK_12M = 360 * DAY;
  const LOCK_18M = 540 * DAY;
  const LOCKDOWN = 24 * 3600;

  async function deployCore(tokenAddr, rewardAddr) {
    const factory = await ethers.getContractFactory("BroilerCoreStaking");
    const impl = await factory.deploy();
    const initData = factory.interface.encodeFunctionData("initialize", [tokenAddr, rewardAddr]);
    const ERC1967Proxy = await ethers.getContractFactory("@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy");
    const proxy = await ERC1967Proxy.deploy(await impl.getAddress(), initData);
    return factory.attach(await proxy.getAddress());
  }

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockToken");
    stakingToken = await MockToken.connect(owner).deploy("BRT/WPOL", "BRT/WPOL");
    rewardToken = await MockToken.connect(owner).deploy("BRT", "BRT");

    staking = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());

    for (const u of [owner, user1, user2, user3]) {
      await stakingToken.connect(owner).mint(u.address, ethers.parseEther("10000"));
      await stakingToken.connect(u).approve(await staking.getAddress(), ethers.parseEther("10000"));
      await rewardToken.connect(owner).mint(u.address, ethers.parseEther("10000"));
    }

    await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("1000000"));
    await staking.connect(owner).setRewardRates(ethers.parseEther("1"), ethers.parseEther("1"), 30 * DAY);
  });

  describe("Deployment", function () {
    it("should set correct tokens", async function () {
      expect(await staking.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await staking.briToken()).to.equal(await rewardToken.getAddress());
    });

    it("should set owner", async function () {
      expect(await staking.owner()).to.equal(owner.address);
    });

    it("should have correct constants", async function () {
      expect(await staking.LOCKDOWN_24H()).to.equal(LOCKDOWN);
      expect(await staking.MULTIPLIER_6M()).to.equal(14000);
      expect(await staking.MULTIPLIER_12M()).to.equal(16000);
      expect(await staking.MULTIPLIER_18M()).to.equal(18000);
      expect(await staking.BRI_TRANSFER_FEE_BPS()).to.equal(500);
      expect(await staking.BRI_FEE_DENOMINATOR()).to.equal(10000);
      expect(await staking.MAX_REFERRAL_BPS()).to.equal(2000);
    });
  });

  describe("Staking", function () {
    it("should emit Staked event with correct params", async function () {
      const amount = ethers.parseEther("100");
      const tx = await staking.connect(user1).stake(amount, 1, ethers.ZeroAddress);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "Staked");
      expect(event.args.user).to.equal(user1.address);
      expect(event.args.amount).to.equal(amount);
    });

    it("should transfer tokens to contract", async function () {
      const amount = ethers.parseEther("100");
      const balBefore = await stakingToken.balanceOf(await staking.getAddress());
      await staking.connect(user1).stake(amount, 1, ethers.ZeroAddress);
      const balAfter = await stakingToken.balanceOf(await staking.getAddress());
      expect(balAfter - balBefore).to.equal(amount);
    });

    it("should apply 6M multiplier = 14000 (1.4x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 1, ethers.ZeroAddress);
      const expectedWeighted = amount * 14000n / 10000n;
      expect(await staking.getUserTotalWeightedBalance(user1.address)).to.equal(expectedWeighted);
    });

    it("should apply 12M multiplier = 16000 (1.6x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 2, ethers.ZeroAddress);
      expect(await staking.getUserTotalWeightedBalance(user1.address)).to.equal(amount * 16000n / 10000n);
    });

    it("should apply 18M multiplier = 18000 (1.8x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 3, ethers.ZeroAddress);
      expect(await staking.getUserTotalWeightedBalance(user1.address)).to.equal(amount * 18000n / 10000n);
    });

    it("should reject zero amount", async function () {
      await expect(
        staking.connect(user1).stake(0, 1, ethers.ZeroAddress)
      ).to.be.revertedWith("Zero stake payload");
    });

    it("should reject invalid lock period", async function () {
      await expect(
        staking.connect(user1).stake(ethers.parseEther("100"), 0, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid timeline selection");
      await expect(
        staking.connect(user1).stake(ethers.parseEther("100"), 4, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid timeline selection");
    });

    it("should count referrals", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, user2.address);
      expect(await staking.referralCount(user2.address)).to.equal(1);
    });

    it("should not accept self-referral", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, user1.address);
      expect(await staking.referralCount(user1.address)).to.equal(0);
    });

    it("should not count duplicate referral from same user", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, user2.address);
      await staking.connect(user1).stake(ethers.parseEther("100"), 2, user2.address);
      expect(await staking.referralCount(user2.address)).to.equal(1);
    });

    it("should not count zero-address referrer", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      expect(await staking.referralCount(ethers.ZeroAddress)).to.equal(0);
    });
  });

  describe("totalWeightedSupply and totalRawStaked", function () {
    it("should track total weighted supply across users", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await staking.connect(user2).stake(ethers.parseEther("200"), 2, ethers.ZeroAddress);
      const expected = ethers.parseEther("100") * 14000n / 10000n + ethers.parseEther("200") * 16000n / 10000n;
      expect(await staking.totalWeightedSupply()).to.equal(expected);
      expect(await staking.totalRawStaked()).to.equal(ethers.parseEther("300"));
    });

    it("should decrease on withdraw", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      expect(await staking.totalWeightedSupply()).to.equal(0);
      expect(await staking.totalRawStaked()).to.equal(0);
    });
  });

  describe("lastTimeRewardApplicable", function () {
    it("should return block.timestamp before rewardFinishTime", async function () {
      const applicable = await staking.lastTimeRewardApplicable();
      const block = await ethers.provider.getBlock("latest");
      expect(applicable).to.be.closeTo(block.timestamp, 2);
    });

    it("should return rewardFinishTime after it expires", async function () {
      await ethers.provider.send("evm_increaseTime", [31 * DAY]);
      await ethers.provider.send("evm_mine");
      const applicable = await staking.lastTimeRewardApplicable();
      const block = await ethers.provider.getBlock("latest");
      expect(applicable).to.be.lte(block.timestamp);
    });
  });

  describe("rewardPerTokenBri", function () {
    it("should return stored value when totalWeightedSupply is zero", async function () {
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      expect(await staking.rewardPerTokenBri()).to.equal(await staking.briRewardPerTokenStored());
    });

    it("should increase over time with positive rate and active stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      const before = await staking.briRewardPerTokenStored();
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      expect(await staking.rewardPerTokenBri()).to.be.gt(before);
    });
  });

  describe("rewardPerTokenXgovPoints", function () {
    it("should return stored value when totalWeightedSupply is zero", async function () {
      expect(await staking.rewardPerTokenXgovPoints()).to.equal(await staking.xgovPointPerTokenStored());
    });

    it("should increase over time with positive rate and active stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      const before = await staking.xgovPointPerTokenStored();
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      expect(await staking.rewardPerTokenXgovPoints()).to.be.gt(before);
    });
  });

  describe("getUserTotalWeightedBalance", function () {
    it("should return weighted sum of active stakes only", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await staking.connect(user1).stake(ethers.parseEther("200"), 2, ethers.ZeroAddress);
      const expected = ethers.parseEther("100") * 14000n / 10000n + ethers.parseEther("200") * 16000n / 10000n;
      expect(await staking.getUserTotalWeightedBalance(user1.address)).to.equal(expected);
    });

    it("should exclude withdrawn stakes", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      expect(await staking.getUserTotalWeightedBalance(user1.address)).to.equal(0);
    });
  });

  describe("earnedBri", function () {
    it("should return zero for account with no stakes", async function () {
      expect(await staking.earnedBri(user1.address)).to.equal(0);
    });

    it("should accrue rewards proportional to weighted stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      expect(await staking.earnedBri(user1.address)).to.be.gt(0);
    });

    it("should apply referral bonus to referrer", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, user2.address);
      await staking.connect(user2).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const base = await staking._earnedBriBase(user2.address);
      const earned = await staking.earnedBri(user2.address);
      const bonus = base * 1n * 500n / 10000n;
      expect(earned).to.equal(base + bonus);
    });
  });

  describe("earnedXgovPoints", function () {
    it("should return base gov points without referrals", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      expect(await staking.earnedXgovPoints(user1.address)).to.be.gt(0);
    });

    it("should apply referral bonus to gov points", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, user2.address);
      await staking.connect(user2).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const base = await staking._earnedXgovPointsBase(user2.address);
      const earned = await staking.earnedXgovPoints(user2.address);
      const bonus = base * 1n * 500n / 10000n;
      expect(earned).to.equal(base + bonus);
    });
  });

  describe("earnedBriNet (gross-up)", function () {
    it("should be ~5.26% higher than earnedBri", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const gross = await staking.earnedBriNet(user1.address);
      const net = await staking.earnedBri(user1.address);
      expect(gross).to.be.closeTo(net * 10000n / 9500n, net / 100n);
    });
  });

  describe("Lockdown and Early Unstake", function () {
    it("should revert earlyUnstake during 24h lockdown", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("24h lock active");
    });

    it("should allow earlyUnstake after 24h with penalties", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const tx = await staking.connect(user1).earlyUnstake(0);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "EarlyUnstaked");
      expect(event).to.not.be.undefined;
      expect(event.args.rewardPenalty).to.be.gt(0);
    });

    it("should reject earlyUnstake after lock expires", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("Use regular withdraw");
    });
  });

  describe("Withdraw", function () {
    it("should allow withdraw after lock period", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");

      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + amount);
    });

    it("should reject withdraw before lock expires", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await expect(
        staking.connect(user1).withdraw(0)
      ).to.be.revertedWith("Time lock active");
    });

    it("should allow partial withdraw while other stakes remain", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await staking.connect(user1).stake(ethers.parseEther("200"), 2, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");

      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + ethers.parseEther("100"));
    });

    it("should revert withdraw with invalid index", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await expect(
        staking.connect(user1).withdraw(5)
      ).to.be.revertedWith("Invalid index");
    });

    it("should revert withdraw on already withdrawn stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      await expect(
        staking.connect(user1).withdraw(0)
      ).to.be.revertedWith("Already extracted");
    });
  });

  describe("claimRewards", function () {
    it("should revert with no rewards on fresh instance", async function () {
      const frk = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await stakingToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await stakingToken.connect(user1).approve(await frk.getAddress(), ethers.parseEther("1000"));
      await frk.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await expect(
        frk.connect(user1).claimRewards()
      ).to.be.revertedWith("No rewards accrued");
    });

    it("should transfer BRT rewards to user", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimRewards();
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(balBefore);
    });

    it("should zero out pending rewards after claim", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).claimRewards();
      const userInfo = await staking.userInfo(user1.address);
      expect(userInfo.briRewardsPending).to.equal(0);
      expect(userInfo.xgovPointsPending).to.equal(0);
    });

    it("should emit RewardPaid event", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const tx = await staking.connect(user1).claimRewards();
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "RewardPaid");
      expect(event).to.not.be.undefined;
      expect(event.args.user).to.equal(user1.address);
    });

    it("should gross-up BRT for 5% transfer fee", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");

      const earned = await staking.earnedBri(user1.address);
      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimRewards();
      const balAfter = await rewardToken.balanceOf(user1.address);
      expect(balAfter - balBefore).to.be.gte(earned);
    });

    it("should accumulate XGOV points on claim", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const govBefore = await staking.accumulatedGovPoints(user1.address);
      await staking.connect(user1).claimRewards();
      const govAfter = await staking.accumulatedGovPoints(user1.address);
      expect(govAfter).to.be.gt(govBefore);
    });
  });

  describe("emergencyWithdraw", function () {
    it("should return principal and reset rewards", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).emergencyWithdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + amount);

      const userInfo = await staking.userInfo(user1.address);
      expect(userInfo.briRewardsPending).to.equal(0);
      expect(userInfo.xgovPointsPending).to.equal(0);
    });

    it("should emit EmergencyWithdrawn event", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      const tx = await staking.connect(user1).emergencyWithdraw(0);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "EmergencyWithdrawn");
      expect(event).to.not.be.undefined;
    });
  });

  describe("Owner Functions", function () {
    it("should allow owner to set reward rates", async function () {
      await staking.connect(owner).setRewardRates(ethers.parseEther("2"), ethers.parseEther("3"), 60 * DAY);
      expect(await staking.briRewardRate()).to.equal(ethers.parseEther("2"));
      expect(await staking.xgovPointRate()).to.equal(ethers.parseEther("3"));
    });

    it("should reject setRewardRates from non-owner", async function () {
      await expect(
        staking.connect(user1).setRewardRates(1, 1, DAY)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });

    it("should revert setRewardRates when duration is zero", async function () {
      await expect(
        staking.connect(owner).setRewardRates(1, 1, 0)
      ).to.be.revertedWith("Duration must be > 0");
    });

    it("should allow owner to set maxBriRewardRate", async function () {
      await staking.connect(owner).setMaxBriRewardRate(ethers.parseEther("5"));
      expect(await staking.maxBriRewardRate()).to.equal(ethers.parseEther("5"));
    });

    it("should reject setMaxBriRewardRate from non-owner", async function () {
      await expect(
        staking.connect(user1).setMaxBriRewardRate(1)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });

    it("should enforce maxBriRewardRate cap", async function () {
      await staking.connect(owner).setMaxBriRewardRate(ethers.parseEther("5"));
      await expect(
        staking.connect(owner).setRewardRates(ethers.parseEther("10"), 1, 30 * DAY)
      ).to.be.revertedWith("BRI Rate exceeds max");
    });

    it("should allow owner to set maxXgovPointRate", async function () {
      await staking.connect(owner).setMaxXgovPointRate(ethers.parseEther("5"));
      expect(await staking.maxXgovPointRate()).to.equal(ethers.parseEther("5"));
    });

    it("should enforce maxXgovPointRate cap", async function () {
      await staking.connect(owner).setMaxXgovPointRate(ethers.parseEther("5"));
      await expect(
        staking.connect(owner).setRewardRates(1, ethers.parseEther("10"), 30 * DAY)
      ).to.be.revertedWith("XGOV Rate exceeds max");
    });

    it("should allow anyone to fund rewards", async function () {
      await rewardToken.connect(user1).approve(await staking.getAddress(), ethers.parseEther("500"));
      await staking.connect(user1).fundRewards(ethers.parseEther("500"));
      const bal = await rewardToken.balanceOf(await staking.getAddress());
      expect(bal).to.be.gt(ethers.parseEther("1000000"));
    });

    it("should allow owner to recover ERC20", async function () {
      const randomToken = await (await ethers.getContractFactory("MockToken")).connect(owner).deploy("RAND", "RND");
      await randomToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("100"));
      const balBefore = await randomToken.balanceOf(owner.address);
      await staking.connect(owner).recoverERC20(await randomToken.getAddress(), ethers.parseEther("50"));
      expect(await randomToken.balanceOf(owner.address)).to.equal(balBefore + ethers.parseEther("50"));
    });

    it("should reject recoverERC20 from non-owner", async function () {
      await expect(
        staking.connect(user1).recoverERC20(await stakingToken.getAddress(), 1)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });
  });

  describe("setRewardRates — updates", function () {
    it("should set rewardFinishTime and lastUpdateTime", async function () {
      await ethers.provider.send("evm_increaseTime", [31 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(owner).setRewardRates(ethers.parseEther("2"), ethers.parseEther("3"), 10 * DAY);

      const finish = await staking.rewardFinishTime();
      const block = await ethers.provider.getBlock("latest");
      expect(finish).to.be.closeTo(block.timestamp + 10 * DAY, 2);

      const lastUpdate = await staking.lastUpdateTime();
      expect(lastUpdate).to.be.closeTo(block.timestamp, 2);
    });
  });

  describe("setMigrationSource / onMigrate", function () {
    it("should allow owner to set migrationSource", async function () {
      await staking.connect(owner).setMigrationSource(user1.address);
      expect(await staking.migrationSource()).to.equal(user1.address);
    });

    it("should reject setMigrationSource from non-owner", async function () {
      await expect(
        staking.connect(user1).setMigrationSource(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });

    it("should accept migrated stake via onMigrate from authorized source", async function () {
      await staking.connect(owner).setMigrationSource(owner.address);
      const lockEndTime = (await ethers.provider.getBlock("latest")).timestamp + LOCK_6M;
      const weightedAmount = ethers.parseEther("150");
      await staking.connect(owner).onMigrate(user1.address, weightedAmount, lockEndTime, 14000, 0, 0, 0);
      expect(await staking.totalRawStaked()).to.equal(weightedAmount);
      expect(await staking.totalWeightedSupply()).to.equal(weightedAmount * 14000n / 10000n);
    });

    it("should reject onMigrate from unauthorized source", async function () {
      await expect(
        staking.connect(user1).onMigrate(user1.address, ethers.parseEther("100"), 0, 10000, 0, 0, 0)
      ).to.be.revertedWith("Not authorized");
    });

    it("should reject onMigrate with zero amount", async function () {
      await staking.connect(owner).setMigrationSource(owner.address);
      await expect(
        staking.connect(owner).onMigrate(user1.address, 0, 0, 10000, 0, 0, 0)
      ).to.be.revertedWith("Zero migration payload");
    });

    it("should migrate stake to new contract via migrateTo", async function () {
      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await target.connect(owner).setMigrationSource(await staking.getAddress());

      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const before = await staking.getUserTotalWeightedBalance(user1.address);
      await staking.connect(user1).migrateTo(await target.getAddress(), 0);

      expect(await staking.getUserTotalWeightedBalance(user1.address)).to.equal(0);
      expect(await staking.totalRawStaked()).to.equal(0);
      expect(await staking.totalWeightedSupply()).to.equal(0);
      expect(await target.getUserTotalWeightedBalance(user1.address)).to.equal(before);
    });

    it("should reject migrateTo before 24h lockdown", async function () {
      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());

      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await expect(
        staking.connect(user1).migrateTo(await target.getAddress(), 0)
      ).to.be.revertedWith("24h lock active");
    });

    it("should emit Migrated event", async function () {
      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await target.connect(owner).setMigrationSource(await staking.getAddress());

      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const tx = await staking.connect(user1).migrateTo(await target.getAddress(), 0);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "Migrated");
      expect(event).to.not.be.undefined;
      expect(event.args.user).to.equal(user1.address);
      expect(event.args.newContract).to.equal(await target.getAddress());
    });
  });

  describe("Constants", function () {
    it("should match all constants", async function () {
      expect(await staking.LOCKDOWN_24H()).to.equal(24 * 3600);
      expect(await staking.MULTIPLIER_6M()).to.equal(14000);
      expect(await staking.MULTIPLIER_12M()).to.equal(16000);
      expect(await staking.MULTIPLIER_18M()).to.equal(18000);
      expect(await staking.BRI_TRANSFER_FEE_BPS()).to.equal(500);
      expect(await staking.BRI_FEE_DENOMINATOR()).to.equal(10000);
      expect(await staking.MAX_REFERRAL_BPS()).to.equal(2000);
    });
  });

  describe("Full staking cycle", function () {
    it("should stake, claim rewards, and withdraw all lock periods", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1, ethers.ZeroAddress);
      await staking.connect(user1).stake(ethers.parseEther("100"), 2, ethers.ZeroAddress);
      await staking.connect(user1).stake(ethers.parseEther("100"), 3, ethers.ZeroAddress);

      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).claimRewards();

      await ethers.provider.send("evm_increaseTime", [LOCK_6M - 10 * DAY + 1]);
      await ethers.provider.send("evm_mine");
      let bal = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(bal + ethers.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [LOCK_12M - LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");
      bal = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(1);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(bal + ethers.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [LOCK_18M - LOCK_12M + 1]);
      await ethers.provider.send("evm_mine");
      bal = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(2);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(bal + ethers.parseEther("100"));
    });
  });

  describe("Multiple stakers", function () {
    it("should split rewards proportionally", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await staking.connect(user2).stake(ethers.parseEther("500"), 2, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");

      const e1 = await staking.earnedBri(user1.address);
      const e2 = await staking.earnedBri(user2.address);
      expect(e1).to.be.gt(0);
      expect(e2).to.be.gt(0);
      const ratio = (e1 * 10000n) / e2;
      expect(ratio).to.be.closeTo(17500n, 500n);
    });
  });

  describe("Referral bonus on claimRewards", function () {
    it("should pay referral bonus on claim", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, user2.address);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const earned = await staking.earnedBri(user1.address);
      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimRewards();
      const balAfter = await rewardToken.balanceOf(user1.address);
      expect(balAfter - balBefore).to.be.gte(earned);
    });
  });

  describe("Cross-function: updateReward modifier consistency", function () {
    it("should sync pending rewards on any state-changing call", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [5 * DAY]);
      await ethers.provider.send("evm_mine");

      const earned1 = await staking.earnedBri(user1.address);
      await staking.connect(user1).stake(ethers.parseEther("100"), 2, ethers.ZeroAddress);
      const earned2 = await staking.earnedBri(user1.address);
      expect(earned2).to.be.gte(earned1);
    });
  });

  describe("Reward accrual after setRewardRates update", function () {
    it("should accrue new rewards at new rates", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [30 * DAY]);
      await ethers.provider.send("evm_mine");

      const earnedBefore = await staking.earnedBri(user1.address);
      await staking.connect(owner).setRewardRates(ethers.parseEther("2"), ethers.parseEther("2"), 10 * DAY);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const earnedAfter = await staking.earnedBri(user1.address);
      expect(earnedAfter).to.be.gte(earnedBefore);
    });
  });

  describe("Complex scenarios", function () {
    it("multi-user lifecycle with dual-reward rate changes", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("10000000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await staking.connect(user2).stake(ethers.parseEther("500"), 2, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const bri1 = await staking.earnedBri(user1.address);
      const xgov1 = await staking.earnedXgovPoints(user2.address);
      expect(bri1).to.be.gt(0);
      expect(xgov1).to.be.gt(0);

      await staking.connect(owner).setRewardRates(ethers.parseEther("3"), ethers.parseEther("5"), 30 * DAY);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");

      const bri2 = await staking.earnedBri(user1.address);
      const xgov2 = await staking.earnedXgovPoints(user2.address);
      expect(bri2).to.be.gt(bri1);
      expect(xgov2).to.be.gt(xgov1);

      await staking.connect(user3).stake(ethers.parseEther("300"), 3, user1.address);
      await ethers.provider.send("evm_increaseTime", [5 * DAY]);
      await ethers.provider.send("evm_mine");

      const briWithRef = await staking.earnedBri(user1.address);
      const base = await staking._earnedBriBase(user1.address);
      expect(briWithRef).to.be.gt(base);

      const aBalBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).earlyUnstake(0);
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(aBalBefore);
      expect(await staking.accumulatedGovPoints(user1.address)).to.be.gt(0);

      await ethers.provider.send("evm_increaseTime", [LOCK_12M - 25 * DAY + 1]);
      await ethers.provider.send("evm_mine");
      const bBalBefore = await stakingToken.balanceOf(user2.address);
      await staking.connect(user2).withdraw(0);
      expect(await stakingToken.balanceOf(user2.address)).to.equal(bBalBefore + ethers.parseEther("500"));

      expect(await staking.totalRawStaked()).to.equal(ethers.parseEther("300"));
    });

    it("gov points accumulate across multiple claims with referral bonus", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("10000000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1, ethers.ZeroAddress);
      await staking.connect(user2).stake(ethers.parseEther("500"), 1, user1.address);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");

      await staking.connect(user1).claimRewards();
      const gov1 = await staking.accumulatedGovPoints(user1.address);
      expect(gov1).to.be.gt(0);

      const govBeforeSecond = gov1;
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).claimRewards();
      const govAfter2 = await staking.accumulatedGovPoints(user1.address);

      expect(govAfter2).to.be.gt(govBeforeSecond);
      expect(govAfter2).to.be.gt(0);

      const uinfoAfter = await staking.userInfo(user1.address);
      expect(uinfoAfter.xgovPointsPending).to.equal(0);
      expect(uinfoAfter.briRewardsPending).to.equal(0);
    });

    it("emergencyWithdraw after partial claim", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("10000000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"), 2, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).claimRewards();
      const afterClaim = await rewardToken.balanceOf(user1.address);
      expect(afterClaim).to.be.gt(0);

      await staking.connect(user1).emergencyWithdraw(0);
      const userInfo = await staking.userInfo(user1.address);
      expect(userInfo.briRewardsPending).to.equal(0);
      expect(userInfo.xgovPointsPending).to.equal(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(ethers.parseEther("10000"));
    });

    it("migrate then claim rewards on target", async function () {
      await staking.connect(user1).stake(ethers.parseEther("500"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await target.connect(owner).setMigrationSource(await staking.getAddress());
      await rewardToken.connect(owner).mint(await target.getAddress(), ethers.parseEther("10000000"));
      await target.connect(owner).setRewardRates(ethers.parseEther("1"), ethers.parseEther("1"), 30 * DAY);

      await staking.connect(user1).migrateTo(await target.getAddress(), 0);
      expect(await target.getUserTotalWeightedBalance(user1.address)).to.be.gt(0);

      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const balBefore = await rewardToken.balanceOf(user1.address);
      await target.connect(user1).claimRewards();
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(balBefore);
    });

    it("three consecutive migrations (A→B→C) with state preservation", async function () {
      await staking.connect(user1).stake(ethers.parseEther("300"), 1, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const weightBefore = await staking.getUserTotalWeightedBalance(user1.address);

      const b = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      const c = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await b.connect(owner).setMigrationSource(await staking.getAddress());
      await c.connect(owner).setMigrationSource(await b.getAddress());
      await rewardToken.connect(owner).mint(await c.getAddress(), ethers.parseEther("100000"));

      await staking.connect(user1).migrateTo(await b.getAddress(), 0);
      expect(await b.getUserTotalWeightedBalance(user1.address)).to.equal(weightBefore);
      expect(await staking.getUserTotalWeightedBalance(user1.address)).to.equal(0);

      await b.connect(user1).migrateTo(await c.getAddress(), 0);
      expect(await c.getUserTotalWeightedBalance(user1.address)).to.equal(weightBefore);
      expect(await b.getUserTotalWeightedBalance(user1.address)).to.equal(0);

      expect(await c.totalRawStaked()).to.equal(ethers.parseEther("300"));
      expect(await c.totalWeightedSupply()).to.equal(weightBefore);
    });

    it("BRI and XGOV rate caps enforced during lifecycle", async function () {
      await staking.connect(owner).setMaxBriRewardRate(ethers.parseEther("10"));
      await staking.connect(owner).setMaxXgovPointRate(ethers.parseEther("10"));
      await staking.connect(owner).setRewardRates(ethers.parseEther("8"), ethers.parseEther("8"), 30 * DAY);
      expect(await staking.briRewardRate()).to.equal(ethers.parseEther("8"));

      await expect(
        staking.connect(owner).setRewardRates(ethers.parseEther("12"), ethers.parseEther("8"), 30 * DAY)
      ).to.be.revertedWith("BRI Rate exceeds max");
      await expect(
        staking.connect(owner).setRewardRates(ethers.parseEther("8"), ethers.parseEther("12"), 30 * DAY)
      ).to.be.revertedWith("XGOV Rate exceeds max");
    });

    it("stake, claim both rewards, withdraw, verify totals", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("5000000"));
      await staking.connect(user1).stake(ethers.parseEther("400"), 2, ethers.ZeroAddress);
      await ethers.provider.send("evm_increaseTime", [15 * DAY]);
      await ethers.provider.send("evm_mine");

      const briBefore = await rewardToken.balanceOf(user1.address);
      const govBefore = await staking.accumulatedGovPoints(user1.address);
      await staking.connect(user1).claimRewards();
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(briBefore);
      expect(await staking.accumulatedGovPoints(user1.address)).to.be.gt(govBefore);

      await ethers.provider.send("evm_increaseTime", [LOCK_12M - 15 * DAY + 1]);
      await ethers.provider.send("evm_mine");
      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + ethers.parseEther("400"));
      expect(await staking.totalRawStaked()).to.equal(0);
    });
  });
});
