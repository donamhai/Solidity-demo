// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol';
import './RelipaNFT.sol';
import '../interfaces/IRelipaTreasure.sol';
import './AccessController.sol';
import './Marketplace.sol';

contract RelipaTreasure is ERC1155, ERC1155Holder, Ownable, IRelipaTreasure, AccessController {
  uint256 private constant RELIPA_TREASURE = 1;
  address private NFTaddress;
  address private marketplaceAddress;

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier CheckAmount(uint256 amount) {
    require(amount > 0, 'Please input amount greater than 0');
    _;
  }

  constructor(string memory uri_, address _NFTaddress) CheckAddress(_NFTaddress) ERC1155(uri_) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    require(Address.isContract(_NFTaddress), 'You must input contract address');
    NFTaddress = _NFTaddress;
  }

  function getTreasureType() external pure returns (uint256) {
    return RELIPA_TREASURE;
  }

  function getBalanceOf(address account) external view override returns (uint256) {
    return balanceOf(account, RELIPA_TREASURE);
  }

  function getURI() external view override returns (string memory) {
    return uri(1);
  }

  function getNftAddress() external view override returns (address) {
    return NFTaddress;
  }

  function getMarketPlaceAddress() external view returns (address) {
    return marketplaceAddress;
  }

  function setMarketPlaceAddress(address _marketPlaceAddress) external CheckAddress(_marketPlaceAddress) onlyOwner {
    require(Address.isContract(_marketPlaceAddress), 'You must input marketplace address');
    marketplaceAddress = _marketPlaceAddress;
  }

  function setURI(string memory newUri) external override onlyOwner {
    require(bytes(newUri).length > 0, 'Please input token URI');
    _setURI(newUri);
  }

  function setNftAddress(address nftAddress) external override CheckAddress(nftAddress) onlyOwner {
    require(Address.isContract(nftAddress), 'You must input token address');
    NFTaddress = nftAddress;
  }

  function claimTreasure(uint256 amount, address to) external override CheckAmount(amount) onlyOwner {
    _mint(to, RELIPA_TREASURE, amount, '');
    emit claimTreasureEvent(to, RELIPA_TREASURE, amount);
  }

  function _safeTransferFrom(
    address from,
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) internal virtual override {
    if (from != marketplaceAddress) {
      require(to == marketplaceAddress, 'Cannot transfer to another address, exclude marketplace!');
    }
    super._safeTransferFrom(from, to, id, amount, data);
  }

  function safeTransfer(
    address from,
    address to,
    uint256 treasureType,
    uint256 amount
  ) public override CheckAddress(from) CheckAddress(to) CheckAmount(amount) {
    require(amount <= balanceOf(from, treasureType), "Amount must be less or equal than sender treasure's amount");
    _safeTransferFrom(from, to, treasureType, amount, '');
    emit safeTransferEvent(from, to, treasureType, amount);
  }

  function unbox(uint256 amount) external override CheckAmount(amount) {
    require(
      amount <= balanceOf(msg.sender, RELIPA_TREASURE),
      "Amount must be less or equal than sender treasure's amount"
    );
    if (amount == 1) {
      _burn(msg.sender, RELIPA_TREASURE, 1);
      RelipaNFT(NFTaddress).claimToken(msg.sender);
    } else {
      _burn(msg.sender, RELIPA_TREASURE, amount);
      RelipaNFT(NFTaddress).claimBatchToken(msg.sender, amount);
    }

    emit unboxEvent(msg.sender, amount);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC1155Receiver, ERC1155, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
