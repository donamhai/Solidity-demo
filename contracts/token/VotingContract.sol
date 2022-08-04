// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '../interfaces/IVotingContract.sol';

contract VotingContract is Ownable, IVotingContract {
  using Counters for Counters.Counter;
  Counters.Counter public voteIdCount;

  struct voter {
    string voterName;
    mapping(uint256 => bool) voted;
    bool added;
  }

  struct VoteProposal {
    address chairman;
    string title;
    uint256 totalVote;
    uint32 startTime;
    uint32 endTime;
  }
  mapping(uint256 => VoteProposal) public voteProposalOfId;
  mapping(address => voter) public voterRegister;
  uint256 public totalVoter;
  uint32 public timeVote;

  modifier CheckAddress(address _address) {
    require(_address != address(0), 'Address can not be zero address');
    _;
  }

  modifier checkVoteId(uint256 voteId) {
    require(voteId > 0, 'Vote id must be greater than 0');
    _;
  }

  function setTimeVote(uint32 _newTime) external onlyOwner {
    require(_newTime > 0, 'Please input new time > 0');
    timeVote = _newTime;
  }

  function getOwnerOfProposal(uint256 _voteId) external view returns (address) {
    return voteProposalOfId[_voteId].chairman;
  }

  constructor(uint32 _timeVote) {
    timeVote = _timeVote;
    addVoter(msg.sender, 'HaiDN');
  }

  function addVoter(address _voterAddress, string memory _voterName)
    public
    override
    CheckAddress(_voterAddress)
    onlyOwner
  {
    require(voterRegister[_voterAddress].added == false, 'Voter is added in group vote');
    require(bytes(_voterName).length > 0, 'Please input voter name');
    voterRegister[_voterAddress].voterName = _voterName;
    voterRegister[_voterAddress].added = true;
    totalVoter++;
    emit AddVoterEvent(_voterAddress, _voterName);
  }

  function removeVoter(address _voterAddress) external override CheckAddress(_voterAddress) onlyOwner {
    require(voterRegister[_voterAddress].added == true, 'Voter is not include in group vote');
    require(totalVoter >= 1, 'totalVoter = 0, can not remove voter');
    delete voterRegister[_voterAddress];
    totalVoter--;
    emit RemoveVoterEvent(_voterAddress);
  }

  function addProposal(string memory _title) external override {
    require(voterRegister[msg.sender].added == true, 'You are not include in group vote');
    require(bytes(_title).length > 0, 'Please input your title proposal');
    voteIdCount.increment();
    uint256 voteId = voteIdCount.current();
    VoteProposal storage _vote = voteProposalOfId[voteId];
    _vote.chairman = msg.sender;
    _vote.totalVote = 1;
    _vote.title = _title;
    _vote.startTime = uint32(block.timestamp);
    _vote.endTime = uint32(block.timestamp + timeVote);
    emit addProposalEvent(msg.sender, voteId, _title, uint32(block.timestamp), timeVote);
  }

  function cancelProposal(uint256 _voteId) external override checkVoteId(_voteId) {
    require(voteProposalOfId[_voteId].chairman == msg.sender, 'You are not owner of this proposal');
    require(voteProposalOfId[_voteId].endTime > block.timestamp, 'End time, can not cancel');
    delete voteProposalOfId[_voteId];
  }

  function doVote(uint256 _voteId) external override checkVoteId(_voteId) {
    require(voterRegister[msg.sender].added == true, 'You are not include in group vote');
    require(!voterRegister[msg.sender].voted[_voteId], 'You voted this proposal, can vote more');
    require(voteProposalOfId[_voteId].endTime > block.timestamp, 'End time, can not vote');

    VoteProposal storage _vote = voteProposalOfId[_voteId];
    _vote.totalVote++;
    voterRegister[msg.sender].voted[_voteId] = true;
  }

  function endVote(uint256 _voteId) external view override checkVoteId(_voteId) returns (uint16) {
    require(voteProposalOfId[_voteId].chairman == msg.sender, 'You are not owner of this proposal');
    require(voteProposalOfId[_voteId].endTime <= block.timestamp, 'Not end time to close vote');
    uint16 persentageVote = uint16((voteProposalOfId[_voteId].totalVote * 100) / totalVoter);
    return persentageVote;
  }

  function destructProposal(uint256 _voteId) external override onlyOwner checkVoteId(_voteId) {
    delete voteProposalOfId[_voteId];
  }
}
