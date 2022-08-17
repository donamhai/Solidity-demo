// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IMarketplace {
  struct OrderNFT {
    address seller;
    uint256 nftId;
    address paymentToken;
    uint256 price;
  }

  struct OrderTreasure {
    address seller;
    uint256 treasureType;
    address paymentToken;
    uint256 price;
    uint256 amount;
    uint256 totalPrice;
  }

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

  function setRecipientAddress(address recipient_) external;

  function setFeeRate(uint256 feeDecimal_, uint256 feeRate_) external;

  function setNftAddress(address _nftAddress) external;

  function setTreasureAddress(address _treasureAddress) external;

  function getRecipientAddress() external view returns (address);

  function getFeeDecimal() external view returns (uint256);

  function getFeeRate() external view returns (uint256);

  function getOrderOfNFT(uint256 orderId) external view returns (OrderNFT memory);

  function getOrderOfTreasure(uint256 orderId) external view returns (OrderTreasure memory);

  function getNftAddress() external view returns (address);

  function getTreasureAddress() external view returns (address);
}
