// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title hNobtCoreStaking
/// @notice Stake hNOBT to earn BRT rewards with lock-up multipliers.
/// @dev UUPS upgradeable. BRT carries a 5% transfer fee — outgoing transfers are grossed up.
contract hNobtCoreStaking is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;
    
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
        bool withdrawn;
        uint256 rewardDebtSnapshotBri;
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

    uint256 public constant BRI_TRANSFER_FEE_BPS = 500;
    uint256 public constant BRI_FEE_DENOMINATOR = 10000;

    uint256 public maxRewardRate;

    address public migrationSource;

    event Staked(address indexed user, uint256 index, uint256 amount, uint8 lockPeriod);
    event Withdrawn(address indexed user, uint256 index, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event EarlyUnstaked(address indexed user, uint256 index, uint256 amount, uint256 rewardPenalty);
    event EmergencyWithdrawn(address indexed user, uint256 index, uint256 amount);
    event RewardRateUpdated(uint256 rate, uint256 duration);
    event Migrated(address indexed user, uint256 indexed index, address indexed newContract, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    uint256 private _status; // ReentrancyGuard: 0 = not entered, 1 = entered

    modifier nonReentrant() {
        require(_status != 1, "ReentrancyGuard: reentrant call");
        _status = 1;
        _;
        _status = 0;
    }

    function initialize(address _stakingToken, address _rewardToken) external initializer {
        __Ownable_init(msg.sender);

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        lastUpdateTime = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        if (_account != address(0)) {
            UserInfo storage user = users[_account];
            uint256 currentWeighted = userWeightedStake(_account);
            uint256 newRewards = (currentWeighted * (rewardPerTokenStored - user.rewardDebt)) / 1e18;
            user.pendingRewards += newRewards;
            user.rewardDebt = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        if (rewardFinishTime == 0) return block.timestamp;
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

    function _grossUp(uint256 netAmount) internal pure returns (uint256) {
        return (netAmount * BRI_FEE_DENOMINATOR) / (BRI_FEE_DENOMINATOR - BRI_TRANSFER_FEE_BPS);
    }

    function earned(address _account) public view returns (uint256) {
        UserInfo storage user = users[_account];
        uint256 currentWeighted = userWeightedStake(_account);
        uint256 delta = (currentWeighted * (rewardPerToken() - user.rewardDebt)) / 1e18;
        return user.pendingRewards + delta;
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
        uint256 weighted = (_amount * multiplier) / MULT_BASE;

        UserInfo storage user = users[msg.sender];
        user.stakes.push(StakeInfo({
            amount: _amount,
            weightedAmount: weighted,
            lockEndTime: block.timestamp + duration,
            lockMultiplier: multiplier,
            stakeTime: block.timestamp,
            withdrawn: false,
            rewardDebtSnapshotBri: rewardPerTokenStored
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
        require(block.timestamp >= info.stakeTime + LOCKDOWN_24H, "24h lock active");
        require(block.timestamp < info.lockEndTime, "Use regular withdraw");

        uint256 stakeReward = (info.weightedAmount * (rewardPerTokenStored - info.rewardDebtSnapshotBri) / 1e18);
        if (stakeReward > user.pendingRewards) {
            stakeReward = user.pendingRewards;
        }

        uint256 penalty = stakeReward / 2;
        uint256 rewardToSend = stakeReward - penalty;

        user.pendingRewards -= stakeReward;
        info.withdrawn = true;
        totalWeightedStake -= info.weightedAmount;

        stakingToken.safeTransfer(msg.sender, info.amount);
        if (rewardToSend > 0) {
            rewardToken.safeTransfer(msg.sender, _grossUp(rewardToSend));
        }

        emit EarlyUnstaked(msg.sender, _index, info.amount, penalty);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = users[msg.sender];
        require(user.pendingRewards > 0, "No rewards");
        uint256 amount = user.pendingRewards;
        user.pendingRewards = 0;
        rewardToken.safeTransfer(msg.sender, _grossUp(amount));
        emit RewardClaimed(msg.sender, amount);
    }

    function emergencyWithdraw(uint256 _index) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = users[msg.sender];
        require(_index < user.stakes.length, "Invalid index");
        StakeInfo storage info = user.stakes[_index];
        require(!info.withdrawn, "Already withdrawn");

        info.withdrawn = true;
        totalWeightedStake -= info.weightedAmount;
        stakingToken.safeTransfer(msg.sender, info.amount);
        user.pendingRewards = 0;
        emit EmergencyWithdrawn(msg.sender, _index, info.amount);
    }

    function setMaxRewardRate(uint256 _max) external onlyOwner {
        maxRewardRate = _max;
    }

    function setRewardRate(uint256 _rate, uint256 _duration) external onlyOwner updateReward(address(0)) {
        require(_duration > 0, "Duration must be positive");
        require(maxRewardRate == 0 || _rate <= maxRewardRate, "Rate exceeds max");
        rewardRate = _rate;
        rewardFinishTime = block.timestamp + _duration;
        emit RewardRateUpdated(_rate, _duration);
    }

    function migrateStakes(address _user, uint256 _lockEndTime, uint256 _weightedAmount) external onlyOwner {
        UserInfo storage user = users[_user];
        
        for (uint256 i = 0; i < user.stakes.length; i++) {
            StakeInfo storage existing = user.stakes[i];
            if (existing.lockEndTime == _lockEndTime && existing.weightedAmount == _weightedAmount) {
                revert("Stake already exists");
            }
        }
        
        user.stakes.push(StakeInfo({
            amount: 0,
            weightedAmount: _weightedAmount,
            lockEndTime: _lockEndTime,
            lockMultiplier: 0,
            stakeTime: 0,
            withdrawn: false,
            rewardDebtSnapshotBri: rewardPerTokenStored
        }));
        totalWeightedStake += _weightedAmount;
    }

    function setMigrationSource(address _source) external onlyOwner {
        migrationSource = _source;
    }

    function onMigrate(
        address _user,
        uint256 _amount,
        uint256 _lockEndTime,
        uint256 _lockMultiplier,
        uint256 _stakeTime,
        uint256 _rewardDebtSnapshot
    ) external {
        require(msg.sender == migrationSource, "Not authorized");

        uint256 weighted = (_amount * _lockMultiplier) / MULT_BASE;

        users[_user].stakes.push(StakeInfo({
            amount: _amount,
            weightedAmount: weighted,
            lockEndTime: _lockEndTime,
            lockMultiplier: _lockMultiplier,
            stakeTime: _stakeTime,
            rewardDebtSnapshotBri: _rewardDebtSnapshot,
            withdrawn: false
        }));

        totalWeightedStake += weighted;
    }

    function migrateTo(address _newContract, uint256 _index) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = users[msg.sender];
        require(_index < user.stakes.length, "Invalid index");
        StakeInfo storage slot = user.stakes[_index];
        require(!slot.withdrawn, "Already withdrawn");
        require(block.timestamp >= slot.stakeTime + LOCKDOWN_24H, "24h lockdown not passed");

        uint256 amount = slot.amount;
        uint256 weighted = slot.weightedAmount;

        slot.withdrawn = true;
        totalWeightedStake -= weighted;

        stakingToken.safeTransfer(_newContract, amount);

        INewHnobtCoreStaking(_newContract).onMigrate(
            msg.sender,
            amount,
            slot.lockEndTime,
            slot.lockMultiplier,
            slot.stakeTime,
            slot.rewardDebtSnapshotBri
        );

        emit Migrated(msg.sender, _index, _newContract, amount);
    }

    uint256[50] private __gap;
}

interface INewHnobtCoreStaking {
    function onMigrate(
        address user,
        uint256 amount,
        uint256 lockEndTime,
        uint256 lockMultiplier,
        uint256 stakeTime,
        uint256 rewardDebtSnapshot
    ) external;
}
