// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import './RelipaNFT.sol';
import '../interfaces/IRelipaTreasure.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract RelipaTreasure is ERC1155, ERC1155Holder, Ownable, IRelipaTreasure {
  using ECDSA for bytes32;
  uint256 private constant RELIPA_TREASURE = 1;
  address private NFTaddress;
  address private _verifyAddress;

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier CheckAmount(uint256 amount) {
    require(amount > 0, 'Please input amount greater than 0');
    _;
  }

  constructor(string memory uri_, address _NFTaddress) CheckAddress(_NFTaddress) ERC1155(uri_) {
    require(Address.isContract(_NFTaddress), 'You must input contract address');
    NFTaddress = _NFTaddress;
  }

  function setURI(string memory newUri) public onlyOwner {
    _setURI(newUri);
  }

  function claimTreasure(uint256 amount) external override CheckAmount(amount) {
    _mint(msg.sender, RELIPA_TREASURE, amount, '');
    emit claimTreasureEvent(msg.sender, RELIPA_TREASURE, amount);
  }

  function getBalanceOf(address account) public view override returns (uint256) {
    return balanceOf(account, RELIPA_TREASURE);
  }

  function safeTransfer(
    address from,
    address to,
    uint256 treasureType,
    uint256 amount
  ) public override CheckAddress(from) CheckAddress(to) CheckAmount(amount) CheckAddress(to) {
    require(amount <= balanceOf(from, treasureType), "Amount must be less or equal than sender treasure's amount");
    _safeTransferFrom(from, to, treasureType, amount, '');
    emit safeTransferEvent(from, to, treasureType, amount);
  }

  function setNftAddress(address nftAddress) external override CheckAddress(nftAddress) onlyOwner {
    require(Address.isContract(nftAddress), 'You must input token address');
    NFTaddress = nftAddress;
  }

  function unbox(uint256 amount) external override CheckAmount(amount) {
    require(
      amount <= balanceOf(msg.sender, RELIPA_TREASURE),
      "Amount must be less or equal than sender treasure's amount"
    );
    RelipaNFT(NFTaddress).claimBatchToken(msg.sender, amount);
    emit unboxEvent(msg.sender, amount);
  }

  function _verifySignature(
    bytes memory signature,
    uint256 amount,
    string memory orderId
  ) private view returns (bool) {
    bytes32 hashValue = keccak256(abi.encodePacked(amount, orderId, msg.sender));
    address recover = hashValue.toEthSignedMessageHash().recover(signature);
    return recover == _verifyAddress;
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC1155Receiver, ERC1155) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
