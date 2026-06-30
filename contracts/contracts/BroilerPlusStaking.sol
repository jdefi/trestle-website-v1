// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BroilerPlusStaking
/// @notice Stake hNOBT to earn BRT rewards + governance points.
/// @dev BRT (briToken) carries a 5% transfer fee built into the token
///      contract. All outgoing BRT transfers are grossed up via
///      _grossUp() so the recipient receives the full advertised amount.
contract BroilerPlusStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakeSlot {
        uint256 amount;
        uint256 weightedAmount;
        uint256 lockEndTime;
        uint256 multiplier;
        uint256 stakeTime;
        uint256 briRewardDebtSnapshot;
        uint256 xgovPointsDebtSnapshot;
        bool withdrawn;
    }

    struct UserInfo {
        StakeSlot[] stakes;
        uint256 rewardSnapshotBri;
        uint256 rewardSnapshotXgov;
        uint256 briRewardsPending;
        uint256 xgovPointsPending;
        bool isRegistered;
    }

    IERC20 public immutable stakingToken;
    IERC20 public immutable briToken;

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
    uint256 public referralPercentage = 500;
    uint256 public constant MAX_REFERRAL_BPS = 2000; // max 20%

    uint256 public maxBriRewardRate;
    uint256 public maxXgovPointRate;

    mapping(address => UserInfo) public userInfo;

    uint256 public constant LOCKDOWN_24H = 24 hours;
    uint256 public constant MULTIPLIER_6M = 14000;
    uint256 public constant MULTIPLIER_12M = 16000;
    uint256 public constant MULTIPLIER_18M = 18000;

    uint256 public constant BRI_TRANSFER_FEE_BPS = 500; // 5% fee on BRT transfers
    uint256 public constant BRI_FEE_DENOMINATOR = 10000;

    event Staked(address indexed user, uint256 index, uint256 amount, uint256 weightedAmount);
    event Withdrawn(address indexed user, uint256 index, uint256 amount);
    event EarlyUnstaked(address indexed user, uint256 index, uint256 amount, uint256 rewardPenalty);

    event RewardPaid(address indexed user, uint256 briPaid, uint256 govPointsMinted);

    constructor(address _stakingToken, address _briToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        briToken = IERC20(_briToken);
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address _account) {
        briRewardPerTokenStored = rewardPerTokenBri();
        xgovPointPerTokenStored = rewardPerTokenXgovPoints();
        lastUpdateTime = lastTimeRewardApplicable();

        if (_account != address(0)) {
            UserInfo storage user = userInfo[_account];
            user.briRewardsPending = _earnedBriBase(_account);
            user.xgovPointsPending = _earnedXgovPointsBase(_account);
            user.rewardSnapshotBri = briRewardPerTokenStored;
            user.rewardSnapshotXgov = xgovPointPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
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

    /// @notice Gross up an amount to account for the 5% BRT transfer fee.
    /// @dev Sending `_grossUp(net)` results in the recipient receiving exactly `net`
    ///      after the token contract deducts its 5% fee.
    function _grossUp(uint256 netAmount) internal pure returns (uint256) {
        return (netAmount * BRI_FEE_DENOMINATOR) / (BRI_FEE_DENOMINATOR - BRI_TRANSFER_FEE_BPS);
    }

    function _earnedBriBase(address _account) public view returns (uint256) {
        UserInfo storage user = userInfo[_account];
        uint256 weightedBal = getUserTotalWeightedBalance(_account);
        return (weightedBal * (rewardPerTokenBri() - user.rewardSnapshotBri) / 1e18) + user.briRewardsPending;
    }

    function _earnedXgovPointsBase(address _account) public view returns (uint256) {
        UserInfo storage user = userInfo[_account];
        uint256 weightedBal = getUserTotalWeightedBalance(_account);
        return (weightedBal * (rewardPerTokenXgovPoints() - user.rewardSnapshotXgov) / 1e18) + user.xgovPointsPending;
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

    /// @notice Returns the net BRT reward the user will actually receive,
    ///         accounting for the 5% transfer fee on BRT transfers.
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
            briRewardDebtSnapshot: briRewardPerTokenStored,
            xgovPointsDebtSnapshot: xgovPointPerTokenStored,
            withdrawn: false
        }));

        totalRawStaked += _amount;
        totalWeightedSupply += weighted;

        emit Staked(msg.sender, user.stakes.length - 1, _amount, weighted);
    }

    function withdraw(uint256 _stakeIndex) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = userInfo[msg.sender];
        require(_stakeIndex < user.stakes.length, "Invalid index targeted");
        StakeSlot storage slot = user.stakes[_stakeIndex];
        require(!slot.withdrawn, "Funds previously extracted");
        require(block.timestamp >= slot.lockEndTime, "Time lock structural freeze active");

        slot.withdrawn = true;
        totalRawStaked -= slot.amount;
        totalWeightedSupply -= slot.weightedAmount;

        stakingToken.safeTransfer(msg.sender, slot.amount);
        emit Withdrawn(msg.sender, _stakeIndex, slot.amount);
    }

    function earlyUnstake(uint256 _stakeIndex) external nonReentrant updateReward(msg.sender) {
        UserInfo storage user = userInfo[msg.sender];
        require(_stakeIndex < user.stakes.length, "Invalid index targeted");
        StakeSlot storage slot = user.stakes[_stakeIndex];
        require(!slot.withdrawn, "Funds previously extracted");
        require(slot.lockEndTime > 0, "Invalid stake");
        require(block.timestamp >= slot.stakeTime + LOCKDOWN_24H, "24h lockdown not passed");
        require(block.timestamp < slot.lockEndTime, "Lock expired, use withdraw");

        uint256 briStakeReward = (slot.weightedAmount * (briRewardPerTokenStored - slot.briRewardDebtSnapshot) / 1e18);
        uint256 xgovStakePoints = (slot.weightedAmount * (xgovPointPerTokenStored - slot.xgovPointsDebtSnapshot) / 1e18);

        uint256 briPenalty = briStakeReward / 2;
        uint256 xgovPenalty = xgovStakePoints / 2;
        uint256 briToSend = briStakeReward - briPenalty;

        slot.withdrawn = true;
        totalRawStaked -= slot.amount;
        totalWeightedSupply -= slot.weightedAmount;

        if (user.briRewardsPending > briStakeReward) {
            user.briRewardsPending -= briStakeReward;
        } else {
            user.briRewardsPending = 0;
        }
        if (user.xgovPointsPending > xgovStakePoints) {
            user.xgovPointsPending -= xgovStakePoints;
        } else {
            user.xgovPointsPending = 0;
        }

        stakingToken.safeTransfer(msg.sender, slot.amount);
        if (briToSend > 0) {
            briToken.safeTransfer(msg.sender, _grossUp(briToSend));
        }
        if (xgovStakePoints > 0) {
            accumulatedGovPoints[msg.sender] += (xgovStakePoints - xgovPenalty);
        }

        emit EarlyUnstaked(msg.sender, _stakeIndex, slot.amount, briPenalty + xgovPenalty);
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

    function setReferralPercentage(uint256 _bps) external onlyOwner {
        require(_bps <= MAX_REFERRAL_BPS, "Referral too high");
        referralPercentage = _bps;
    }

    function setMaxRates(uint256 _maxBri, uint256 _maxXgov) external onlyOwner {
        maxBriRewardRate = _maxBri;
        maxXgovPointRate = _maxXgov;
    }

    function setRewardRate(uint256 _briRate, uint256 _pointsRate, uint256 _duration) external onlyOwner updateReward(address(0)) {
        require(_duration > 0, "Duration must be > 0");
        require(maxBriRewardRate == 0 || _briRate <= maxBriRewardRate, "BRI rate exceeds max");
        require(maxXgovPointRate == 0 || _pointsRate <= maxXgovPointRate, "xGov rate exceeds max");
        briRewardRate = _briRate;
        xgovPointRate = _pointsRate;
        rewardFinishTime = block.timestamp + _duration;
        lastUpdateTime = block.timestamp;
    }

    function fundRewards(uint256 _amount) external {
        briToken.safeTransferFrom(msg.sender, address(this), _amount);
    }

    function recoverERC20(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(stakingToken), "Cannot recover staking token");
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
