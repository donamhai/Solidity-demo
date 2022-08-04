// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface IVotingContract {
  event AddVoterEvent(address voterAddress, string voterName);
  event RemoveVoterEvent(address voterAddress);
  event addProposalEvent(address chairman, uint256 voteOrderId, string title, uint32 startTime, uint32 timeVote);
  event cancelProposalEvent(address chairman, uint256 voteOrderId, uint32 timeCancel);
  event DoVoteEvent(address Voter, uint256 voteOrderId, uint32 timeVote);
  event EndVoteEvent(uint256 voteOrderId, uint256 totalVote, uint256 persentageVote, uint32 endTime);
  event destructProposalEvent(uint256 voteOrderId, uint32 timeRemove);

  function addVoter(address _voterAddress, string memory _voterName) external;

  function removeVoter(address _voterAddress) external;

  function addProposal(string memory _title) external;

  function cancelProposal(uint256 _voteId) external;

  function doVote(uint256 _voteId) external;

  function endVote(uint256 _voteId) external returns (uint16);

  function destructProposal(uint256 _voteId) external;
}
