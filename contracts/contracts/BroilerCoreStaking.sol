// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


/// @title BroilerCoreStaking
/// @notice Stake LP tokens (BRT/WPOL) to earn BRT rewards and XGOV points with multipliers.
/// @dev UUPS upgradeable. BRT carries a 5% transfer fee — outgoing transfers are grossed up.
contract BroilerCoreStaking is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    struct StakeSlot {
        uint256 amount;
        uint256 weightedAmount;
        uint256 lockEndTime;
        uint256 multiplier;
        uint256 stakeTime;
        bool withdrawn;
        uint256 rewardDebtSnapshotBri;
        uint256 rewardDebtSnapshotXgov;
    }

    struct UserInfo {
        StakeSlot[] stakes;
        uint256 rewardSnapshotBri;
        uint256 rewardSnapshotXgov;
        uint256 briRewardsPending;
        uint256 xgovPointsPending;
        bool isRegistered;
    }

    IERC20 public stakingToken;
    IERC20 public briToken;

    mapping(address => uint256) public accumulatedGovPoints;
    mapping(address => uint256) public referralCount;

    uint256 public briRewardRate;
    uint256 public xgovPointRate;
    uint256 public rewardFinishTime;
    uint256 public lastUpdateTime;
    uint256 public briRewardPerTokenStored;
    uint256 public xgovPointPerTokenStored;
    
    uint256 public totalRawStaked;
    uint256 public totalWeightedSupply;

    uint256 public referralPercentage;
    uint256 public constant MAX_REFERRAL_BPS = 2000;
    
    uint256 public maxBriRewardRate;
    uint256 public maxXgovPointRate;
    address public migrationSource;

    mapping(address => UserInfo) public userInfo;

    uint256 public constant LOCKDOWN_24H = 24 hours;
    uint256 public constant MULTIPLIER_6M = 14000;
    uint256 public constant MULTIPLIER_12M = 16000;
    uint256 public constant MULTIPLIER_18M = 18000;

    uint256 public constant BRI_TRANSFER_FEE_BPS = 500;
    uint256 public constant BRI_FEE_DENOMINATOR = 10000;

    event Staked(address indexed user, uint256 index, uint256 amount, uint256 weightedAmount);
    event Withdrawn(address indexed user, uint256 index, uint256 amount);
    event EarlyUnstaked(address indexed user, uint256 index, uint256 amount, uint256 rewardPenalty);
    event RewardPaid(address indexed user, uint256 briPaid, uint256 govPointsMinted);
    event EmergencyWithdrawn(address indexed user, uint256 index, uint256 amount);
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

    function initialize(address _stakingToken, address _briToken) external initializer {
        __Ownable_init(msg.sender);

        stakingToken = IERC20(_stakingToken);
        briToken = IERC20(_briToken);
        referralPercentage = 500;
        lastUpdateTime = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier updateReward(address _account) {
        briRewardPerTokenStored = rewardPerTokenBri();
        xgovPointPerTokenStored = rewardPerTokenXgovPoints();
        lastUpdateTime = lastTimeRewardApplicable();

        if (_account != address(0)) {
            UserInfo storage user = userInfo[_account];
            
            uint256 weightedBal = getUserTotalWeightedBalance(_account);

            uint256 briDelta = (weightedBal * (briRewardPerTokenStored - user.rewardSnapshotBri)) / 1e18;
            uint256 xgovDelta = (weightedBal * (xgovPointPerTokenStored - user.rewardSnapshotXgov)) / 1e18;

            user.briRewardsPending += briDelta;
            user.xgovPointsPending += xgovDelta;
            
            user.rewardSnapshotBri = briRewardPerTokenStored;
            user.rewardSnapshotXgov = xgovPointPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        if (rewardFinishTime == 0) return block.timestamp;
        return Math.min(block.timestamp, rewardFinishTime);
    }

    function rewardPerTokenBri() public view returns (uint256) {
        if (totalWeightedSupply == 0) return briRewardPerTokenStored;
        return briRewardPerTokenStored + (
            (lastTimeRewardApplicable() - lastUpdateTime) * briRewardRate * 1e18 / totalWeightedSupply
        );
    }

    function rewardPerTokenXgovPoints() public view returns (uint256) {
        if (totalWeightedSupply == 0) return xgovPointPerTokenStored;
        return xgovPointPerTokenStored + (
            (lastTimeRewardApplicable() - lastUpdateTime) * xgovPointRate * 1e18 / totalWeightedSupply
        );
    }

    function getUserTotalWeightedBalance(address _account) public view returns (uint256 weightedSum) {
        UserInfo storage user = userInfo[_account];
        for (uint256 i = 0; i < user.stakes.length; i++) {
            if (!user.stakes[i].withdrawn) {
                weightedSum += user.stakes[i].weightedAmount;
            }
        }
    }

    function _grossUp(uint256 netAmount) internal pure returns (uint256) {
        return (netAmount * BRI_FEE_DENOMINATOR) / (BRI_FEE_DENOMINATOR - BRI_TRANSFER_FEE_BPS);
    }

    function _earnedBriBase(address _account) public view returns (uint256) {
        UserInfo storage user = userInfo[_account];
        uint256 weightedBal = getUserTotalWeightedBalance(_account);
        uint256 delta = (weightedBal * (rewardPerTokenBri() - user.rewardSnapshotBri)) / 1e18;
        return user.briRewardsPending + delta;
    }

    function _earnedXgovPointsBase(address _account) public view returns (uint256) {
        UserInfo storage user = userInfo[_account];
        uint256 weightedBal = getUserTotalWeightedBalance(_account);
        uint256 delta = (weightedBal * (rewardPerTokenXgovPoints() - user.rewardSnapshotXgov)) / 1e18;
        return user.xgovPointsPending + delta;
    }

    function earnedBri(address _account) public view returns (uint256) {
        uint256 base = _earnedBriBase(_account);
        uint256 bonus = base * referralCount[_account] * referralPercentage / 10000;
        return base + bonus;
    }

    function earnedXgovPoints(address _account) public view returns (uint256) {
        uint256 base = _earnedXgovPointsBase(_account);
        uint256 bonus = base * referralCount[_account] * referralPercentage / 10000;
        return base + bonus;
    }

    function earnedBriNet(address _account) public view returns (uint256) {
        return _grossUp(earnedBri(_account));
    }

    function stake(uint256 _amount, uint8 _lockPeriod, address _referrer) external nonReentrant updateReward(msg.sender) {
        require(_amount > 0, "Zero stake payload");
        require(_lockPeriod >= 1 && _lockPeriod <= 3, "Invalid timeline selection");

        uint256 duration = _lockPeriod == 1 ? 180 days : (_lockPeriod == 2 ? 360 days : 540 days);
        uint256 mult = _lockPeriod == 1 ? MULTIPLIER_6M : (_lockPeriod == 2 ? MULTIPLIER_12M : MULTIPLIER_18M);
        uint256 weighted = (_amount * mult) / 10000;

        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        UserInfo storage user = userInfo[msg.sender];
        if (!user.isRegistered) {
            user.isRegistered = true;
            if (_referrer != address(0) && _referrer != msg.sender) {
                referralCount[_referrer]++;
            }
        }

        user.stakes.push(StakeSlot({
            amount: _amount,
            weightedAmount: weighted,
            lockEndTime: block.timestamp + duration,
            multiplier: mult,
            stakeTime: block.timestamp,
            withdrawn: false,
            rewardDebtSnapshotBri: briRewardPerTokenStored,
            rewardDebtSnapshotXgov: xgovPointPerTokenStored
        }));

        totalRawStaked += _amount;
        totalWeightedSupply += weighted;
        emit Staked(msg.sender, user.stakes.length - 1, _amount, weighted);
    }

    function withdraw(uint256 _stakeIndex) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = userInfo[msg.sender];
        require(_stakeIndex < user.stakes.length, "Invalid index");
        StakeSlot storage slot = user.stakes[_stakeIndex];
        require(!slot.withdrawn, "Already extracted");
        require(block.timestamp >= slot.lockEndTime, "Time lock active");

        slot.withdrawn = true;
        totalRawStaked -= slot.amount;
        totalWeightedSupply -= slot.weightedAmount;
        stakingToken.safeTransfer(msg.sender, slot.amount);
        emit Withdrawn(msg.sender, _stakeIndex, slot.amount);
    }

    function earlyUnstake(uint256 _stakeIndex) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = userInfo[msg.sender];
        require(_stakeIndex < user.stakes.length, "Invalid index");
        StakeSlot storage slot = user.stakes[_stakeIndex];
        require(!slot.withdrawn, "Already extracted");
        require(block.timestamp >= slot.stakeTime + LOCKDOWN_24H, "24h lock active");
        require(block.timestamp < slot.lockEndTime, "Use regular withdraw");

        uint256 slotBriReward = (slot.weightedAmount * (briRewardPerTokenStored - slot.rewardDebtSnapshotBri) / 1e18);
        uint256 slotXgovPoints = (slot.weightedAmount * (xgovPointPerTokenStored - slot.rewardDebtSnapshotXgov) / 1e18);

        if (slotBriReward > user.briRewardsPending) slotBriReward = user.briRewardsPending;
        if (slotXgovPoints > user.xgovPointsPending) slotXgovPoints = user.xgovPointsPending;

        uint256 briPenalty = slotBriReward / 2;
        uint256 xgovPenalty = slotXgovPoints / 2;
        uint256 briToSend = slotBriReward - briPenalty;

        slot.withdrawn = true;
        totalRawStaked -= slot.amount;
        totalWeightedSupply -= slot.weightedAmount;

        user.briRewardsPending -= slotBriReward;
        user.xgovPointsPending -= slotXgovPoints;

        stakingToken.safeTransfer(msg.sender, slot.amount);
        if (briToSend > 0) {
            briToken.safeTransfer(msg.sender, _grossUp(briToSend));
        }
        if (slotXgovPoints > 0) {
            accumulatedGovPoints[msg.sender] += (slotXgovPoints - xgovPenalty);
        }
        emit EarlyUnstaked(msg.sender, _stakeIndex, slot.amount, briPenalty + xgovPenalty);
    }


    function emergencyWithdraw(uint256 _stakeIndex) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(_stakeIndex < user.stakes.length, "Invalid index");
        StakeSlot storage slot = user.stakes[_stakeIndex];
        require(!slot.withdrawn, "Already extracted");

        uint256 amount = slot.amount;
        uint256 weighted = slot.weightedAmount;

        slot.withdrawn = true;
        if (totalRawStaked >= amount) totalRawStaked -= amount;
        if (totalWeightedSupply >= weighted) totalWeightedSupply -= weighted;
        
        user.briRewardsPending = 0;
        user.xgovPointsPending = 0;

        stakingToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdrawn(msg.sender, _stakeIndex, amount);
    }

    function claimRewards() external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = userInfo[msg.sender];
        uint256 briBase = user.briRewardsPending;
        uint256 govBase = user.xgovPointsPending;
        
        require(briBase > 0 || govBase > 0, "No rewards accrued");

        uint256 briBonus = briBase * referralCount[msg.sender] * referralPercentage / 10000;
        uint256 govBonus = govBase * referralCount[msg.sender] * referralPercentage / 10000;
        
        uint256 briTotal = briBase + briBonus;
        uint256 govTotal = govBase + govBonus;

        user.briRewardsPending = 0;
        user.xgovPointsPending = 0;

        if (briTotal > 0) {
            briToken.safeTransfer(msg.sender, _grossUp(briTotal));
        }
        if (govTotal > 0) {
            accumulatedGovPoints[msg.sender] += govTotal;
        }

        emit RewardPaid(msg.sender, _grossUp(briTotal), govTotal);
    }

    function setMaxBriRewardRate(uint256 _max) external onlyOwner {
        maxBriRewardRate = _max;
    }

    function setMaxXgovPointRate(uint256 _max) external onlyOwner {
        maxXgovPointRate = _max;
    }

    function setRewardRates(uint256 _briRate, uint256 _xgovRate, uint256 _duration) external onlyOwner updateReward(address(0)) {
        require(_duration > 0, "Duration must be > 0");
        require(maxBriRewardRate == 0 || _briRate <= maxBriRewardRate, "BRI Rate exceeds max");
        require(maxXgovPointRate == 0 || _xgovRate <= maxXgovPointRate, "XGOV Rate exceeds max");

        briRewardRate = _briRate;
        xgovPointRate = _xgovRate;
        rewardFinishTime = block.timestamp + _duration;
        lastUpdateTime = block.timestamp;
    }

    function fundRewards(uint256 _amount) external {
        briToken.safeTransferFrom(msg.sender, address(this), _amount);
    }

    function recoverERC20(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    // Migration Functions
    function setMigrationSource(address _source) external onlyOwner {
        migrationSource = _source;
    }

    function onMigrate(
        address _user,
        uint256 _amount,
        uint256 _lockEndTime,
        uint256 _multiplier,
        uint256 _stakeTime,
        uint256 _briDebt,
        uint256 _xgovDebt
    ) external {
        require(msg.sender == migrationSource, "Not authorized");
        require(_amount > 0, "Zero migration payload");
        uint256 weighted = (_amount * _multiplier) / 10000;

        UserInfo storage user = userInfo[_user];
        user.stakes.push(StakeSlot({
            amount: _amount,
            weightedAmount: weighted,
            lockEndTime: _lockEndTime,
            multiplier: _multiplier,
            stakeTime: _stakeTime,
            withdrawn: false,
            rewardDebtSnapshotBri: _briDebt,
            rewardDebtSnapshotXgov: _xgovDebt
        }));

        totalRawStaked += _amount;
        totalWeightedSupply += weighted;
    }

    function migrateTo(address _newContract, uint256 _stakeIndex) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = userInfo[msg.sender];
        require(_stakeIndex < user.stakes.length, "Invalid index");
        StakeSlot storage slot = user.stakes[_stakeIndex];
        require(!slot.withdrawn, "Already extracted");
        require(block.timestamp >= slot.stakeTime + LOCKDOWN_24H, "24h lock active");

        uint256 amount = slot.amount;
        uint256 weighted = slot.weightedAmount;

        slot.withdrawn = true;
        totalRawStaked -= amount;
        totalWeightedSupply -= weighted;

        stakingToken.safeTransfer(_newContract, amount);

        INewBroilerCoreStaking(_newContract).onMigrate(
            msg.sender,
            amount,
            slot.lockEndTime,
            slot.multiplier,
            slot.stakeTime,
            slot.rewardDebtSnapshotBri,
            slot.rewardDebtSnapshotXgov
        );

        emit Migrated(msg.sender, _stakeIndex, _newContract, amount);
    }

    uint256[50] private __gap;
}

interface INewBroilerCoreStaking {
    function onMigrate(
        address user,
        uint256 amount,
        uint256 lockEndTime,
        uint256 multiplier,
        uint256 stakeTime,
        uint256 briDebt,
        uint256 xgovDebt
    ) external;
}
