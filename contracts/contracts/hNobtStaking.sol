// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title hNobtStaking
/// @notice Stake hNOBT to earn BRT rewards.
/// @dev BRT (rewardToken) carries a 5% transfer fee. All outgoing
///      BRT transfers are grossed up via _grossUp() so the recipient
///      receives the full advertised reward amount.
contract hNobtStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public rewardFinishTime;
    uint256 public totalWeightedStake;

    struct StakeInfo {
        uint256 amount;
        uint256 weightedAmount;
        uint256 lockEndTime;
        uint256 lockMultiplier;
        uint256 stakeTime;
        uint256 rewardDebtSnapshotBri;
        bool withdrawn;
    }

    struct UserInfo {
        StakeInfo[] stakes;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }

    mapping(address => UserInfo) public users;

    uint256 public constant LOCK_3M = 90 days;
    uint256 public constant LOCK_6M = 180 days;
    uint256 public constant LOCK_12M = 365 days;
    uint256 public constant LOCKDOWN_24H = 24 hours;

    uint256 public constant MULT_3M = 10000;
    uint256 public constant MULT_6M = 12500;
    uint256 public constant MULT_12M = 15000;
    uint256 public constant MULT_BASE = 10000;

    uint256 public constant BRI_TRANSFER_FEE_BPS = 500; // 5% fee on BRT transfers
    uint256 public constant BRI_FEE_DENOMINATOR = 10000;

    uint256 public maxRewardRate;

    event Staked(address indexed user, uint256 index, uint256 amount, uint8 lockPeriod);
    event Withdrawn(address indexed user, uint256 index, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 rate, uint256 duration);
    event EarlyUnstaked(address indexed user, uint256 index, uint256 amount, uint256 rewardPenalty);

    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (_account != address(0)) {
            UserInfo storage user = users[_account];
            user.pendingRewards = earned(_account);
            user.rewardDebt = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < rewardFinishTime ? block.timestamp : rewardFinishTime;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalWeightedStake == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + (
            (lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18 / totalWeightedStake
        );
    }

    function userWeightedStake(address _account) public view returns (uint256) {
        UserInfo storage user = users[_account];
        uint256 total;
        for (uint256 i = 0; i < user.stakes.length; i++) {
            if (!user.stakes[i].withdrawn) {
                total += user.stakes[i].weightedAmount;
            }
        }
        return total;
    }

    /// @notice Gross up an amount to account for the 5% BRT transfer fee.
    /// @dev Sending `_grossUp(net)` results in the recipient receiving exactly `net`
    ///      after the token contract deducts its 5% fee.
    function _grossUp(uint256 netAmount) internal pure returns (uint256) {
        return (netAmount * BRI_FEE_DENOMINATOR) / (BRI_FEE_DENOMINATOR - BRI_TRANSFER_FEE_BPS);
    }

    function earned(address _account) public view returns (uint256) {
        UserInfo storage user = users[_account];
        uint256 weighted = userWeightedStake(_account);
        return (weighted * (rewardPerToken() - user.rewardDebt) / 1e18) + user.pendingRewards;
    }

    /// @notice Returns the net BRT reward the user will actually receive,
    ///         accounting for the 5% transfer fee on BRT transfers.
    function earnedNet(address _account) public view returns (uint256) {
        return _grossUp(earned(_account));
    }

    function stake(uint256 _amount, uint8 _lockPeriod) external nonReentrant updateReward(msg.sender) {
        require(_amount > 0, "Amount must be > 0");
        require(_lockPeriod >= 1 && _lockPeriod <= 3, "Invalid lock period");

        uint256 duration;
        uint256 multiplier;

        if (_lockPeriod == 1) {
            duration = LOCK_3M;
            multiplier = MULT_3M;
        } else if (_lockPeriod == 2) {
            duration = LOCK_6M;
            multiplier = MULT_6M;
        } else {
            duration = LOCK_12M;
            multiplier = MULT_12M;
        }

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 weighted = _amount * multiplier / MULT_BASE;

        UserInfo storage user = users[msg.sender];
        user.stakes.push(StakeInfo({
            amount: _amount,
            weightedAmount: weighted,
            lockEndTime: block.timestamp + duration,
            lockMultiplier: multiplier,
            stakeTime: block.timestamp,
            rewardDebtSnapshotBri: rewardPerTokenStored,
            withdrawn: false
        }));

        totalWeightedStake += weighted;

        emit Staked(msg.sender, user.stakes.length - 1, _amount, _lockPeriod);
    }

    function withdraw(uint256 _index) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = users[msg.sender];
        require(_index < user.stakes.length, "Invalid index");
        StakeInfo storage info = user.stakes[_index];
        require(!info.withdrawn, "Already withdrawn");
        require(block.timestamp >= info.lockEndTime, "Lock not expired");

        info.withdrawn = true;
        totalWeightedStake -= info.weightedAmount;

        stakingToken.safeTransfer(msg.sender, info.amount);

        emit Withdrawn(msg.sender, _index, info.amount);
    }

    function earlyUnstake(uint256 _index) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = users[msg.sender];
        require(_index < user.stakes.length, "Invalid index");
        StakeInfo storage info = user.stakes[_index];
        require(!info.withdrawn, "Already withdrawn");
        require(info.lockEndTime > 0, "Invalid stake");
        require(block.timestamp >= info.stakeTime + LOCKDOWN_24H, "24h lockdown not passed");
        require(block.timestamp < info.lockEndTime, "Lock expired, use withdraw");

        uint256 currentRewardPerToken = rewardPerTokenStored;
        uint256 stakeReward = (info.weightedAmount * (currentRewardPerToken - info.rewardDebtSnapshotBri) / 1e18);

        uint256 penalty = stakeReward / 2;
        uint256 rewardToSend = stakeReward - penalty;

        info.withdrawn = true;
        totalWeightedStake -= info.weightedAmount;
        user.rewardDebt = currentRewardPerToken;

        if (user.pendingRewards > stakeReward) {
            user.pendingRewards -= stakeReward;
        } else {
            user.pendingRewards = 0;
        }

        stakingToken.safeTransfer(msg.sender, info.amount);
        if (rewardToSend > 0) {
            rewardToken.safeTransfer(msg.sender, _grossUp(rewardToSend));
        }

        emit EarlyUnstaked(msg.sender, _index, info.amount, penalty);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = users[msg.sender];
        uint256 amount = user.pendingRewards;
        require(amount > 0, "No rewards");

        user.pendingRewards = 0;
        rewardToken.safeTransfer(msg.sender, _grossUp(amount));

        emit RewardClaimed(msg.sender, _grossUp(amount));
    }

    function setMaxRewardRate(uint256 _max) external onlyOwner {
        maxRewardRate = _max;
    }

    function setRewardRate(uint256 _rate, uint256 _duration) external onlyOwner updateReward(address(0)) {
        require(_duration > 0, "Duration must be > 0");
        require(maxRewardRate == 0 || _rate <= maxRewardRate, "Rate exceeds max");
        rewardRate = _rate;
        rewardFinishTime = block.timestamp + _duration;
        lastUpdateTime = block.timestamp;
        emit RewardRateUpdated(_rate, _duration);
    }

    function fundRewards(uint256 _amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
    }

    function recoverERC20(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(stakingToken), "Cannot recover staking token");
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
