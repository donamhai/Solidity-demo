// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '../interfaces/IStakingTokenContract.sol';

contract StakingTokenContract is Ownable, IStakingTokenContract {
  using Counters for Counters.Counter;
  Counters.Counter private _stakeOrderIdCount;
  ERC20 token;

  //90 days staking (default 0.25% daily i.e. 22.5% APY in 90 days)
  uint256 private dailyAPY90 = 25;
  uint32 constant periodStaking = 90;
  uint32 private timeCooldown = 10;
  address private recipient;
  mapping(address => uint256) private totalStakesOfAddress;
  mapping(address => mapping(uint256 => uint256)) private indexOfStakeOrderId;
  mapping(address => mapping(uint256 => uint256)) private stakeOrderIdOfIndex;
  mapping(uint256 => Stake) private stakeOfOrderId;

  struct Stake {
    address accountStaking;
    uint256 stakedAmount;
    uint256 ratioStaking;
    uint32 startDateStaking;
    uint32 startDateReward;
    uint32 endDateStaking;
    uint32 readyTime;
  }

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier CheckAmount(uint256 _amount) {
    require(_amount > 0, 'Amount must be greater than 0');
    _;
  }

  modifier CheckStakeOrder(uint256 _stakeOrderId) {
    require(_stakeOrderId > 0, 'StakeOrder must be greater than 0');
    _;
  }

  constructor(address tokenStake, address _recipient) CheckAddress(tokenStake) CheckAddress(_recipient) {
    require(Address.isContract(tokenStake), 'You must input contract address');
    token = ERC20(tokenStake);
    recipient = _recipient;
  }

  function getDailyAPY90() external view override returns (uint256) {
    return dailyAPY90;
  }

  function getPeriodStaking() external pure override returns (uint32) {
    return periodStaking;
  }

  function getTimeCooldown() external view override returns (uint32) {
    return timeCooldown;
  }

  function getRecipientAddress() external view override returns (address) {
    return recipient;
  }

  function getBalanceOfRecipient() public view override returns (uint256) {
    return token.balanceOf(recipient);
  }

  function getTotalStakesOFAddress(address stakeHolder) external view returns (uint256) {
    return totalStakesOfAddress[stakeHolder];
  }

  function getStakeOfOrderId(uint256 stakeId) external view returns (Stake memory) {
    return stakeOfOrderId[stakeId];
  }

  function getStakeOfBalance(address _stakeholder) public view returns (uint256) {
    uint256 stakeOfAddress;
    uint256 arrayLength = totalStakesOfAddress[_stakeholder];
    for (uint256 i = 1; i <= arrayLength; i++) {
      uint256 stakeAmount_ = stakeOfOrderId[stakeOrderIdOfIndex[_stakeholder][i]].stakedAmount;
      stakeOfAddress = stakeOfAddress + stakeAmount_;
    }
    return stakeOfAddress;
  }

  function setDailyAPY90(uint256 _value) external override onlyOwner {
    require(_value > 0, 'APY value has to be more than 0, try 30 for (0.3% daily) instead');
    dailyAPY90 = _value;
  }

  function setRecipientAddress(address _recipient) external override CheckAddress(_recipient) onlyOwner {
    recipient = _recipient;
  }

  function setCooldownTime(uint32 _newCooldown) external override onlyOwner {
    require(_newCooldown > 0, 'Please input new cooldown time > 0');
    timeCooldown = _newCooldown;
  }

  function createStake90Days(uint256 _stakeAmount) external override CheckAmount(_stakeAmount) {
    require(token.balanceOf(msg.sender) >= _stakeAmount, 'You are not enough token to stake');
    _stakeOrderIdCount.increment();
    uint256 _stakeOrderId = _stakeOrderIdCount.current();
    totalStakesOfAddress[msg.sender] += 1;

    uint256 newIndexOfUser = totalStakesOfAddress[msg.sender];
    indexOfStakeOrderId[msg.sender][newIndexOfUser] = _stakeOrderId;
    stakeOrderIdOfIndex[msg.sender][_stakeOrderId] = newIndexOfUser;

    Stake storage _stake = stakeOfOrderId[_stakeOrderId];
    _stake.accountStaking = msg.sender;
    _stake.stakedAmount = _stakeAmount;
    _stake.startDateStaking = uint32(block.timestamp);
    _stake.startDateReward = uint32(block.timestamp);
    _stake.ratioStaking = dailyAPY90;
    _stake.endDateStaking = uint32(block.timestamp) + periodStaking;
    _stake.readyTime = uint32(block.timestamp) + timeCooldown;

    token.transferFrom(msg.sender, recipient, _stakeAmount);
    emit CreateStake(msg.sender, _stakeAmount, uint32(block.timestamp), periodStaking, dailyAPY90, _stakeOrderId);
  }

  function calculateTimeRemain(Stake memory _stake) private pure returns (uint32) {
    uint32 lastTime;
    if (_stake.startDateReward >= _stake.endDateStaking) {
      lastTime = _stake.endDateStaking;
    } else {
      lastTime = _stake.startDateReward;
    }
    return _stake.endDateStaking - lastTime;
  }

  function calculateReward(uint256 _stakeOrderId)
    public
    view
    override
    CheckStakeOrder(_stakeOrderId)
    returns (uint256)
  {
    require(totalStakesOfAddress[msg.sender] > 0, 'You are not staking');
    Stake memory _stake = stakeOfOrderId[_stakeOrderId];
    require(_stake.accountStaking == msg.sender, 'You are not owner of stake order');

    uint256 daysStaking = (block.timestamp - _stake.startDateReward) / (1);
    uint256 reward1Day = (_stake.stakedAmount * _stake.ratioStaking) / 10000;
    uint256 lastReward = reward1Day * calculateTimeRemain(_stake);
    uint256 rewardStaking = uint32(block.timestamp) >= _stake.endDateStaking ? lastReward : reward1Day * daysStaking;
    return rewardStaking;
  }

  function withdrawReward(uint256 _stakeOrderId) public override CheckStakeOrder(_stakeOrderId) {
    require(block.timestamp >= stakeOfOrderId[_stakeOrderId].readyTime, 'The next withdrawal is not yet');
    uint256 reward = calculateReward(_stakeOrderId);
    require(token.balanceOf(recipient) >= reward, 'Balance is not enough to pay reward');
    require(reward > 0, 'You dont have any reward to withdraw');
    stakeOfOrderId[_stakeOrderId].startDateReward = uint32(block.timestamp);
    stakeOfOrderId[_stakeOrderId].readyTime = uint32(block.timestamp) + timeCooldown;
    token.transferFrom(recipient, msg.sender, reward);
    emit recieveReward(msg.sender, reward, uint32(block.timestamp), _stakeOrderId);
  }

  function withdrawAllRewards() external override {
    require(totalStakesOfAddress[msg.sender] > 0, 'You are not staking');
    uint256 allReward;
    uint256 arrayLength = totalStakesOfAddress[msg.sender];
    for (uint256 i = 1; i <= arrayLength; i++) {
      require(
        block.timestamp >= stakeOfOrderId[stakeOrderIdOfIndex[msg.sender][i]].readyTime,
        'The next withdrawal is not yet'
      );
      allReward = allReward + calculateReward(stakeOrderIdOfIndex[msg.sender][i]);
      stakeOfOrderId[stakeOrderIdOfIndex[msg.sender][i]].startDateReward = uint32(block.timestamp);
      stakeOfOrderId[stakeOrderIdOfIndex[msg.sender][i]].readyTime = uint32(block.timestamp) + timeCooldown;
    }
    require(token.balanceOf(recipient) >= allReward, 'Balance is not enough to pay reward');
    require(allReward > 0, 'You dont have any reward to withdraw');
    token.transferFrom(recipient, msg.sender, allReward);
    emit recieveAllReward(msg.sender, allReward, uint32(block.timestamp));
  }

  function releaseStake90Days(uint256 _stakeOrderId) external override CheckStakeOrder(_stakeOrderId) {
    require(totalStakesOfAddress[msg.sender] > 0, 'You are not staking');
    Stake memory _stake = stakeOfOrderId[_stakeOrderId];
    require(_stake.accountStaking == msg.sender, 'You are not owner of stake order');
    require(block.timestamp >= _stake.endDateStaking, 'Time release stake is not enough');

    uint256 reward = calculateReward(_stakeOrderId);
    uint256 recieveAmount = _stake.stakedAmount + reward;
    require(token.balanceOf(recipient) >= recieveAmount, 'Balance of recipient is not enough to release stake');

    uint256 removeIndex = indexOfStakeOrderId[msg.sender][_stakeOrderId];
    uint256 lastIndex = totalStakesOfAddress[msg.sender];
    uint256 lastStakeOrderId = stakeOrderIdOfIndex[msg.sender][lastIndex];
    stakeOrderIdOfIndex[msg.sender][removeIndex] = lastStakeOrderId; // Assign last index to remove index
    indexOfStakeOrderId[msg.sender][lastStakeOrderId] = removeIndex; // Remapping stakeId to new index

    delete stakeOfOrderId[_stakeOrderId];
    totalStakesOfAddress[msg.sender] -= 1;
    delete stakeOrderIdOfIndex[msg.sender][lastIndex];
    delete indexOfStakeOrderId[msg.sender][_stakeOrderId];

    token.transferFrom(recipient, msg.sender, recieveAmount);
    emit ReleaseStake(msg.sender, recieveAmount, uint32(block.timestamp), _stakeOrderId);
  }
}
