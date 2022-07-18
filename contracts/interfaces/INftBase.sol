// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

interface INftBase {
  enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
  }
  struct MetadataInfo {
    uint256 tokenId;
    Rarity rarity;
    uint256 metadataOrder;
  }

  function setBaseUri(string memory tokenBaseURI) external;

  function getMetadataInfo(uint256 _tokenId)
    external
    view
    returns (
      uint256,
      uint256,
      uint256
    );

  function getMetadataInfoBatch(uint256[] memory _tokenIds)
    external
    view
    returns (
      uint256[] memory,
      uint256[] memory,
      uint256[] memory
    );

  function mint(
    address receiver,
    uint256 rarity,
    uint256 metadataOrder
  ) external returns (uint256 tokenId);

  function mintBatch(
    address receiver,
    uint256[] memory rarities,
    uint256[] memory metadataOrders
  ) external returns (uint256[] memory);

  function getTokensOfUser(address account)
    external
    view
    returns (
      uint256[] memory,
      uint256[] memory,
      uint256[] memory
    );

  event BaseUriChanged(string tokenBaseURI);
  event TokenCreated(address indexed ownerAddress, uint256 indexed tokenId, uint256 rarity, uint256 metadataId);
}
