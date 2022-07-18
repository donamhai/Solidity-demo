// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IAuctionContract3 {
  event CreateAuctionEvent(
    address _ownerAuction,
    uint256 _auctionOrderId,
    uint256 _nftTokenId,
    uint256 _auction_start,
    uint256 _maxPrice,
    uint32 _duration
  );
  event BidAuctionEvent(address _bidder, uint256 _auctionOrderId, uint256 _bidAmount, uint32 _bidTime);
  event CancelAuctionEvent(address _ownerAuction, uint256 _auctionOrderId, uint256 _amountPenalty, uint32 _cancelTime);
  event CloseAuctionEvent(address _ownerAuction, uint256 _auctionOrderId, uint32 _endTime);

  function createAuction(
    uint256 _nftTokenId,
    uint256 _maxPrice,
    uint32 _duration
  ) external;

  function bidAuction(uint256 _auctionOrderId) external;

  function cancelAuction(uint256 _auctionOrderId) external;

  function closeAuction(uint256 _auctionOrderId) external;
}
