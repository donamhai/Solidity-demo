// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '../interfaces/IRelipaNFT.sol';
import './AccessController.sol';

contract RelipaNFT is ERC721Holder, ERC721Enumerable, Ownable, IRelipaNFT, AccessController {
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIdCount;
  string private _baseTokenURI;
  mapping(uint256 => Metadata) private _metadataOfTokenId;
  uint32 private _timeExpireDate;
  uint16 private _discount;

  modifier checkTokenId(uint256 tokenId) {
    require(tokenId > 0, 'Token id must be greater than 0');
    _;
  }

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  constructor(uint32 timeExpireDate, uint16 discount) ERC721('RLP_HDN', 'RLP') {
    _timeExpireDate = timeExpireDate;
    _discount = discount;
  }

  function claimToken(address Receiver) external override CheckAddress(Receiver) returns (uint256) {
    _tokenIdCount.increment();
    uint256 tokenId = _tokenIdCount.current();
    _metadataOfTokenId[tokenId] = Metadata({
      ownerToken: Receiver,
      discount: _discount,
      expireDate: uint32(block.timestamp + _timeExpireDate)
    });
    _safeMint(Receiver, tokenId);
    return tokenId;
  }

  function claimBatchToken(address Receiver, uint256 amount)
    external
    override
    onlyOperator
    CheckAddress(Receiver)
    returns (uint256[] memory)
  {
    require(amount > 0, 'amount must be greater than 0');
    uint256[] memory tokenIds = new uint256[](amount);
    for (uint256 i = 0; i < amount; i++) {
      _tokenIdCount.increment();
      tokenIds[i] = _tokenIdCount.current();
      _metadataOfTokenId[tokenIds[i]] = Metadata({
        ownerToken: Receiver,
        discount: _discount,
        expireDate: uint32(block.timestamp + _timeExpireDate)
      });
      _safeMint(Receiver, tokenIds[i]);
    }
    return tokenIds;
  }

  function transferNFT(
    address from,
    address to,
    uint256 tokenId
  ) external override CheckAddress(from) CheckAddress(to) checkTokenId(tokenId) {
    require(balanceOf(from) > 0, 'not enough NFT to transfer');
    _metadataOfTokenId[tokenId] = Metadata({
      ownerToken: to,
      discount: _discount,
      expireDate: uint32(block.timestamp + _timeExpireDate)
    });
    safeTransferFrom(from, to, tokenId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateBaseTokenURI(string memory baseTokenURI) public override onlyOwner {
    _baseTokenURI = baseTokenURI;
  }

  function tokenURI(uint256 tokenId) public view virtual override checkTokenId(tokenId) returns (string memory) {
    require(_exists(tokenId), 'Token id is not available');
    if (bytes(_baseURI()).length > 0) {
      return string(abi.encodePacked(_baseURI(), tokenId));
    } else {
      return '';
    }
  }

  function setTimeExpireDate(uint32 _newTimeExpireDate) external override onlyOwner {
    require(_newTimeExpireDate > 0, 'Please input new time expire date time > 0');
    _timeExpireDate = _newTimeExpireDate;
  }

  function setDiscount(uint16 _newDiscount) external override onlyOwner {
    require(_newDiscount > 0 && _newDiscount < 100, 'Please input new discount among 0 and 100');
    _discount = _newDiscount;
  }

  function getMetadataInfo(uint256 _tokenId) external view override checkTokenId(_tokenId) returns (Metadata memory) {
    return (_metadataOfTokenId[_tokenId]);
  }

  function getTokensOfUser(address account) external view override CheckAddress(account) returns (Metadata[] memory) {
    uint256 arrayLength = balanceOf(account);

    Metadata[] memory allToken = new Metadata[](arrayLength);
    for (uint256 index = 0; index < arrayLength; index++) {
      uint256 tokenId = tokenOfOwnerByIndex(account, index);
      Metadata memory existedMetadata = _metadataOfTokenId[tokenId];
      allToken[index] = existedMetadata;
    }
    return allToken;
  }

  function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
