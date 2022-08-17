// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import './RelipaNFT.sol';
import '../interfaces/IAuctionContract1.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

/*
Contract đấu giá các vật phẩm
Mỗi lần đặt giá sẽ đặt 1 số cao nhất, nếu có người khác đặt giá cao hơn
thì cần phải rút về số tiền lúc trước đã đặt, sau đó đặt lại giá mới
không đặt đấu giá cộng dồn
*/

contract AuctionContract1 is Ownable, ERC721Holder, IAuctionContract1 {
  using Counters for Counters.Counter;
  Counters.Counter private _auctionOrderIdCount;

  uint16 private feeRate;
  address private recipient;
  address private token;
  address private nftContract;
  mapping(address => uint256) private totalAuctionsOfOwner;
  mapping(address => mapping(uint256 => uint256)) private indexOfAuctionId;
  mapping(address => mapping(uint256 => uint256)) private auctionIdOfIndex;
  mapping(uint256 => Auction) private auctionOfOrderId;
  mapping(address => mapping(uint256 => uint256)) private fundsByBidder;

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

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier CheckAuctionOrder(uint256 _auctionOrderId) {
    require(_auctionOrderId > 0, 'Invalid auction order id');
    _;
  }

  constructor(
    address _token,
    address _nftAddress,
    address _recipient,
    uint16 _feeRate
  ) CheckAddress(_token) CheckAddress(_recipient) {
    require(Address.isContract(_token) && Address.isContract(_nftAddress), 'You must input contract address');
    require(0 < _feeRate && _feeRate < 100, 'Fee Rate must among 0 to 100');
    token = _token;
    nftContract = _nftAddress;
    recipient = _recipient;
    feeRate = _feeRate;
  }

  function getRecipientAddress() external view returns (address) {
    return recipient;
  }

  function getToken() external view returns (address) {
    return address(token);
  }

  function getNftAddress() external view returns (address) {
    return address(nftContract);
  }

  function getFeeRate() external view returns (uint256) {
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

  function getBalanceOfRecipient() external view returns (uint256) {
    return ERC20(token).balanceOf(recipient);
  }

  function getTotalAuctionsOfOwner(address ownerAution) external view returns (uint256) {
    return totalAuctionsOfOwner[ownerAution];
  }

  function getAutionOfOrderId(uint256 orderId) external view returns (Auction memory) {
    return auctionOfOrderId[orderId];
  }

  function setRecipientAddress(address _recipient) external CheckAddress(_recipient) onlyOwner {
    recipient = _recipient;
  }

  function setFeeRate(uint16 _feeRate) external onlyOwner {
    require(0 < _feeRate && _feeRate < 100, 'Fee Rate must among 0 to 100');
    feeRate = _feeRate;
  }

  function createAuction(
    uint256 _nftTokenId,
    uint256 _startPrice,
    uint32 _duration
  ) external override {
    require(_nftTokenId > 0, 'Invalid tokenId');
    require(RelipaNFT(nftContract).ownerOf(_nftTokenId) == msg.sender, 'Sender is not owner of token');
    require(
      RelipaNFT(nftContract).getApproved(_nftTokenId) == address(this) ||
        RelipaNFT(nftContract).isApprovedForAll(msg.sender, address(this)),
      'The contract is unauthorized to manage this token'
    );
    require(_startPrice >= 1000, 'Price must be greater than 1000');
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
    _order.startPrice = _startPrice;
    _order.auction_start = uint32(block.timestamp);
    _order.auction_duration = _duration;
    _order.auction_end = uint32(block.timestamp + _duration);

    RelipaNFT(nftContract).transferNFT(msg.sender, address(this), _nftTokenId);
    emit CreateAuctionEvent(msg.sender, _auctionId, _nftTokenId, uint32(block.timestamp), _startPrice, _duration);
  }

  function bidAuction(uint256 _auctionOrderId, uint256 _bidAmount)
    external
    override
    CheckAuctionOrder(_auctionOrderId)
  {
    Auction storage _order = auctionOfOrderId[_auctionOrderId];
    require(block.timestamp < _order.auction_end, 'The auction has already ended');
    require(_order.ownerNFT != msg.sender, 'Bidder must be different from owner auction');
    require(
      fundsByBidder[msg.sender][_auctionOrderId] == 0,
      'You have bidden this auction, please withdraw your money before bidding again'
    );
    require(ERC20(token).balanceOf(msg.sender) >= _bidAmount, 'Balance of bidder is not enough to bid this auction');
    require(_bidAmount > _order.startPrice, 'You must bid greater than start price');
    require(_bidAmount > _order.highestBid, 'There is already a higher or equal bid');

    _order.highestBidder = msg.sender;
    _order.highestBid = _bidAmount;
    fundsByBidder[msg.sender][_auctionOrderId] = _bidAmount;
    ERC20(token).transferFrom(msg.sender, recipient, _bidAmount);
    emit BidAuctionEvent(msg.sender, _auctionOrderId, _bidAmount, uint32(block.timestamp));
  }

  function withdraw(uint256 _auctionOrderId) external override CheckAuctionOrder(_auctionOrderId) {
    Auction memory _order = auctionOfOrderId[_auctionOrderId];
    require(fundsByBidder[msg.sender][_auctionOrderId] > 0, "You don't bid this auction");
    require(_order.highestBidder != msg.sender, "Your bid is the highest price, can't withdraw");
    require(
      ERC20(token).balanceOf(recipient) >= fundsByBidder[msg.sender][_auctionOrderId],
      'Balance of Auction Market not enough to withdraw'
    );

    uint256 withdrawAmount = fundsByBidder[msg.sender][_auctionOrderId];
    fundsByBidder[msg.sender][_auctionOrderId] = 0;

    ERC20(token).transferFrom(recipient, msg.sender, withdrawAmount);
    emit WithdrawEvent(msg.sender, _auctionOrderId, withdrawAmount);
  }

  function removeAuction(uint256 _auctionOrderId) private {
    uint256 indexRemove = indexOfAuctionId[msg.sender][_auctionOrderId];
    uint256 lastIndex = totalAuctionsOfOwner[msg.sender];
    uint256 lastAuctionOrderId = auctionIdOfIndex[msg.sender][lastIndex];
    auctionIdOfIndex[msg.sender][indexRemove] = lastAuctionOrderId; // Assign last index to remove index
    indexOfAuctionId[msg.sender][lastAuctionOrderId] = indexRemove; // Remapping stakeId to new index

    totalAuctionsOfOwner[msg.sender] -= 1;
    delete auctionOfOrderId[_auctionOrderId];
    delete auctionIdOfIndex[msg.sender][lastIndex];
    delete indexOfAuctionId[msg.sender][_auctionOrderId];
  }

  function cancelAuction(uint256 _auctionOrderId) external override CheckAuctionOrder(_auctionOrderId) {
    Auction memory _order = auctionOfOrderId[_auctionOrderId];
    require(block.timestamp < _order.auction_end, 'The auction has already ended');
    require(_order.ownerNFT == msg.sender, 'You are not owner of this auction');
    require(
      ERC20(token).balanceOf(msg.sender) >= _order.startPrice,
      'If you cancel the auction, the starting price of auction will be lost'
    );

    uint256 feePenalty = _order.startPrice;
    uint256 tokenNFT = _order.nftTokenId;

    removeAuction(_auctionOrderId);

    ERC20(token).transferFrom(msg.sender, recipient, feePenalty);
    RelipaNFT(nftContract).transferNFT(address(this), msg.sender, tokenNFT);
    emit CancelAuctionEvent(msg.sender, _auctionOrderId, feePenalty, uint32(block.timestamp));
  }

  function closeAuction(uint256 _auctionOrderId) external override CheckAuctionOrder(_auctionOrderId) {
    Auction memory _order = auctionOfOrderId[_auctionOrderId];
    require(block.timestamp > _order.auction_end, 'The auction has not ended yet');
    require(_order.ownerNFT == msg.sender, 'You are not owner of this auction');

    fundsByBidder[_order.highestBidder][_auctionOrderId] = 0;
    address _highestBidder = _order.highestBidder;
    uint256 _highestBid = _order.highestBid;
    uint256 _nftTokenId = _order.nftTokenId;
    uint32 _auction_end = _order.auction_end;
    uint256 amountPayment = _order.highestBid - ((_order.highestBid * feeRate) / 100);
    require(ERC20(token).balanceOf(recipient) >= amountPayment, 'Balance of Auction Market not enough to withdraw');

    if (_order.highestBidder == address(0)) {
      _highestBidder = msg.sender;
    }

    removeAuction(_auctionOrderId);

    RelipaNFT(nftContract).transferNFT(address(this), _highestBidder, _nftTokenId);
    ERC20(token).transferFrom(recipient, msg.sender, amountPayment);
    emit CloseAuctionEvent(msg.sender, _auctionOrderId, _highestBidder, _highestBid, _auction_end);
  }
}
