// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import './RelipaNFT.sol';
import '../interfaces/IAuctionContract3.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

/*
Contract đấu giá ngược các vật phẩm
Khi tạo 1 auction sẽ setting giá vật phẩm ở mức cao nhất, 
từ lúc bắt đầu đến lúc kết thúc thì giá của vật phẩm sẽ giảm dần
Khi giảm đến 1 mức giá nào đó mà bidder mua đc là mua luôn
*/

contract AuctionContract3 is Ownable, ERC721Holder, IAuctionContract3 {
  using Counters for Counters.Counter;
  Counters.Counter private _auctionOrderIdCount;
  ERC20 token;
  RelipaNFT private nftContract;
  uint16 private feeRate;
  address private recipient;

  mapping(address => uint256) public totalAuctionsOfOwner;
  mapping(address => mapping(uint256 => uint256)) public indexOfAuctionId;
  mapping(address => mapping(uint256 => uint256)) public auctionIdOfIndex;
  mapping(uint256 => Auction) public auctionOfOrderId;

  struct Auction {
    address ownerNFT;
    uint256 nftTokenId;
    uint256 maxPrice;
    uint32 auction_start;
    uint32 auction_duration;
    uint32 auction_end;
  }

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier CheckAuctionOrder(uint256 _auctionOrderId) {
    require(_auctionOrderId > 0, 'Invalid auction order id');
    _;
  }

  constructor(
    address tokenStake,
    address nftAddress,
    address _recipient,
    uint16 _feeRate
  ) CheckAddress(tokenStake) CheckAddress(_recipient) {
    require(Address.isContract(tokenStake) && Address.isContract(nftAddress), 'You must input contract address');
    require(0 < _feeRate && _feeRate < 100, 'Fee Rate must among 0 to 100');
    token = ERC20(tokenStake);
    nftContract = RelipaNFT(nftAddress);
    recipient = _recipient;
    feeRate = _feeRate;
  }

  function getRecipientAddress() external view onlyOwner returns (address) {
    return recipient;
  }

  function getFeeRate() external view onlyOwner returns (uint256) {
    return feeRate;
  }

  function getAuctionOfOwner() external view returns (uint256[] memory) {
    uint256 arrayLength = totalAuctionsOfOwner[msg.sender];
    uint256[] memory allAuctionOfOwner = new uint256[](arrayLength);

    for (uint256 i = 1; i <= arrayLength; i++) {
      uint256 auction = auctionIdOfIndex[msg.sender][i];
      allAuctionOfOwner[i - 1] = auction;
    }
    return allAuctionOfOwner;
  }

  function changeRecipientAddress(address _recipient) external CheckAddress(_recipient) onlyOwner {
    recipient = _recipient;
  }

  function changeFeeRate(uint16 _feeRate) external onlyOwner {
    require(0 < _feeRate && _feeRate < 100, 'Fee Rate must among 0 to 100');
    feeRate = _feeRate;
  }

  function getBalanceOfRecipient() public view onlyOwner returns (uint256) {
    return token.balanceOf(recipient);
  }

  function getPriceAtMoment(uint256 _auctionOrderId) external view returns (uint256) {
    Auction memory _order = auctionOfOrderId[_auctionOrderId];
    require(_order.nftTokenId == 0, 'The auction is invalid');
    require(block.timestamp < _order.auction_end, 'The auction has been out of date');
    uint32 leftTime = uint32(_order.auction_end - block.timestamp);
    uint256 amountBid = (_order.maxPrice * leftTime) / _order.auction_duration;
    return amountBid;
  }

  function createAuction(
    uint256 _nftTokenId,
    uint256 _maxPrice,
    uint32 _duration
  ) external override {
    require(_nftTokenId > 0, 'Invalid tokenId');
    require(nftContract.ownerOf(_nftTokenId) == msg.sender, 'Sender is not owner of token');
    require(
      nftContract.getApproved(_nftTokenId) == address(this) || nftContract.isApprovedForAll(msg.sender, address(this)),
      'The contract is unauthorized to manage this token'
    );
    require(_maxPrice > 0, 'Price must be greater than 0');
    require(_duration > 0, 'Duration auction must be greater than 0');

    _auctionOrderIdCount.increment();
    uint256 _auctionId = _auctionOrderIdCount.current();

    totalAuctionsOfOwner[msg.sender] += 1;
    uint256 newIndexOfUser = totalAuctionsOfOwner[msg.sender];
    indexOfAuctionId[msg.sender][newIndexOfUser] = _auctionId;
    auctionIdOfIndex[msg.sender][_auctionId] = newIndexOfUser;

    Auction storage _order = auctionOfOrderId[_auctionId];
    _order.ownerNFT = msg.sender;
    _order.nftTokenId = _nftTokenId;
    _order.maxPrice = _maxPrice;
    _order.auction_start = uint32(block.timestamp);
    _order.auction_duration = _duration;
    _order.auction_end = uint32(block.timestamp + _duration);

    nftContract.transferNFT(msg.sender, address(this), _nftTokenId);
    emit CreateAuctionEvent(msg.sender, _auctionId, _nftTokenId, uint32(block.timestamp), _maxPrice, _duration);
  }

  function removeAuction(address _account, uint256 _auctionOrderId) private {
    uint256 indexRemove = indexOfAuctionId[_account][_auctionOrderId];
    uint256 lastIndex = totalAuctionsOfOwner[_account];
    uint256 lastAuctionOrderId = auctionIdOfIndex[_account][lastIndex];
    auctionIdOfIndex[_account][indexRemove] = lastAuctionOrderId; // Assign last index to remove index
    indexOfAuctionId[_account][lastAuctionOrderId] = indexRemove; // Remapping stakeId to new index

    totalAuctionsOfOwner[_account] -= 1;
    delete auctionOfOrderId[_auctionOrderId];
    delete auctionIdOfIndex[_account][lastIndex];
    delete indexOfAuctionId[_account][_auctionOrderId];
  }

  function bidAuction(uint256 _auctionOrderId) external override CheckAuctionOrder(_auctionOrderId) {
    Auction memory _order = auctionOfOrderId[_auctionOrderId];
    require(block.timestamp < _order.auction_end, 'The auction has already ended');
    require(_order.ownerNFT != msg.sender, 'Bidder must be different from owner auction');

    uint256 _nftTokenId = _order.nftTokenId;
    address _ownerNFT = _order.ownerNFT;

    uint32 leftTime = uint32(_order.auction_end - block.timestamp);
    uint256 amountBid = (_order.maxPrice * leftTime) / _order.auction_duration;
    uint256 feePayment = (amountBid * feeRate) / 100;
    require(token.balanceOf(msg.sender) >= amountBid, 'Balance of you is not enough to bid this auction');

    removeAuction(_ownerNFT, _auctionOrderId);

    token.transferFrom(msg.sender, recipient, feePayment);
    token.transferFrom(msg.sender, _ownerNFT, amountBid - feePayment);
    nftContract.transferNFT(address(this), msg.sender, _nftTokenId);
    emit BidAuctionEvent(msg.sender, _auctionOrderId, amountBid, uint32(block.timestamp));
  }

  function cancelAuction(uint256 _auctionOrderId) external override CheckAuctionOrder(_auctionOrderId) {
    Auction memory _order = auctionOfOrderId[_auctionOrderId];
    require(block.timestamp < _order.auction_end, 'The auction has already ended');
    require(_order.ownerNFT == msg.sender, 'You are not owner of this auction');
    require(
      token.balanceOf(msg.sender) >= (_order.maxPrice * 5) / 100,
      'If you cancel the auction, 5% of the max price of auction will be lost'
    );

    uint256 feePenalty = (_order.maxPrice * 5) / 100;
    uint256 tokenNFT = _order.nftTokenId;

    removeAuction(msg.sender, _auctionOrderId);

    token.transferFrom(msg.sender, recipient, feePenalty);
    nftContract.transferNFT(address(this), msg.sender, tokenNFT);
    emit CancelAuctionEvent(msg.sender, _auctionOrderId, feePenalty, uint32(block.timestamp));
  }

  function closeAuction(uint256 _auctionOrderId) external override CheckAuctionOrder(_auctionOrderId) {
    Auction memory _order = auctionOfOrderId[_auctionOrderId];
    require(block.timestamp > _order.auction_end, 'The auction has not ended yet');
    require(_order.ownerNFT == msg.sender, 'You are not owner of this auction');
    uint256 _nftTokenId = _order.nftTokenId;
    uint32 _auction_end = _order.auction_end;

    removeAuction(msg.sender, _auctionOrderId);

    nftContract.transferNFT(address(this), msg.sender, _nftTokenId);
    emit CloseAuctionEvent(msg.sender, _auctionOrderId, _auction_end);
  }
}
