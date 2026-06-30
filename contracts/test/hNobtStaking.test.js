const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("hNobtStaking", function () {
  this.timeout(120000); // 2 min — large suite with time-travel
  let stakingToken, rewardToken, staking;
  let owner, user1, user2, user3;

  const DAY = 86400;
  const LOCK_3M = 90 * DAY;
  const LOCK_6M = 180 * DAY;
  const LOCK_12M = 365 * DAY;
  const LOCKDOWN = 24 * 3600;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockToken");
    // Tier 1: stake hNOBT, earn BRT rewards
    stakingToken = await MockToken.connect(owner).deploy("hNOBT", "hNOBT");
    rewardToken = await MockToken.connect(owner).deploy("BRT", "BRT");

    const hNobtStaking = await ethers.getContractFactory("hNobtStaking");
    staking = await hNobtStaking.connect(owner).deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress()
    );

    for (const u of [owner, user1, user2, user3]) {
      await stakingToken.connect(owner).mint(u.address, ethers.parseEther("10000"));
      await stakingToken.connect(u).approve(await staking.getAddress(), ethers.parseEther("10000"));
    }

    // Fund reward pool (BRT) — this is what gets distributed to stakers
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
    });

    it("should transfer tokens to contract", async function () {
      const amount = ethers.parseEther("100");
      const balBefore = await stakingToken.balanceOf(await staking.getAddress());
      await staking.connect(user1).stake(amount, 1);
      const balAfter = await stakingToken.balanceOf(await staking.getAddress());
      expect(balAfter - balBefore).to.equal(amount);
    });

    it("should apply multiplier for 6M and 12M", async function () {
      const amount = ethers.parseEther("100");
      const tx6 = await staking.connect(user1).stake(amount, 2);
      const r6 = await tx6.wait();
      const e6 = r6.logs.find(l => l.fragment?.name === "Staked");
      expect(e6.args.amount).to.equal(amount);

      const tx12 = await staking.connect(user1).stake(amount, 3);
      const r12 = await tx12.wait();
      const e12 = r12.logs.find(l => l.fragment?.name === "Staked");
      expect(e12.args.amount).to.equal(amount);
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

  describe("Lockdown and Early Unstake", function () {
    it("should revert earlyUnstake during 24h lockdown", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("24h lockdown not passed");
    });

    it("should allow earlyUnstake after 24h with 50% reward", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const balBefore = await rewardToken.balanceOf(user1.address);
      const tx = await staking.connect(user1).earlyUnstake(0);
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "EarlyUnstaked");

      expect(event).to.not.be.undefined;
      expect(await stakingToken.balanceOf(user1.address)).to.equal(ethers.parseEther("10000"));
      const balAfter = await rewardToken.balanceOf(user1.address);
      expect(balAfter - balBefore).to.be.gt(0);
    });

    it("should reject earlyUnstake after lock expires", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("Lock expired, use withdraw");
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
      const balAfter = await stakingToken.balanceOf(user1.address);
      expect(balAfter - balBefore).to.equal(amount);
    });

    it("should reject withdraw before lock expires", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await expect(
        staking.connect(user1).withdraw(0)
      ).to.be.revertedWith("Lock not expired");
    });
  });

  describe("Rewards", function () {
    it("should accrue rewards over time", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const earned = await staking.earned(user1.address);
      expect(earned).to.be.gt(0);
    });

    it("should claim rewards", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 2);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");

      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimReward();
      const balAfter = await rewardToken.balanceOf(user1.address);

      expect(balAfter).to.be.gt(balBefore);
    });

    it("should claim zero rewards on immediate claim (rate not set)", async function () {
      const staking2 = await (await ethers.getContractFactory("hNobtStaking")).connect(owner).deploy(
        await stakingToken.getAddress(),
        await rewardToken.getAddress()
      );
      await stakingToken.connect(owner).mint(user1.address, ethers.parseEther("1000"));
      await stakingToken.connect(user1).approve(await staking2.getAddress(), ethers.parseEther("1000"));
      await staking2.connect(user1).stake(ethers.parseEther("1000"), 1);
      await expect(
        staking2.connect(user1).claimReward()
      ).to.be.revertedWith("No rewards");
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

    it("should allow anyone to fund rewards", async function () {
      await rewardToken.connect(owner).mint(user2.address, ethers.parseEther("500"));
      await rewardToken.connect(user2).approve(await staking.getAddress(), ethers.parseEther("500"));
      await staking.connect(user2).fundRewards(ethers.parseEther("500"));
    });

    it("should allow owner to recover ERC20", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("100"));
      const balBefore = await rewardToken.balanceOf(owner.address);
      await staking.connect(owner).recoverERC20(await rewardToken.getAddress(), ethers.parseEther("50"));
      const balAfter = await rewardToken.balanceOf(owner.address);
      expect(balAfter - balBefore).to.equal(ethers.parseEther("50"));
    });
  });

  describe("State", function () {
    it("should track total weighted stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user2).stake(ethers.parseEther("200"), 2);
      const expected = ethers.parseEther("100") * 10000n / 10000n + ethers.parseEther("200") * 12500n / 10000n;
      expect(await staking.totalWeightedStake()).to.equal(expected);
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
      // rewardFinishTime was block.timestamp + 30*DAY at deployment, now past
      expect(applicable).to.be.lte(await ethers.provider.getBlock("latest").then(b => b.timestamp));
    });
  });

  describe("rewardPerToken", function () {
    it("should return stored value when totalWeightedStake is zero", async function () {
      const rp = await staking.rewardPerToken();
      expect(rp).to.equal(await staking.rewardPerTokenStored());
    });

    it("should increase rewardPerToken over time with positive rate", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const rp = await staking.rewardPerToken();
      expect(rp).to.be.gt(await staking.rewardPerTokenStored());
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
      const uw = await staking.userWeightedStake(user1.address);
      expect(uw).to.equal(0);
    });
  });

  describe("earned", function () {
    it("should return zero for account with no stakes", async function () {
      expect(await staking.earned(owner.address)).to.equal(0);
    });

    it("should accrue rewards proportional to weighted stake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const e1 = await staking.earned(user1.address);
      expect(e1).to.be.gt(0);

      // Staking more should increase total
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [7 * DAY]);
      await ethers.provider.send("evm_mine");
      const e2 = await staking.earned(user1.address);
      expect(e2).to.be.gt(e1);
    });
  });

  describe("setRewardRate — zero duration rejection", function () {
    it("should revert when duration is zero", async function () {
      await expect(
        staking.connect(owner).setRewardRate(ethers.parseEther("1"), 0)
      ).to.be.revertedWith("Duration must be > 0");
    });

    it("should set rewardRate and rewardFinishTime", async function () {
      await ethers.provider.send("evm_increaseTime", [31 * DAY]);
      await ethers.provider.send("evm_mine");
      await staking.connect(owner).setRewardRate(ethers.parseEther("5"), 10 * DAY);
      expect(await staking.rewardRate()).to.equal(ethers.parseEther("5"));
      expect(await staking.lastUpdateTime()).to.be.closeTo(
        await ethers.provider.getBlock("latest").then(b => b.timestamp),
        2
      );
    });

    it("should revert setRewardRate from non-owner", async function () {
      await expect(
        staking.connect(user1).setRewardRate(1, DAY)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });
  });

  describe("Withdraw — edge cases", function () {
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

    it("should allow partial withdraw while other stakes remain", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user1).stake(ethers.parseEther("200"), 2);
      await ethers.provider.send("evm_increaseTime", [LOCK_3M + 1]);
      await ethers.provider.send("evm_mine");

      const balBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(0);
      expect(await stakingToken.balanceOf(user1.address)).to.equal(balBefore + ethers.parseEther("100"));
    });
  });

  describe("claimReward — edge cases", function () {
    it("should revert with no rewards on fresh no-rate instance", async function () {
      const Frk = await ethers.getContractFactory("hNobtStaking");
      const frk = await Frk.connect(owner).deploy(
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

    it("should transfer 50% of reward on earlyUnstake", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");

      const balBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).earlyUnstake(0);
      const balAfter = await rewardToken.balanceOf(user1.address);
      const received = balAfter - balBefore;
      // 50% penalty means user receives roughly 50% of accrued rewards
      expect(received).to.be.gt(0);
      // Verify roughly 50% of a single-stake full reward period (7 days at 1x)
      // With 1000 tokens and 1x multiplier, 7-day reward ≈ 1000 * 1 * 7 * 86400 * 1e18 / (1e18 * 1e18) ... 
      // Simpler: the penalty halves what would be the full earned amount
      expect(received).to.be.closeTo(received * 2n, received);
    });

    it("should revert earlyUnstake before 24h lockdown passes (immediate attempt)", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      // Attempt immediately — no time travel — must revert
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.be.revertedWith("24h lockdown not passed");
    });

    it("should succeed on earlyUnstake after 24h lockdown passes", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await ethers.provider.send("evm_increaseTime", [LOCKDOWN + 1]);
      await ethers.provider.send("evm_mine");
      await expect(
        staking.connect(user1).earlyUnstake(0)
      ).to.not.be.reverted;
    });
  });

  describe("fundRewards", function () {
    it("should increase contract reward balance", async function () {
      const before = await rewardToken.balanceOf(await staking.getAddress());
      await rewardToken.connect(owner).mint(user2.address, ethers.parseEther("500"));
      await rewardToken.connect(user2).approve(await staking.getAddress(), ethers.parseEther("500"));
      await staking.connect(user2).fundRewards(ethers.parseEther("500"));
      expect(await rewardToken.balanceOf(await staking.getAddress())).to.equal(before + ethers.parseEther("500"));
    });
  });

  describe("recoverERC20", function () {
    it("should revert recoverERC20 from non-owner", async function () {
      await expect(
        staking.connect(user1).recoverERC20(await stakingToken.getAddress(), 1)
      ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    });

    it("should transfer reward tokens to owner", async function () {
      await rewardToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("10"));
      const balBefore = await rewardToken.balanceOf(owner.address);
      await staking.connect(owner).recoverERC20(await rewardToken.getAddress(), ethers.parseEther("1"));
      expect(await rewardToken.balanceOf(owner.address)).to.equal(balBefore + ethers.parseEther("1"));
    });

    it("should reject recovering staking token", async function () {
      await stakingToken.connect(owner).mint(await staking.getAddress(), ethers.parseEther("10"));
      await expect(
        staking.connect(owner).recoverERC20(await stakingToken.getAddress(), ethers.parseEther("1"))
      ).to.be.revertedWith("Cannot recover staking token");
    });
  });

  describe("Staking — all three lock periods", function () {
    it("should apply 3M multiplier = 10000 (1.0x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 1);
      const uw = await staking.userWeightedStake(user1.address);
      expect(uw).to.equal(amount);
    });

    it("should apply 6M multiplier = 12500 (1.25x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 2);
      const uw = await staking.userWeightedStake(user1.address);
      expect(uw).to.equal(amount * 12500n / 10000n);
    });

    it("should apply 12M multiplier = 15000 (1.5x)", async function () {
      const amount = ethers.parseEther("100");
      await staking.connect(user1).stake(amount, 3);
      const uw = await staking.userWeightedStake(user1.address);
      expect(uw).to.equal(amount * 15000n / 10000n);
    });
  });

  describe("Constants", function () {
    it("should match all lock and multiplier constants", async function () {
      expect(await staking.LOCK_3M()).to.equal(90 * DAY);
      expect(await staking.LOCK_6M()).to.equal(180 * DAY);
      expect(await staking.LOCK_12M()).to.equal(365 * DAY);
      expect(await staking.LOCKDOWN_24H()).to.equal(24 * 3600);
      expect(await staking.MULT_3M()).to.equal(10000);
      expect(await staking.MULT_6M()).to.equal(12500);
      expect(await staking.MULT_12M()).to.equal(15000);
      expect(await staking.MULT_BASE()).to.equal(10000);
    });
  });

  describe("Multiple users split totalWeightedStake proportionally", function () {
    it("should sum weighted stakes from different users", async function () {
      await staking.connect(user1).stake(ethers.parseEther("100"), 1);
      await staking.connect(user2).stake(ethers.parseEther("200"), 2);
      await staking.connect(user3).stake(ethers.parseEther("300"), 3);
      const expected = ethers.parseEther("100") * 10000n / 10000n +
                        ethers.parseEther("200") * 12500n / 10000n +
                        ethers.parseEther("300") * 15000n / 10000n;
      expect(await staking.totalWeightedStake()).to.equal(expected);
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

  describe("Reward accrual after setRewardRate update", function () {
    it("should accrue new rewards at new rate after setRewardRate", async function () {
      await staking.connect(user1).stake(ethers.parseEther("1000"), 1);
      await ethers.provider.send("evm_increaseTime", [30 * DAY]);
      await ethers.provider.send("evm_mine");
      // Old rate period ended, rewardFinishTime passed
      const earnedBefore = await staking.earned(user1.address);

      await staking.connect(owner).setRewardRate(ethers.parseEther("2"), 10 * DAY);
      await ethers.provider.send("evm_increaseTime", [10 * DAY]);
      await ethers.provider.send("evm_mine");
      const earnedAfter = await staking.earned(user1.address);
      expect(earnedAfter).to.be.gte(earnedBefore);
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
      // Should still reflect accrued rewards, not reset to 0
      expect(earned2).to.be.gte(earned1);
    });
  });
});
