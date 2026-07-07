const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("hNobtCoreStaking", function () {
  this.timeout(120000);
  let stakingToken, rewardToken, staking;
  let owner, user1, user2, user3;

  const DAY = 86400;
  const LOCK_3M = 90 * DAY;
  const LOCK_6M = 180 * DAY;
  const LOCK_12M = 365 * DAY;
  const LOCKDOWN = 24 * 3600;

  async function deployCore(tokenAddr, rewardAddr) {
    const factory = await ethers.getContractFactory("hNobtCoreStaking");
    const impl = await factory.deploy();
    const initData = factory.interface.encodeFunctionData("initialize", [tokenAddr, rewardAddr]);
    const ERC1967Proxy = await ethers.getContractFactory("@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy");
    const proxy = await ERC1967Proxy.deploy(await impl.getAddress(), initData);
    return factory.attach(await proxy.getAddress());
  }

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockToken");
    stakingToken = await MockToken.connect(owner).deploy("hNOBT", "hNOBT");
    rewardToken = await MockToken.connect(owner).deploy("BRT", "BRT");

    staking = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());

    for (const u of [owner, user1, user2, user3]) {
      await stakingToken.connect(owner).mint(u.address, ethers.parseEther("10000"));
      await stakingToken.connect(u).approve(await staking.getAddress(), ethers.parseEther("10000"));
    }

    await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("1000000"));
    await staking.connect(owner).setRewardRate(ethers.parseEther("1"), 30 * DAY);
  });

  describe("Deployment", function () {
    it("should set correct tokens", async function () {
      expect(await staking.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await staking.rewardToken()).to.equal(await rewardToken.getAddress());
    });

    it("should set owner", async function () {
      expect(await staking.owner()).to.equal(owner.address);
    });

    it("should have correct constants", async function () {
      expect(await staking.LOCK_3M()).to.equal(90 * DAY);
      expect(await staking.LOCK_6M()).to.equal(180 * DAY);
      expect(await staking.LOCK_12M()).to.equal(365 * DAY);
      expect(await staking.LOCKDOWN_24H()).to.equal(LOCKDOWN);
      expect(await staking.MULT_3M()).to.equal(10000);
      expect(await staking.MULT_6M()).to.equal(12500);
      expect(await staking.MULT_12M()).to.equal(15000);
      expect(await staking.MULT_BASE()).to.equal(10000);
    });
  });

  describe("Staking", function () {
    it("should emit Staked event with correct params", async function () {
      const amount = ethers.parseEther("100");
      const tx = await staking.connect(user1).stake(amount, 1);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "Staked");

      expect(event.args.user).to.equal(user1.address);
      expect(event.args.amount).to.equal(amount);
      expect(event.args.lockPeriod).to.equal(1);
    });

    it("should transfer tokens to contract", async function () {
      const amount = ethers.parseEther("100");
      const balBefore = await stakingToken.balanceOf(await staking.getAddress());
      await staking.connect(user1).stake(amount, 1);
      const balAfter = await stakingToken.balanceOf(await staking.getAddress());
      expect(balAfter - balBefore).to.equal(amount);
    });

    it("should apply 3M multiplier = 10000 (1.0x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 1);
      expect(await staking.userWeightedStake(user1.address)).to.equal(amount);
    });

    it("should apply 6M multiplier = 12500 (1.25x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 2);
      expect(await staking.userWeightedStake(user1.address)).to.equal(amount * 12500n / 10000n);
    });

    it("should apply 12M multiplier = 15000 (1.5x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 3);
      expect(await staking.userWeightedStake(user1.address)).to.equal(amount * 15000n / 10000n);
    });

    it("should reject zero amount", async function () {
      await expect(
        staking.connect(user1).stake(0, 1)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("should reject invalid lock period", async function () {
      await expect(
        staking.connect(user1).stake(ethers.parseEther("100"), 0)
      ).to.be.revertedWith("Invalid lock period");
      await expect(
        staking.connect(user1).stake(ethers.parseEther("100"), 4)
      ).to.be.revertedWith("Invalid lock period");
    });
  });

  describe("totalWeightedStake", function () {
    it("should track total weighted stake across users", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user2).stake(ethers.parseEther("200"), 2);
      const expected = ethers.parseEther("100") * 10000n / 10000n + ethers.parseEther("200") * 12500n / 10000n;
      expect(await staking.totalWeightedStake()).to.equal(expected);
    });

    it("should decrease on withdraw", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      expect(await staking.totalWeightedStake()).to.equal(0);
    });
  });

  describe("lastTimeRewardApplicable", function () {
    it("should return block.timestamp before rewardFinishTime", async function () {
      const applicable = await staking.lastTimeRewardApplicable();
      expect(applicable).to.be.closeTo(
        await ethers.provider.getBlock("latest").then(b => b.timestamp),
        2
      );
    });

    it("should return rewardFinishTime after it expires", async function () {
      await ethers.provider.send("evm_increaseTime", [31 * DAY]);
      await ethers.provider.send("evm_mine");
      const applicable = await staking.lastTimeRewardApplicable();
      const block = await ethers.provider.getBlock("latest");
      expect(applicable).to.be.lte(block.timestamp);
    });
  });

  describe("rewardPerToken", function () {
    it("should return stored value when totalWeightedStake is zero", async function () {
      await staking.connect(owner).setRewardRate(ethers.parseEther("1"), 30 * DAY);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const rp = await staking.rewardPerToken();
      expect(rp).to.equal(await staking.rewardPerTokenStored());
    });

    it("should increase rewardPerToken over time with positive rate and active stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      const before = await staking.rewardPerTokenStored();
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const rp = await staking.rewardPerToken();
      expect(rp).to.be.gt(before);
    });

    it("should freeze at rewardPerTokenStored after rewardFinishTime (no underflow)", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [31 * DAY]);
      await ethers.provider.send("evm_mine");

      await staking.connect(user1).stake(ethers.parseEther("1"), 1);

      const rp = await staking.rewardPerToken();
      expect(rp).to.equal(await staking.rewardPerTokenStored());

      const earned = await staking.earned(user1.address);
      expect(earned).to.be.gte(0);
    });
  });

  describe("userWeightedStake", function () {
    it("should return weighted sum of active stakes only", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user1).stake(ethers.parseEther("200"), 2);
      const uw = await staking.userWeightedStake(user1.address);
      expect(uw).to.equal(
        ethers.parseEther("100") * 10000n / 10000n + ethers.parseEther("200") * 12500n / 10000n
      );
    });

    it("should exclude withdrawn stakes", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      expect(await staking.userWeightedStake(user1.address)).to.equal(0);
    });
  });

  describe("earned", function () {
    it("should return zero for account with no stakes", async function () {
      expect(await staking.earned(user1.address)).to.equal(0);
    });

    it("should accrue rewards proportional to weighted stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const e1 = await staking.earned(user1.address);
      expect(e1).to.be.gt(0);

      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const e2 = await staking.earned(user1.address);
      expect(e2).to.be.gt(e1);
    });

    it("should reflect rewards across multiple users", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await staking.connect(user2).stake(ethers.parseEther("500"), 2);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");

      const e1 = await staking.earned(user1.address);
      const e2 = await staking.earned(user2.address);
      expect(e1).to.be.gt(0);
      expect(e2).to.be.gt(0);
    });
  });

  describe("Lockdown and Early Unstake", function () {
    it("should revert earlyUnstake during 24h lockdown", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("24h lock active");
    });

    it("should allow earlyUnstake after 24h with 50% reward", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const tx = await staking.connect(user1).earlyUnstake(0);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "EarlyUnstaked");
      expect(event).to.not.be.undefined;
      expect(event.args.rewardPenalty).to.be.gt(0);
    });

    it("should reject earlyUnstake after lock expires", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("Use regular withdraw");
    });
  });

  describe("Withdraw", function () {
    it("should allow withdraw after lock period", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");

      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + amount);
    });

    it("should reject withdraw before lock expires", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).withdraw(0)
      ).to.be.revertedWith("Lock not expired");
    });

    it("should allow partial withdraw while other stakes remain", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user1).stake(ethers.parseEther("200"), 2);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");

      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + ethers.parseEther("100"));
    });

    it("should revert withdraw with invalid index", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).withdraw(5)
      ).to.be.revertedWith("Invalid index");
    });

    it("should revert withdraw on already withdrawn stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      await expect(
        staking.connect(user1).withdraw(0)
      ).to.be.revertedWith("Already withdrawn");
    });
  });

  describe("claimReward", function () {
    it("should revert with no rewards on fresh instance", async function () {
      const frk = await deployCore(
        await stakingToken.getAddress(),
        await rewardToken.getAddress()
      );
      await stakingToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await stakingToken.connect(user1).approve(await frk.getAddress(), ethers.parseEther("1000"));
      await frk.connect(user1).stake(ethers.parseEther("1000"), 1);
      await expect(
        frk.connect(user1).claimReward()
      ).to.be.revertedWith("No rewards");
    });

    it("should transfer rewards to user", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimReward();
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(balBefore);
    });

    it("should zero out pendingRewards after claim", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).claimReward();
      const userInfo = await staking.users(user1.address);
      expect(userInfo.pendingRewards).to.equal(0);
    });

    it("should emit RewardClaimed event", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const tx = await staking.connect(user1).claimReward();
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "RewardClaimed");
      expect(event).to.not.be.undefined;
      expect(event.args.user).to.equal(user1.address);
      expect(event.args.amount).to.be.gt(0);
    });

    it("should gross-up for BRT 5% transfer fee", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");

      const earned = await staking.earned(user1.address);
      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimReward();
      const balAfter = await rewardToken.balanceOf(user1.address);
      expect(balAfter - balBefore).to.be.gte(earned);
    });

    it("should allow claiming after reward period ends", async function () {
      const fresh = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await rewardToken.connect(owner).mint(await fresh.getAddress(), ethers.parseEther("1000"));
      await stakingToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await stakingToken.connect(user1).approve(await fresh.getAddress(), ethers.parseEther("1000"));
      await fresh.connect(user1).stake(ethers.parseEther("100"), 1);
      await fresh.connect(owner).setRewardRate(ethers.parseEther("0.001"), 1 * DAY);
      await ethers.provider.send("evm_increaseTime", [2 * DAY]);
      await ethers.provider.send("evm_mine");

      await expect(
        fresh.connect(user1).claimReward()
      ).to.not.be.reverted;
    });
  });

  describe("emergencyWithdraw", function () {
    it("should return principal and reset rewards", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).emergencyWithdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + amount);

      const userInfo = await staking.users(user1.address);
      expect(userInfo.pendingRewards).to.equal(0);
      expect(await staking.totalWeightedStake()).to.equal(0);
    });

    it("should reset pendingRewards to 0 even if accrued", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const earned = await staking.earned(user1.address);
      expect(earned).to.be.gt(0);

      await staking.connect(user1).emergencyWithdraw(0);
      const userInfo = await staking.users(user1.address);
      expect(userInfo.pendingRewards).to.equal(0);
    });

    it("should emit EmergencyWithdrawn event", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      const tx = await staking.connect(user1).emergencyWithdraw(0);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "EmergencyWithdrawn");
      expect(event).to.not.be.undefined;
    });
  });

  describe("Owner Functions", function () {
    it("should allow owner to set reward rate", async function () {
      await staking.connect(owner).setRewardRate(ethers.parseEther("2"), 60 * DAY);
      expect(await staking.rewardRate()).to.equal(ethers.parseEther("2"));
    });

    it("should reject setRewardRate from non-owner", async function () {
      await expect(
        staking.connect(user1).setRewardRate(ethers.parseEther("1"), 30 * DAY)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });

    it("should revert setRewardRate when duration is zero", async function () {
      await expect(
        staking.connect(owner).setRewardRate(ethers.parseEther("1"), 0)
      ).to.be.revertedWith("Duration must be positive");
    });

    it("should update rewardFinishTime on setRewardRate", async function () {
      await staking.connect(owner).setRewardRate(ethers.parseEther("2"), 30 * DAY);
      const finish = await staking.rewardFinishTime();
      const block = await ethers.provider.getBlock("latest");
      expect(finish).to.be.closeTo(block.timestamp + 30 * DAY, 2);
    });
  });

  describe("Cross-function: updateReward modifier consistency", function () {
    it("should sync pendingRewards on any state-changing call", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [5 * DAY]);
      await ethers.provider.send("evm_mine");

      const earned1 = await staking.earned(user1.address);
      await staking.connect(user1).stake(ethers.parseEther("100"), 2);
      const earned2 = await staking.earned(user1.address);
      expect(earned2).to.be.gte(earned1);
    });
  });

  describe("Reward accrual after setRewardRate update", function () {
    it("should accrue new rewards at new rate after setRewardRate", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [30 * DAY]);
      await ethers.provider.send("evm_mine");

      const earnedBefore = await staking.earned(user1.address);
      await staking.connect(owner).setRewardRate(ethers.parseEther("2"), 10 * DAY);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const earnedAfter = await staking.earned(user1.address);
      expect(earnedAfter).to.be.gte(earnedBefore);
    });
  });

  describe("Withdraw all three periods in sequence", function () {
    it("should return exact principals after respective lock periods", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user1).stake(ethers.parseEther("100"), 2);
      await staking.connect(user1).stake(ethers.parseEther("100"), 3);

      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      let bal = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(bal + ethers.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [LOCK_6M - LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      bal = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(1);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(bal + ethers.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [LOCK_12M - LOCK_6M + 1]);
      await ethers.provider.send("evm_mine");
      bal = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(2);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(bal + ethers.parseEther("100"));
    });
  });

  describe("BRT 5% transfer fee — gross-up accounting", function () {
    it("should have BRI_TRANSFER_FEE_BPS == 500 and BRI_FEE_DENOMINATOR == 10000", async function () {
      expect(await staking.BRI_TRANSFER_FEE_BPS()).to.equal(500);
      expect(await staking.BRI_FEE_DENOMINATOR()).to.equal(10000);
    });
  });

  describe("migrateStakes", function () {
    it("should allow owner to migrate stakes to a user", async function () {
      const lockEndTime = (await ethers.provider.getBlock("latest")).timestamp + LOCK_6M;
      const weightedAmount = ethers.parseEther("150");
      await staking.connect(owner).migrateStakes(user1.address, lockEndTime, weightedAmount);

      const uw = await staking.userWeightedStake(user1.address);
      expect(uw).to.equal(weightedAmount);
      expect(await staking.totalWeightedStake()).to.equal(weightedAmount);
    });

    it("should reject duplicate migration (same lockEndTime + weightedAmount)", async function () {
      const lockEndTime = (await ethers.provider.getBlock("latest")).timestamp + LOCK_6M;
      const weightedAmount = ethers.parseEther("150");
      await staking.connect(owner).migrateStakes(user1.address, lockEndTime, weightedAmount);
      await expect(
        staking.connect(owner).migrateStakes(user1.address, lockEndTime, weightedAmount)
      ).to.be.revertedWith("Stake already exists");
    });

    it("should allow migration with different param combinations", async function () {
      const t = (await ethers.provider.getBlock("latest")).timestamp;
      await staking.connect(owner).migrateStakes(user1.address, t + LOCK_3M, ethers.parseEther("100"));
      await staking.connect(owner).migrateStakes(user1.address, t + LOCK_6M, ethers.parseEther("100"));

      const uw = await staking.userWeightedStake(user1.address);
      expect(uw).to.equal(ethers.parseEther("200"));
    });

    it("should reject migrateStakes from non-owner", async function () {
      const lockEndTime = (await ethers.provider.getBlock("latest")).timestamp + LOCK_6M;
      await expect(
        staking.connect(user1).migrateStakes(user2.address, lockEndTime, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });
  });

  describe("setMigrationSource / onMigrate / migrateTo", function () {
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
      const amount = ethers.parseEther("100");
      await staking.connect(owner).onMigrate(user1.address, amount, lockEndTime, 12500, 0, 0);
      expect(await staking.userWeightedStake(user1.address)).to.equal(amount * 12500n / 10000n);
      expect(await staking.totalWeightedStake()).to.equal(amount * 12500n / 10000n);
    });

    it("should reject onMigrate from unauthorized source", async function () {
      await expect(
        staking.connect(user1).onMigrate(user1.address, ethers.parseEther("100"), 0, 10000, 0, 0)
      ).to.be.revertedWith("Not authorized");
    });

    it("should migrate stake to new contract via migrateTo", async function () {
      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await target.connect(owner).setMigrationSource(await staking.getAddress());

      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const before = await staking.userWeightedStake(user1.address);
      await staking.connect(user1).migrateTo(await target.getAddress(), 0);

      expect(await staking.userWeightedStake(user1.address)).to.equal(0);
      expect(await target.userWeightedStake(user1.address)).to.equal(before);
    });

    it("should reject migrateTo before 24h lockdown", async function () {
      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());

      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).migrateTo(await target.getAddress(), 0)
      ).to.be.revertedWith("24h lockdown not passed");
    });

    it("should emit Migrated event", async function () {
      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await target.connect(owner).setMigrationSource(await staking.getAddress());

      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
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

  describe("earlyUnstake — edge cases", function () {
    it("should revert earlyUnstake with invalid index", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).earlyUnstake(9)
      ).to.be.revertedWith("Invalid index");
    });

    it("should revert earlyUnstake on already withdrawn stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("Already withdrawn");
    });

    it("should revert earlyUnstake before 24h lockdown passes", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("24h lock active");
    });
  });

  describe("User data view", function () {
    it("should correctly report userWeightedStake after staking", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      expect(await staking.userWeightedStake(user1.address)).to.equal(ethers.parseEther("100"));
      expect(await staking.totalWeightedStake()).to.equal(ethers.parseEther("100"));
    });

    it("should track rewardDebt after interactions", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).stake(ethers.parseEther("500"), 2);

      const userInfo = await staking.users(user1.address);
      expect(userInfo.rewardDebt).to.be.gt(0);
    });
  });

  describe("Constants", function () {
    it("should match all constants", async function () {
      expect(await staking.LOCK_3M()).to.equal(90 * DAY);
      expect(await staking.LOCK_6M()).to.equal(180 * DAY);
      expect(await staking.LOCK_12M()).to.equal(365 * DAY);
      expect(await staking.LOCKDOWN_24H()).to.equal(24 * 3600);
      expect(await staking.MULT_3M()).to.equal(10000);
      expect(await staking.MULT_6M()).to.equal(12500);
      expect(await staking.MULT_12M()).to.equal(15000);
      expect(await staking.MULT_BASE()).to.equal(10000);
      expect(await staking.BRI_TRANSFER_FEE_BPS()).to.equal(500);
      expect(await staking.BRI_FEE_DENOMINATOR()).to.equal(10000);
    });
  });

  describe("Full withdrawal cycle", function () {
    it("should stake, wait, withdraw, and claim rewards", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");

      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimReward();
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(balBefore);

      await ethers.provider.send("evm_increaseTime", [LOCK_3M - 10 * DAY + 1]);
      await ethers.provider.send("evm_mine");

      const tokenBalBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(tokenBalBefore + ethers.parseEther("1000"));
    });
  });

  describe("Complex scenarios", function () {
    it("multi-user lifecycle with mid-period rate change", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("5000000"));
      await staking.connect(user1).stake(ethers.parseEther("1000"), 2);
      await staking.connect(user2).stake(ethers.parseEther("500"), 3);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const e1a = await staking.earned(user1.address);
      const e1b = await staking.earned(user2.address);
      expect(e1a).to.be.gt(0);
      expect(e1b).to.be.gt(0);

      await staking.connect(owner).setRewardRate(ethers.parseEther("2"), 30 * DAY);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const e2a = await staking.earned(user1.address);
      const e2b = await staking.earned(user2.address);
      expect(e2a).to.be.gt(e1a);
      expect(e2b).to.be.gt(e1b);

      await staking.connect(user3).stake(ethers.parseEther("200"), 1);

      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");
      const aBalBefore = await stakingToken.balanceOf(user1.address);
      const rBalBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).earlyUnstake(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(aBalBefore + ethers.parseEther("1000"));
      expect(await rewardToken.balanceOf(user1.address)).to.be.gt(rBalBefore);

      await ethers.provider.send("evm_increaseTime", [LOCK_12M - 20 * DAY + 1]);
      await ethers.provider.send("evm_mine");
      const bBalBefore = await stakingToken.balanceOf(user2.address);
      await staking.connect(user2).withdraw(0);
      expect(await stakingToken.balanceOf(user2.address)).to.equal(bBalBefore + ethers.parseEther("500"));

      expect(await staking.totalWeightedStake()).to.equal(ethers.parseEther("200"));
    });

    it("emergencyWithdraw after partial reward accrual", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 2);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const earnedBefore = await staking.earned(user1.address);
      expect(earnedBefore).to.be.gt(0);

      await staking.connect(user1).emergencyWithdraw(0);
      const userInfo = await staking.users(user1.address);
      expect(userInfo.pendingRewards).to.equal(0);

      await expect(
        staking.connect(user1).claimReward()
      ).to.be.revertedWith("No rewards");
    });

    it("stake, claim, stake more, claim again with rate change in between", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("5000000"));
      await staking.connect(user1).stake(ethers.parseEther("500"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).claimReward();
      const afterFirstClaim = await rewardToken.balanceOf(user1.address);
      expect(afterFirstClaim).to.be.gt(0);

      await staking.connect(owner).setRewardRate(ethers.parseEther("3"), 30 * DAY);
      await staking.connect(user1).stake(ethers.parseEther("500"), 2);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).claimReward();
      const afterSecondClaim = await rewardToken.balanceOf(user1.address);
      expect(afterSecondClaim).to.be.gt(afterFirstClaim);
    });

    it("migrate one stake then the other from same user", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user1).stake(ethers.parseEther("200"), 2);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await target.connect(owner).setMigrationSource(await staking.getAddress());

      const beforeTotal = await staking.userWeightedStake(user1.address);
      await staking.connect(user1).migrateTo(await target.getAddress(), 0);
      let postMigrate = await staking.userWeightedStake(user1.address);
      expect(postMigrate).to.be.lt(beforeTotal);
      expect(postMigrate).to.be.gt(0);

      await staking.connect(user1).migrateTo(await target.getAddress(), 1);
      expect(await staking.userWeightedStake(user1.address)).to.equal(0);
      expect(await staking.totalWeightedStake()).to.equal(0);

      expect(await target.userWeightedStake(user1.address)).to.equal(beforeTotal);
    });

    it("can claim pre-migration rewards on old contract", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("5000000"));
      await staking.connect(user1).stake(ethers.parseEther("500"), 2);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const target = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await target.connect(owner).setMigrationSource(await staking.getAddress());

      const earnedBefore = await staking.earned(user1.address);
      await staking.connect(user1).migrateTo(await target.getAddress(), 0);

      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimReward();
      expect(await rewardToken.balanceOf(user1.address)).to.be.gte(balBefore + earnedBefore);
    });

    it("three consecutive migrations (A→B→C)", async function () {
      await staking.connect(user1).stake(ethers.parseEther("300"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const b = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      const c = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await b.connect(owner).setMigrationSource(await staking.getAddress());
      await c.connect(owner).setMigrationSource(await b.getAddress());

      await staking.connect(user1).migrateTo(await b.getAddress(), 0);
      expect(await b.userWeightedStake(user1.address)).to.equal(ethers.parseEther("300"));

      await b.connect(user1).migrateTo(await c.getAddress(), 0);
      expect(await c.userWeightedStake(user1.address)).to.equal(ethers.parseEther("300"));
      expect(await b.userWeightedStake(user1.address)).to.equal(0);
      expect(await staking.userWeightedStake(user1.address)).to.equal(0);
    });

    it("rewardPerToken does not underflow when totalWeightedStake goes to zero mid-period", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");
      await staking.connect(user1).withdraw(0);
      const rpt = await staking.rewardPerToken();
      expect(rpt).to.be.gte(0);
    });

    it("claim after reward period end returns correct accrued amount", async function () {
      const fresh = await deployCore(await stakingToken.getAddress(), await rewardToken.getAddress());
      await rewardToken.connect(owner).mint(await fresh.getAddress(), ethers.parseEther("1000"));
      await stakingToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await stakingToken.connect(user1).approve(await fresh.getAddress(), ethers.parseEther("1000"));
      await fresh.connect(owner).setRewardRate(ethers.parseEther("0.001"), 7 * DAY);
      await fresh.connect(user1).stake(ethers.parseEther("500"), 1);
      await ethers.provider.send("evm_increaseTime", [8 * DAY]);
      await ethers.provider.send("evm_mine");

      const earned = await fresh.earned(user1.address);
      const expectedGross = (earned * 10000n) / 9500n;
      const balBefore = await rewardToken.balanceOf(user1.address);
      await fresh.connect(user1).claimReward();
      const received = await rewardToken.balanceOf(user1.address) - balBefore;
      expect(received).to.be.closeTo(expectedGross, expectedGross / 100n);
    });
  });
});
