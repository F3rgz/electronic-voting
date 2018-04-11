pragma solidity ^0.4.18;

contract Voting {

  /*  Firstly we'll declare structures by blackboxing
      between {Cadidates, Votes} we'll be able to define a secure
      communication path
  */
  // chairperson owns the contract
  address chairperson;
  string electionName;

  bool hasStarted = false;
  bool hasEnded = false;

  /* Structures */
  // Candidates are represented by the Candidate structures
  //
  struct Candidate {
   uint8 votesRecieved;
   bytes32 candidateName;
  }
  // Map of Candidate addresses to their struct
  mapping (bytes32 => Candidate) public candidates;
  // Array of all registered addresses
  bytes32[] public candidateAccounts;

  /* Voter */
  // Records a valid voter - whether they've voted or not
  struct Voter {
    bool hasVoted;
    address voterAddress;
  } // Voters are given an address (based on their private key) when registering to vote
    // this guarantees anonymity to voters. But not necessarrily concealing an addresses vote
  mapping (address => Voter) private voters;
  address[] private voterAccounts;

  /* Constructor
      Sets the contract owner to whoever instantiates it.
      The owner will be able to call an end to the election
  */
  function Voting() public {
    chairperson = msg.sender; // msg.sender : included in request messages - 'from'
  }
  /*
      SETTERS - Registering
  */
  function setElectionName(string newElectionName) isAdmin public {
    electionName = newElectionName;
  }
  function registerVoter(address newVoterAddress) isAdmin public {
    if (voters[newVoterAddress].hasVoted) return; // prevent overwrite if they've voted already

    var voter = voters[newVoterAddress]; // work directly with the record

    voter.hasVoted = false;
    voter.voterAddress = newVoterAddress;

    voterAccounts.push(newVoterAddress) -1;
  }
  function registerCandidate(bytes32 newCandidateName) isAdmin public {

    Candidate memory cand = Candidate(0, newCandidateName);
    candidates[newCandidateName] = cand;

    candidateAccounts.push(newCandidateName) -1;
  }

  /* GETTERS
  */
  // Get Election name
  function getElectionName() view public returns (string) {
    return electionName;
  }
  // Voter getters
  function getVoter(address _address) view public returns (bool, address) {
    return (voters[_address].hasVoted, voters[_address].voterAddress);
  }
  // Returns Array of voter addresses
  function getVoters() view public returns (address[]) {
    return voterAccounts;
  }
  // returns number of registered voters
  function getVoterCount() view public returns (uint) {
    return voterAccounts.length;
  }
  // Candidate GETTERS
  // return Candidate's fields
  function getCandidate(bytes32 _name) view public returns (uint, bytes32) {
    return (candidates[_name].votesRecieved, candidates[_name].candidateName);
  }
  function getCandidates() view public returns (bytes32[]) {
    return candidateAccounts;
  }
  function getCandidateCount() view public returns (uint) {
    return candidateAccounts.length;
  }

  /* VOTE COUNTING */
  function endElection() isAdmin public {
    hasEnded = true;
  }
  function getVoteCount(bytes32 candidate) isAdmin public constant returns (uint8) {
    var count = candidates[candidate].votesRecieved;
    return count;
  }

  /* VOTING */
  function voteForCandidate(bytes32 candidateName) hasntVoted public {
    //if (validCandidate(candidateName)) {
      candidates[candidateName].votesRecieved += 1;
      hasStarted = true;
    //}
  }

  /* Voting Helpers */
  function candidateDoesNotExist(bytes32 candidate) view public returns (bool) {
    for(uint i = 0; i < candidateAccounts.length; i++) {
      if (candidates[candidate].candidateName == candidate) {
        return false;
      }
    }
    return true;
  }
  function validCandidate(bytes32 candidate) view public returns (bool) {
    for(uint i = 0; i < candidateAccounts.length; i++) {
      if (candidates[candidate].candidateName == candidate) {
        return true;
      }
    }
    return false;
  }
  /*    Modifiers:
        isAdmin: requires message sender to be the chairperson
  */
  modifier isAdmin {
    require(msg.sender == chairperson);
    _;
  }
  modifier hasntVoted() {
    require(voters[msg.sender].hasVoted == false);
    _;
  }


  // This function increments the vote count for the specified candidate. This
  // is equivalent to casting a vote





  // TODO:
  /*
      require(ValidVoter(msg.sender))

   */
   // Helpers :
   function getAdminAddress() view public returns (address) {
     return chairperson;
   }
}
