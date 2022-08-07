// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IBankMoney {
  event DepositTokenEvent(address from, address to, uint256 amount, uint32 timeDeposit);
  event TransferTokenEvent(address from, address to, uint256 amount, uint32 timeTransfer);
  event WithdrawTokenEvent(address from, address to, uint256 amount, uint32 timeWithdraw);

  function setRecieveWallet(address _recieveWallet) external;

  function setLimitWithdraw(uint256 _limitWithdrawToken) external;

  function setCooldownTime(uint32 _newCooldown) external;

  function changeToken(address _addressToken) external;

  function depositToken(uint256 amount) external;

  function transferToken(uint256 amount, address to) external;

  function withdrawToken(uint256 amount) external;
}
