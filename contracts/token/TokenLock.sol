// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract TokenLock is Ownable {
  IERC20 public token;
  uint256 public unlockTime;

  constructor(address _tokenAddress) {
    token = IERC20(_tokenAddress);
    unlockTime = block.timestamp + 24 weeks;
  }

  modifier checkTimestamp() {
    require(block.timestamp > unlockTime, 'Reserve: Can not trade');
    _;
  }

  function withdrawTo(address _to, uint256 _value) public onlyOwner checkTimestamp {
    require(_to != address(0), 'Reserve: transfer to zero address');
    require(token.balanceOf(address(this)) >= _value, ' Reserve: exceeds contract balance');
    token.transfer(_to, _value);
  }
}
