// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/Address.sol';

contract BankMoney {
  address private owner;
  ERC20 token;
  uint256 private limitWithdrawToken;
  uint32 private timeCooldown;

  mapping(address => account) private accountUser;

  struct account {
    mapping(address => uint256) balanceOfToken;
    uint32 readyTime;
  }

  constructor(
    ERC20 tracker_0x_address,
    uint256 _limitWithdrawToken,
    uint32 _timeCooldown
  ) {
    require(_limitWithdrawToken > 0 && _timeCooldown > 0);
    owner = msg.sender;
    token = ERC20(tracker_0x_address);
    limitWithdrawToken = _limitWithdrawToken;
    timeCooldown = _timeCooldown;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, 'You are not allowed');
    _;
  }

  function setLimitWithdrawToken(uint256 _limitWithdrawToken) external onlyOwner {
    require(_limitWithdrawToken > 0, 'Limit Withdraw Token must be greater than 0');
    limitWithdrawToken = _limitWithdrawToken;
  }

  function setCooldownTime(uint32 _newCooldown) external onlyOwner {
    require(_newCooldown > 0, 'Please input new cooldown time > 0');
    timeCooldown = _newCooldown;
  }

  function changeToken(address _addressToken) external onlyOwner {
    require(_addressToken != address(0), 'Can not change to zero address');
    require(Address.isContract(_addressToken), 'You must input token address');
    token = ERC20(_addressToken);
  }

  function deposit(uint256 amount) public {
    require(amount > 0, 'Please input amount > 0');
    require(token.balanceOf(msg.sender) >= amount, "Your funds don't enough to deposit");
    accountUser[msg.sender].balanceOfToken[address(token)] += amount;
    token.transferFrom(msg.sender, owner, amount);
  }

  function getBalanceOf(address _account) public view returns (uint256) {
    return accountUser[_account].balanceOfToken[address(token)];
  }

  function _isReady() private view returns (bool) {
    return (block.timestamp >= accountUser[msg.sender].readyTime);
  }

  function _triggerCooldown() private {
    accountUser[msg.sender].readyTime = uint32(block.timestamp + timeCooldown);
  }

  function withdrawTokens(uint256 amount) public {
    require(_isReady(), 'The next withdrawal is not yet');
    require(amount <= limitWithdrawToken, 'Max amount one time');
    require(token.balanceOf(owner) >= amount, 'Wallet of owner is not enough token');
    require(accountUser[msg.sender].balanceOfToken[address(token)] >= amount, 'You are not enough funds to return');
    unchecked {
      accountUser[msg.sender].balanceOfToken[address(token)] -= amount;
    }
    _triggerCooldown();
    token.transferFrom(owner, msg.sender, amount);
  }
}
