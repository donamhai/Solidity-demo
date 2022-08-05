// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IHdnToken {
  event BlackListAdded(address account, uint32 timeAddToBlackList);
  event BlackListRemove(address account, uint32 timeRemoveFromBlackList);
  event PauseEvent(uint32 timePause, uint256 totalClaim);
  event UnpauseEvent(uint32 timeUnpause);
  event ClaimEvent(uint256 amount, address recieve, uint32 timeClaim);
  event ResetTotalSupplyEvent(uint256 amount, uint32 timeResetTotalsupply);

  function pause() external;

  function unpause() external;

  function claim(uint256 amount, address recieve) external;

  function resetTotalSupply(uint256 amount) external;

  function addToBlackList(address _account) external;

  function removeFromBlackList(address _account) external;
}
