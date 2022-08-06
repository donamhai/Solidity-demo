// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../interfaces/IBankMoney.sol';

contract BankMoney is Ownable, IBankMoney {
  ERC20 token;
  address private recieveWallet;
  uint256 private limitWithdrawToken;
  uint32 private timeCooldown;

  mapping(address => account) private accountUser;

  struct account {
    mapping(address => uint256) balanceOfToken;
    uint32 readyTime;
  }

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier CheckAmount(uint256 amount) {
    require(amount > 0, 'Please input amount greater than 0');
    _;
  }

  constructor(
    ERC20 tracker_0x_address,
    address _recieveWallet,
    uint256 _limitWithdrawToken,
    uint32 _timeCooldown
  ) {
    recieveWallet = _recieveWallet;
    token = ERC20(tracker_0x_address);
    limitWithdrawToken = _limitWithdrawToken;
    timeCooldown = _timeCooldown;
  }

  function getBalanceOf(address _account) external view returns (uint256) {
    return accountUser[_account].balanceOfToken[address(token)];
  }

  function getRecieveWallet() external view returns (address) {
    return recieveWallet;
  }

  function getlimitWithdraw() external view returns (uint256) {
    return limitWithdrawToken;
  }

  function getTimeCoolDown() external view returns (uint32) {
    return timeCooldown;
  }

  function setRecieveWallet(address _recieveWallet) external override CheckAddress(_recieveWallet) onlyOwner {
    recieveWallet = _recieveWallet;
  }

  function setLimitWithdraw(uint256 _limitWithdrawToken) external override onlyOwner {
    require(_limitWithdrawToken > 0, 'Limit Withdraw Token must be greater than 0');
    limitWithdrawToken = _limitWithdrawToken;
  }

  function setCooldownTime(uint32 _newCooldown) external override onlyOwner {
    require(_newCooldown > 0, 'Please input new cooldown time > 0');
    timeCooldown = _newCooldown;
  }

  function changeToken(address _addressToken) external override CheckAddress(_addressToken) onlyOwner {
    require(Address.isContract(_addressToken), 'You must input token address');
    token = ERC20(_addressToken);
  }

  function depositToken(uint256 amount) external override CheckAmount(amount) {
    require(token.balanceOf(msg.sender) >= amount, "Your funds don't enough to deposit");
    accountUser[msg.sender].balanceOfToken[address(token)] += amount;
    token.transferFrom(msg.sender, recieveWallet, amount);
    emit DepositTokenEvent(msg.sender, recieveWallet, amount, uint32(block.timestamp));
  }

  function withdrawToken(uint256 amount) external override CheckAmount(amount) {
    require(block.timestamp >= accountUser[msg.sender].readyTime, 'The next withdrawal is not yet');
    require(amount <= limitWithdrawToken, 'Max amount one time');
    require(token.balanceOf(recieveWallet) >= amount, 'Wallet of reciever is not enough token');
    require(accountUser[msg.sender].balanceOfToken[address(token)] >= amount, 'You are not enough funds to return');

    accountUser[msg.sender].balanceOfToken[address(token)] -= amount;
    accountUser[msg.sender].readyTime = uint32(block.timestamp + timeCooldown);
    token.transferFrom(recieveWallet, msg.sender, amount);
    emit WithdrawTokenEvent(recieveWallet, msg.sender, amount, uint32(block.timestamp));
  }
}
