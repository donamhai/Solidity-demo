// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0;

interface IEnums {
  enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
  }
  enum TreasureType {
    Land,
    Character
  }
  enum NftType {
    Land,
    Character
  }
  enum SalesState {
    Inactive,
    TreasureSales
  }
  enum Action {
    Buy,
    Unbox
  }
  enum UserType {
    Normal,
    Whitelist
  }
}
