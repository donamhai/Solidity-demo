// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IRelipaTreasure {
  event claimTreasureEvent(address recieve, uint256 idTreasure, uint256 amount);
  event safeTransferEvent(address from, address to, uint256 treasureId, uint256 amount);
  event unboxEvent(address walletUnbox, uint256 amount);

  function claimTreasure(uint256 amount, address to) external;

  function getBalanceOf(address account) external view returns (uint256);

  function safeTransfer(
    address from,
    address to,
    uint256 treasureId,
    uint256 amount
  ) external;

  function unbox(uint256 amount) external;

  function setNftAddress(address nftAddress) external;

  function setURI(string memory newUri) external;

  function getURI() external view returns (string memory);

  function getNftAddress() external view returns (address);

  function getTreasureType() external pure returns (uint256);
}
