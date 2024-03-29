// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './RelipaNFT.sol';
import './RelipaTreasure.sol';
import '../interfaces/IMarketplace.sol';

contract Marketplace is Ownable, ERC721Holder, ERC1155Holder, IMarketplace {
  using EnumerableSet for EnumerableSet.AddressSet;
  using SafeERC20 for IERC20;
  using Counters for Counters.Counter;

  EnumerableSet.AddressSet private _supportedPaymentTokens;
  Counters.Counter private _orderIdNftCount;
  Counters.Counter private _orderIdTreasureCount;

  uint256 private feeDecimal;
  uint256 private feeRate;
  address private recipient;
  address private nftContract;
  address private treasureContract;

  mapping(uint256 => OrderNFT) private orderOfNFT;
  mapping(uint256 => OrderTreasure) private orderOfTreasure;

  constructor(
    address nftAddress,
    address treasureAddress,
    address paymentToken_,
    uint256 feeDecimal_,
    uint256 feeRate_,
    address recipient_
  ) {
    require(
      nftAddress != address(0) && treasureAddress != address(0) && recipient_ != address(0),
      'NFTMarketplace: Address input is zero address'
    );
    require(Address.isContract(nftAddress) && Address.isContract(treasureAddress), 'You must input contract address');

    nftContract = nftAddress;
    treasureContract = treasureAddress;
    recipient = recipient_;
    _updateFeeRate(feeDecimal_, feeRate_);
    _supportedPaymentTokens.add(paymentToken_);
  }

  modifier checkOrderId(uint256 orderId) {
    require(orderId > 0, 'Order Id must be greater than 0');
    _;
  }

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier onlySupportedPaymentToken(address paymentToken_) {
    require(_supportedPaymentTokens.contains(paymentToken_), 'NFTMarketplace: unsupport payment token');
    _;
  }

  function _updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) private {
    require(feeDecimal_ > 0 && feeRate_ > 0, 'Fee decimal or Fee rate must be greater than 0');
    require(feeRate_ < 10**(feeDecimal_), 'NFTMarketplace: bad fee rate');
    feeDecimal = feeDecimal_;
    feeRate = feeRate_;
    emit feeRateUpdated(feeDecimal_, feeRate_);
  }

  function _calculateFeeNFT(uint256 orderId_) private view returns (uint256) {
    OrderNFT memory _order = orderOfNFT[orderId_];
    if (feeRate == 0) {
      return 0;
    }
    return (feeRate * _order.price) / 10**(feeDecimal);
  }

  function _calculateFeeTreasure(uint256 orderId_) private view returns (uint256) {
    OrderTreasure memory _order = orderOfTreasure[orderId_];
    if (feeRate == 0) {
      return 0;
    }
    return (feeRate * _order.totalPrice) / 10**(feeDecimal);
  }

  function addPaymentToken(address paymentToken_) external override onlyOwner {
    require(paymentToken_ != address(0), 'NFTMarketplace: paymentToken_ is zero address');
    require(_supportedPaymentTokens.add(paymentToken_), 'NFTMarketplace: already supported');
  }

  function setRecipientAddress(address recipient_) external override CheckAddress(recipient_) onlyOwner {
    recipient = recipient_;
  }

  function setFeeRate(uint256 feeDecimal_, uint256 feeRate_) external override onlyOwner {
    _updateFeeRate(feeDecimal_, feeRate_);
  }

  function setNftAddress(address _nftAddress) external override CheckAddress(_nftAddress) onlyOwner {
    require(Address.isContract(_nftAddress), 'You must input nft contract address');
    nftContract = _nftAddress;
  }

  function setTreasureAddress(address _treasureAddress) external override CheckAddress(_treasureAddress) onlyOwner {
    require(Address.isContract(_treasureAddress), 'You must input treasure contract address');
    treasureContract = _treasureAddress;
  }

  function getRecipientAddress() external view override returns (address) {
    return recipient;
  }

  function getNftAddress() external view override returns (address) {
    return nftContract;
  }

  function getTreasureAddress() external view override returns (address) {
    return treasureContract;
  }

  function getFeeDecimal() external view override returns (uint256) {
    return feeDecimal;
  }

  function getFeeRate() external view override returns (uint256) {
    return feeRate;
  }

  function getOrderOfNFT(uint256 orderId) external view override returns (OrderNFT memory) {
    return orderOfNFT[orderId];
  }

  function getOrderOfTreasure(uint256 orderId) external view override returns (OrderTreasure memory) {
    return orderOfTreasure[orderId];
  }

  function addOrderNFT(
    uint256 nftId_,
    address paymentToken_,
    uint256 price_
  ) external override onlySupportedPaymentToken(paymentToken_) {
    require(nftId_ > 0, 'Invalid tokenId');
    require(RelipaNFT(nftContract).ownerOf(nftId_) == _msgSender(), 'NFTMarketplace: sender is not owner of token');
    require(
      RelipaNFT(nftContract).getApproved(nftId_) == address(this) ||
        RelipaNFT(nftContract).isApprovedForAll(_msgSender(), address(this)),
      'NFTMarketplace: The contract is unauthorized to manage this token'
    );
    require(price_ > 0, 'NFTMarketplace: price must be greater than 0');

    _orderIdNftCount.increment();
    uint256 _orderId = _orderIdNftCount.current();
    OrderNFT storage _order = orderOfNFT[_orderId];
    _order.seller = _msgSender();
    _order.nftId = nftId_;
    _order.paymentToken = paymentToken_;
    _order.price = price_;

    RelipaNFT(nftContract).transferNFT(_msgSender(), address(this), nftId_);
    emit OrderAdded(_orderId, _msgSender(), nftId_, paymentToken_, price_);
  }

  function addOrderTreasure(
    uint256 treasureType_,
    address paymentToken_,
    uint256 price_,
    uint256 amount_
  ) external payable override onlySupportedPaymentToken(paymentToken_) {
    require(treasureType_ == 1, 'Invalid treasureType');
    require(amount_ > 0, 'Amount must be greater than 0');
    require(
      RelipaTreasure(treasureContract).isApprovedForAll(_msgSender(), address(this)),
      'NFTMarketplace: The contract is unauthorized to manage this token'
    );
    require(price_ > 0, 'NFTMarketplace: price must be greater than 0');

    _orderIdTreasureCount.increment();
    uint256 _orderId = _orderIdTreasureCount.current();
    OrderTreasure storage _order = orderOfTreasure[_orderId];
    _order.seller = _msgSender();
    _order.treasureType = treasureType_;
    _order.paymentToken = paymentToken_;
    _order.price = price_;
    _order.amount = amount_;
    _order.totalPrice = price_ * amount_;

    RelipaTreasure(treasureContract).safeTransfer(_msgSender(), address(this), treasureType_, amount_);
    emit OrderAdded(_orderId, _msgSender(), treasureType_, paymentToken_, price_);
  }

  function cancelOrderNFT(uint256 orderId_) external override checkOrderId(orderId_) {
    OrderNFT memory _order = orderOfNFT[orderId_];
    require(_order.seller == _msgSender(), 'NFTMarketplace: must be owner');
    uint256 _nftId = _order.nftId;
    delete orderOfNFT[orderId_];
    RelipaNFT(nftContract).transferNFT(address(this), _msgSender(), _nftId);
    emit OrderCancelled(orderId_);
  }

  function cancelOrderTreasure(uint256 orderId_) external override checkOrderId(orderId_) {
    OrderTreasure memory _order = orderOfTreasure[orderId_];
    require(_order.seller == _msgSender(), 'NFTMarketplace: must be owner');
    uint256 _treasureType = _order.treasureType;
    uint256 _amount = _order.amount;
    delete orderOfTreasure[orderId_];
    RelipaTreasure(treasureContract).safeTransfer(address(this), _msgSender(), _treasureType, _amount);
    emit OrderCancelled(orderId_);
  }

  function buyOrderNFT(uint256 orderId_) external override checkOrderId(orderId_) {
    OrderNFT memory _order = orderOfNFT[orderId_];
    require(orderOfNFT[orderId_].seller != _msgSender(), 'NFTMarketplace: buyer must be different from seller');
    require(IERC20(_order.paymentToken).balanceOf(msg.sender) > _order.price, 'You dont have enough token to buy');
    uint256 _feeAmount = _calculateFeeNFT(orderId_);
    if (_feeAmount > 0) {
      IERC20(_order.paymentToken).safeTransferFrom(_msgSender(), recipient, _feeAmount);
    }

    delete orderOfNFT[orderId_];
    IERC20(_order.paymentToken).safeTransferFrom(_msgSender(), _order.seller, _order.price - _feeAmount);
    RelipaNFT(nftContract).transferNFT(address(this), _msgSender(), _order.nftId);
    emit OrderMatched(
      orderId_,
      _order.seller,
      msg.sender,
      _order.nftId,
      _order.paymentToken,
      _order.price - _feeAmount
    );
  }

  function buyOrderTreasure(uint256 orderId_) external override checkOrderId(orderId_) {
    OrderTreasure memory _order = orderOfTreasure[orderId_];
    require(orderOfTreasure[orderId_].seller != _msgSender(), 'NFTMarketplace: buyer must be different from seller');
    require(IERC20(_order.paymentToken).balanceOf(msg.sender) > _order.totalPrice, 'You dont have enough token to buy');
    uint256 _feeAmount = _calculateFeeTreasure(orderId_);
    if (_feeAmount > 0) {
      IERC20(_order.paymentToken).safeTransferFrom(_msgSender(), recipient, _feeAmount);
    }

    delete orderOfTreasure[orderId_];
    IERC20(_order.paymentToken).safeTransferFrom(_msgSender(), _order.seller, _order.totalPrice - _feeAmount);
    RelipaTreasure(treasureContract).safeTransfer(address(this), _msgSender(), _order.treasureType, _order.amount);
    emit OrderMatched(orderId_, _order.seller, msg.sender, _order.treasureType, _order.paymentToken, _order.totalPrice);
  }
}
