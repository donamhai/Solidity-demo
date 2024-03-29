// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/AccessControl.sol';

contract AccessController is AccessControl {
  bytes32 public constant OPERATOR1 = keccak256('OPERATOR1');
  bytes32 public constant OPERATOR2 = keccak256('OPERATOR2');
  bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 'Not admin');
    _;
  }

  modifier onlyOperator1() {
    require(hasRole(OPERATOR1, _msgSender()), 'Caller is not the operator1');
    _;
  }

  function addOperator1(address _operator) external onlyAdmin {
    _setupRole(OPERATOR1, _operator);
  }

  function removeOperator1(address _operator) external onlyAdmin {
    revokeRole(OPERATOR1, _operator);
  }

  modifier onlyOperator2() {
    require(hasRole(OPERATOR1, _msgSender()), 'Caller is not the operator2');
    _;
  }

  function addOperator2(address _operator) external onlyAdmin {
    _setupRole(OPERATOR1, _operator);
  }

  function removeOperator2(address _operator) external onlyAdmin {
    revokeRole(OPERATOR1, _operator);
  }
}
