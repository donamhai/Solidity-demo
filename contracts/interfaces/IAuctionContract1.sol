// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IAuctionContract1 {
  struct Auction {
    address ownerNFT;
    uint256 nftTokenId;
    uint256 startPrice;
    uint32 auction_start;
    uint32 auction_duration;
    uint32 auction_end;
    uint256 highestBid;
    address highestBidder;
  }

  event CreateAuctionEvent(
    address _ownerAuction,
    uint256 _auctionOrderId,
    uint256 _nftTokenId,
    uint256 _auction_start,
    uint256 _startPrice,
    uint32 _duration
  );
  event BidAuctionEvent(address _bidder, uint256 _auctionOrderId, uint256 _bidAmount, uint32 _bidTime);
  event WithdrawEvent(address bidder, uint256 _auctionOrderId, uint256 _amountWithdraw);
  event CancelAuctionEvent(address _ownerAuction, uint256 _auctionOrderId, uint256 _amountPenalty, uint32 _cancelTime);
  event CloseAuctionEvent(
    address _ownerAuction,
    uint256 _auctionOrderId,
    address _highestBidder,
    uint256 _highestBid,
    uint32 _endTime
  );

  function createAuction(
    uint256 _nftTokenId,
    uint256 _startPrice,
    uint32 _duration
  ) external;

  function bidAuction(uint256 _auctionOrderId, uint256 _bidAmount) external;

  function withdraw(uint256 _auctionOrderId) external;

  function cancelAuction(uint256 _auctionOrderId) external;

  function closeAuction(uint256 _auctionOrderId) external;

  function getRecipientAddress() external view returns (address);

  function getTokenAddress() external view returns (address);

  function getNftAddress() external view returns (address);

  function getFeeRate() external view returns (uint256);

  function getAuctionOfOwner() external view returns (uint256[] memory);

  function getBalanceOfRecipient() external view returns (uint256);

  function getTotalAuctionsOfOwner(address ownerAution) external view returns (uint256);

  function getAutionOfOrderId(uint256 orderId) external view returns (Auction memory);

  function setRecipientAddress(address _recipient) external;

  function setNftAddress(address _nftAddress) external;

  function setTokenAddress(address _tokenAddress) external;

  function setFeeRate(uint16 _feeRate) external;
}
