// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import './AccessController.sol';

contract HDNToken is ERC20, Ownable, Pausable, AccessController {
  uint256 private _totalSupply = 4000000;
  uint256 private _initial_supply = 200000;
  uint256 private _totalClaim;
  mapping(address => bool) private _blacklist;

  event BlackListAdded(address account);
  event BlackListRemove(address account);

  constructor() ERC20('HDN Token', 'HDN') {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(PAUSER_ROLE, msg.sender);
    _mint(msg.sender, _initial_supply);
  }

  function pause() public onlyRole(PAUSER_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(PAUSER_ROLE) {
    _unpause();
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

  function claim(uint256 amount) public {
    require(amount <= 1000000, 'Max amount one time');
    require(_totalClaim + amount <= _totalSupply - _initial_supply, 'Not enough token to claim');
    _totalClaim += amount;
    _mint(msg.sender, amount);
  }

  function resetTotalSupply(uint256 amount) public onlyOwner {
    require(amount >= _totalClaim + _initial_supply, 'Total supply is too low');
    _totalSupply = amount;
  }

  function addToBlackList(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_account != msg.sender, 'Must not add sender to blacklist');
    require(_blacklist[_account] == false, 'Accout was on blacklist');
    _blacklist[_account] = true;
    emit BlackListAdded(_account);
  }

  function removeFromBlackList(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_blacklist[_account] == true, 'Accout was not on blacklist');
    _blacklist[_account] = false;
    emit BlackListRemove(_account);
  }
}
