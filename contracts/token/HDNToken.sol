// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import './AccessController.sol';
import '../interfaces/IHdnToken.sol';

contract HdnToken is ERC20, Ownable, Pausable, AccessController, IHdnToken {
  uint256 private _totalSupply = 400000;
  uint256 private _initial_supply = 200000;
  uint256 private _totalClaim;
  mapping(address => bool) private _blacklist;

  constructor() ERC20('HDN Token', 'HDN') {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(PAUSER_ROLE, msg.sender);
    _mint(msg.sender, _initial_supply);
  }

  function pause() external override onlyRole(PAUSER_ROLE) {
    _pause();
    emit PauseEvent(uint32(block.timestamp), _totalClaim);
  }

  function unpause() external override onlyRole(PAUSER_ROLE) {
    _unpause();
    emit UnpauseEvent(uint32(block.timestamp));
  }

  function getBelanceOf(address account) external view override returns (uint256) {
    return balanceOf(account);
  }

  function getTotalClaim() external view override returns (uint256) {
    return _totalClaim;
  }

  function getTotalSupply() external view override returns (uint256) {
    return _totalSupply;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override whenNotPaused {
    require(_blacklist[from] == false, 'account sender was on blacklist');
    require(_blacklist[to] == false, 'account sender was on blacklist');
    super._beforeTokenTransfer(from, to, amount);
  }

  function claim(uint256 amount, address recieve) external override onlyOwner {
    require(amount <= 100000, 'Max amount one time');
    require(_blacklist[recieve] == false, 'Accout was on blacklist');
    require(_totalClaim + amount <= _totalSupply - _initial_supply, 'Not enough token to claim');
    _totalClaim += amount;
    _mint(recieve, amount);
    emit ClaimEvent(amount, recieve, uint32(block.timestamp));
  }

  function resetTotalSupply(uint256 amount) external override onlyOwner {
    require(amount >= _totalClaim + _initial_supply, 'Total supply is too low');
    _totalSupply = amount;
    emit ResetTotalSupplyEvent(amount, uint32(block.timestamp));
  }

  function addToBlackList(address _account) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_account != msg.sender, 'Must not add sender to blacklist');
    require(_blacklist[_account] == false, 'Accout was on blacklist');
    _blacklist[_account] = true;
    emit BlackListAdded(_account, uint32(block.timestamp));
  }

  function removeFromBlackList(address _account) external override onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_blacklist[_account] == true, 'Accout was not on blacklist');
    _blacklist[_account] = false;
    emit BlackListRemove(_account, uint32(block.timestamp));
  }
}
