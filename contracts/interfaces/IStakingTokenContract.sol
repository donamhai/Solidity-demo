// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IStakingTokenContract {
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

  function changeDailyAPY90(uint256 _value) external;

  function changeRecipientAddress(address _recipient) external;

  function changeCooldownTime(uint32 _newCooldown) external;

  function calculateReward(uint256 _stakeOrder) external view returns (uint256);

  function withdrawReward(uint256 _stakeOrder) external;

  function withdrawAllRewards() external;

  function releaseStake90Days(uint256 _stakeOrder) external;
}
