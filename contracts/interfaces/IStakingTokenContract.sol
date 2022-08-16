// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IStakingTokenContract {
  struct Stake {
    address accountStaking;
    uint256 stakedAmount;
    uint256 ratioStaking;
    uint32 startDateStaking;
    uint32 startDateReward;
    uint32 endDateStaking;
    uint32 readyTime;
  }

  event CreateStake(
    address accountStaking,
    uint256 _stakeAmount,
    uint32 startdateStaking,
    uint32 periodStaking,
    uint256 ratioStaking,
    uint256 stakeOrderId
  );
  event ReleaseStake(address accountStaking, uint256 stakeAmount, uint32 recieveDate, uint256 stackOrderId);
  event recieveReward(address accountStaking, uint256 rewardAmount, uint32 recieveDate, uint256 stackOrderId);
  event recieveAllReward(address accountStaking, uint256 rewardAmount, uint32 recieveDate);

  function createStake90Days(uint256 _stakeAmount) external;

  function setDailyAPY90(uint256 _value) external;

  function setRecipientAddress(address _recipient) external;

  function setCooldownTime(uint32 _newCooldown) external;

  function withdrawReward(uint256 _stakeOrder) external;

  function withdrawAllRewards() external;

  function releaseStake90Days(uint256 _stakeOrder) external;

  function getDailyAPY90() external view returns (uint256);

  function getPeriodStaking() external view returns (uint32);

  function getTimeCooldown() external view returns (uint32);

  function getRecipientAddress() external view returns (address);

  function getBalanceOfRecipient() external view returns (uint256);

  function getTotalStakesOFAddress(address stakeHolder) external view returns (uint256);

  function getStakeOfOrderId(uint256 stakeId) external view returns (Stake memory);

  function getStakeOfBalance(address _stakeholder) external view returns (uint256);
}
