// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IRelipaNFT {
  event ClaimTokenEvent(address Receiver, uint256 tokenId, uint32 timeClaimToken);
  event ClaimBatchTokenEvent(address receiver, uint256 amount, uint256[] tokenIds, uint32 timeClaimToken);
  event TransferNFTEvent(address from, address to, uint256 tokenId, uint32 timeTransfer);

  struct Metadata {
    address ownerToken;
    uint16 discount;
    uint32 expireDate;
  }

  function claimToken(address Receiver) external returns (uint256);

  function claimBatchToken(address receiver, uint256 amount) external returns (uint256[] memory);

  function transferNFT(
    address from,
    address to,
    uint256 tokenId
  ) external;

  function setBaseTokenURI(string memory baseTokenURI) external;

  function setTimeExpireDate(uint32 _newTimeExpireDate) external;

  function setDiscount(uint16 _newDiscount) external;

  function getMetadataInfo(uint256 _tokenId) external view returns (Metadata memory);

  function getTokensOfUser(address account) external view returns (Metadata[] memory);
}
