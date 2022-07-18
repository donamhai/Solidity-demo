// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "../interfaces/IEnums.sol";

interface IStakeNftInfoManager {
  function stakeUserNft(
    address _user,
    IEnums.NftType _nftType,
    uint256 _nftId
  ) external;

  function unStakeUserNft(
    address _user,
    IEnums.NftType _nftType,
    uint256 _nftId
  ) external;

  function canStake(
    address _user,
    IEnums.NftType _nftType,
    uint256 _nftId
  ) external view returns (bool);
}
