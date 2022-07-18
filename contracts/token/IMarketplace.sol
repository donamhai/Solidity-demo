// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IMarketplace {
  event OrderAdded(
    uint256 indexed orderId,
    address indexed seller,
    uint256 indexed nftId,
    address paymentToken,
    uint256 price
  );
  event OrderCancelled(uint256 indexed orderId);
  event OrderMatched(
    uint256 indexed orderId,
    address indexed seller,
    address indexed buyer,
    uint256 nftId,
    address paymentToken,
    uint256 price
  );
  event feeRateUpdated(uint256 feeDecimal, uint256 feeRate);

  function addPaymentToken(address paymentToken_) external;

  function addOrderNFT(
    uint256 nftId_,
    address paymentToken_,
    uint256 price_
  ) external;

  function addOrderTreasure(
    uint256 treasureId_,
    address paymentToken_,
    uint256 price_,
    uint256 amount_
  ) external payable;

  function cancelOrderNFT(uint256 orderId_) external;

  function cancelOrderTreasure(uint256 orderId_) external;

  function buyOrderNFT(uint256 orderId_) external;

  function buyOrderTreasure(uint256 orderId_) external;
}
