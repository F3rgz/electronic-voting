import '../css/index.css'

var Web3 = require('web3') // Grab Web3 library as Object
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))

console.log('Version:', web3.version.api)
console.log('starting ...')

if (!web3.isConnected()) {
   // show some dialog to ask the user to start a node
  console.log('Node not running')
} else {
  console.log('Node Running')
}

console.log(web3.eth.accounts)
var accounts = web3.eth.accounts

web3.eth.defaultAccount = web3.eth.accounts[0]

var electionState = {
  electionStarted: false
}
var registeredVoters = {}
var candidateList = []
var candidateListStr = []
var ballotSubmitArray
// const jsonFile = '/build/contracts/Voting.json'
// var truffleFile = require(jsonFile)
//
// var abi = truffleFile['abi']
// var bytecode = truffleFile['bytecode']

import json from '../../build/contracts/Voting.json'
// import bytecode from '../../build/contracts/Voting.json'
//
var abi = json['abi']
var bytecode = json['bytecode']

var VotingContract = web3.eth.contract(abi)

var deployedContract = VotingContract.new({ data: bytecode, from: accounts[0], gas: 4700000 },
  function (error, contract) {
    if (!error) {
      if (!contract.address) {
        console.log('Sending transaction to local blockchain. TransactionHash: ' +
                          contract.transactionHash + ' is waiting to be mined ...')
      } else {
        console.log('Contract has been mined at address: ' + contract.address)
        return contract
      }
    } else {
      console.log(error)
      return null
    }
  })
/* START ELECTION */
function startElection () {
  var electionName = deployedContract.getElectionName({ from: web3.eth.accounts[0], gas: 4700000 })
  var numCandidates = deployedContract.getCandidateCount({ from: web3.eth.accounts[0], gas: 4700000 }).toString()
  var numVoters = deployedContract.getVoterCount({ from: web3.eth.accounts[0], gas: 4700000 }).toString()
  candidateList = deployedContract.getCandidates({ from: web3.eth.accounts[0], gas: 4700000 })
  // Set for injecting into HTML
  var electionNamestr = 'Election Name: ' + electionName
  var numCandidatesStr = 'Number of Candidates: ' + numCandidates
  var numVotersStr = 'Number of elegible Voters: ' + numVoters
  console.log(electionNamestr)
  console.log(numCandidatesStr)
  console.log(numVotersStr)
  console.log('Candidates:')
  for (var candidate in candidateList) {
    console.log(web3.toAscii(candidateList[candidate]))
    candidateListStr[candidate] = web3.toAscii(candidateList[candidate]).replace(/\u0000/g, '') // remove whitespace
  }
  console.log(candidateListStr)
  // Set inner html
  document.getElementById('elec-name').innerHTML = electionNamestr
  document.getElementById('elec-num-candidates').innerHTML = numCandidatesStr
  document.getElementById('elec-num-voters').innerHTML = numVotersStr

  generateBallots()
}
document.getElementById('start-election').onclick = function (event) {
  event.preventDefault()
  startElection()
}

// ELECTION RESULTS
function getElectionResults () {
  deployedContract.endElection({ from: accounts[0], gas: 4700000 })
  var result1 = deployedContract.getVoteCount(candidateList[0], { from: accounts[0], gas: 4700000 }).toString()
  var result2 = deployedContract.getVoteCount(candidateList[1], { from: accounts[0], gas: 4700000 }).toString()
  // result1 = web3.toAscii(result1)
  // result2 = web3.toAscii(result2)
  console.log(result1)
  console.log(result2)

  var res1Str = 'Candidate \'' + candidateListStr[0] + '\'recieved ' + result1 + ' votes.'
  var res2Str = 'Candidate \'' + candidateListStr[1] + '\'recieved ' + result2 + ' votes.'

  var resultsDiv = document.getElementById('election-results')

  var p1 = document.getElementById('res1')
  p1.innerHTML = res1Str

  var p2 = document.getElementById('res2')
  p2.innerHTML = res2Str
}
document.getElementById('end-election').onclick = function (event) {
  event.preventDefault()
  getElectionResults()
}

// GENERATE VOTER BALLOTS
function generateBallots () {
  // Grab ballot section to append ballots
  var ballotSection = document.getElementById('ballot-section')
  // Create a ballot for each voter
  for (var voter in registeredVoters) {
    var ballotDiv = document.createElement('div')
    ballotDiv.setAttribute('class', 'col s11 card blue-grey darken-1 ballot')

    var ballotText = ('<p class="ballot-title">Voter ID: ' + voter + '</p>' +
                      '<p class="form-label">Voter Address: ' + registeredVoters[voter] + '</p>')
    ballotDiv.innerHTML = ballotText

    var formHTML = document.createElement('form')
    formHTML.setAttribute('class', 'ballot-form')
    formHTML.setAttribute('id', 'ballot-' + voter)
    ballotDiv.appendChild(formHTML)

    // create a radio button for each candidate
    for (var cand in candidateListStr) {
      var radio = document.createElement('input')
      radio.setAttribute('type', 'radio')
      radio.setAttribute('name', 'candidate')
      radio.setAttribute('value', cand)
      formHTML.appendChild(radio)
      // label
      var label = document.createElement('label')
      label.setAttribute('for', candidateListStr[cand])
      label.innerHTML = candidateListStr[cand]
      formHTML.appendChild(label)
    }
    var hidden = document.createElement('input')
    hidden.setAttribute('value', registeredVoters[voter])
    hidden.setAttribute('type', 'hidden')
    hidden.setAttribute('name', 'voterAddress')
    hidden.setAttribute('id', 'voterAddress')
    formHTML.appendChild(hidden)

    var submit = document.createElement('input')
    submit.setAttribute('type', 'submit')
    submit.setAttribute('class', 'submitVote')

    formHTML.appendChild(submit)

    ballotSection.appendChild(ballotDiv)
  }
  // Add event listeners
  var formVar = document.getElementById('ballot-0')
  formVar.onsubmit = function (e) {
    e.preventDefault()
    console.log(formVar.childNodes)
    var nodes = formVar.childNodes
    var chosenCand
    if (nodes[0].checked) {
      chosenCand = candidateList[0]
    }
    if (nodes[2].checked) {
      chosenCand = candidateList[1]
    }
    var voterAddr = nodes[4].value
    console.log(voterAddr)

    voteForCandidate(chosenCand, accounts[0])
  }
  var formVar1 = document.getElementById('ballot-1')
  formVar1.onsubmit = function (e) {
    e.preventDefault()
    console.log(formVar1.childNodes)
    var nodes = formVar1.childNodes
    var chosenCand
    if (nodes[0].checked) {
      chosenCand = candidateList[0]
    }
    if (nodes[2].checked) {
      chosenCand = candidateList[1]
    }
    var voterAddr = nodes[4].value
    console.log('Casting vote:')
    console.log(chosenCand)
    console.log(voterAddr)

    voteForCandidate(chosenCand, accounts[1])
  }
  var formVa2 = document.getElementById('ballot-2')
  formVa2.onsubmit = function (e) {
    e.preventDefault()
    console.log(formVa2.childNodes)
    var nodes = formVa2.childNodes
    var chosenCand
    if (nodes[0].checked) {
      chosenCand = candidateList[0]
    }
    if (nodes[2].checked) {
      chosenCand = candidateList[1]
    }
    var voterAddr = nodes[4].value
    console.log('Casting vote:')
    console.log(chosenCand)
    console.log(voterAddr)

    voteForCandidate(chosenCand, accounts[2])
  }
  var formVar3 = document.getElementById('ballot-3')
  formVar3.onsubmit = function (e) {
    e.preventDefault()
    console.log(formVar3.childNodes)
    var nodes = formVar3.childNodes
    var chosenCand
    if (nodes[0].checked) {
      chosenCand = candidateList[0]
    }
    if (nodes[2].checked) {
      chosenCand = candidateList[1]
    }
    var voterAddr = nodes[4].value
    console.log('Casting vote:')
    console.log(chosenCand)
    console.log(voterAddr)

    voteForCandidate(chosenCand, accounts[3])
  }
  var formVar4 = document.getElementById('ballot-4')
  formVar4.onsubmit = function (e) {
    e.preventDefault()
    console.log(formVar4.childNodes)
    var nodes = formVar4.childNodes
    var chosenCand
    if (nodes[0].checked) {
      chosenCand = candidateList[0]
    }
    if (nodes[2].checked) {
      chosenCand = candidateList[1]
    }
    var voterAddr = nodes[4].value
    console.log('Casting vote:')
    console.log(chosenCand)
    console.log(voterAddr)

    voteForCandidate(chosenCand, accounts[4])
  }
}

// SubmitBallot function for interacting with Blockchain
function voteForCandidate (candidateName, account) {
  console.log('voting')
  deployedContract.voteForCandidate(candidateName, { from: account, gas: 4700000 },
    function (error, result) {
      if (error) {
        console.log(error)
      } else {
        console.log("Voted for candidate contract hash:")
        console.log(result)
      }
    })
}
/* function: setName; Sets the Elections Name Attribute */
function setName (instance, elecName) {
  instance.setElectionName(elecName, { from: web3.eth.accounts[0], gas: 4700000 },
    function (error, result) {
      if (error) {
        console.log(error)
        return null
      } else {
        console.log(result)
        return result
      }
    })
}
// add event listener
document.getElementById('setName').onclick = function (event) {
  event.preventDefault()
  var elecName = document.getElementById('set-name-field').value

  console.log('Setting Election name to: ' + elecName)
  setName(deployedContract, elecName)
}

/* ADD CANDIDATES */
function addCandidate () {
  var candidateName = document.getElementById('candidate-field').value
  console.log(candidateName)
  deployedContract.registerCandidate(candidateName, { from: accounts[0], gas: 4700000 },
    function (error, result) {
      if (error) {
        console.log(error)
      } else {
        console.log(result)
      }
    })
}
document.getElementById('addCandidate').onclick = function (event) {
  event.preventDefault()
  addCandidate()
}
/* GENERATE ADD VOTER SECTION */
function generateAddVoter () {
  console.log('genvoters')
  var voterSelect = document.getElementById('voter-select')
  for (var i = 0; i < accounts.length; i++) {
    console.log('account: ' + accounts[i])
    // create div
    var div = document.createElement('div')
    div.setAttribute('class', 'col s11 checkbox-container')
    voterSelect.appendChild(div)
    // create checkbox
    var checkbox = document.createElement('input')
    checkbox.setAttribute('type', 'checkbox')
    checkbox.setAttribute('name', 'check' + i)
    checkbox.setAttribute('id', 'check' + i)
    checkbox.setAttribute('class', 'voterCheck')
    checkbox.setAttribute('value', accounts[i])
    checkbox.checked = false
    div.appendChild(checkbox)
    // create label
    var newlabel = document.createElement('label')
    newlabel.setAttribute('for', 'check' + i)
    newlabel.innerHTML = accounts[i]
    div.appendChild(newlabel)
  }
}
document.getElementById('genVoters').onclick = function (event) {
  event.preventDefault()
  generateAddVoter()
}
// Select All Checkboxes
document.getElementById('select-all').onclick = function (event) {
  event.preventDefault()
  var checkboxes = document.getElementsByClassName('voterCheck')
  for (var i = 0, n = checkboxes.length; i < n; i++) {
    checkboxes[i].checked = true
  }
}
// Submit checked voters
document.getElementById('submit-voters').onclick = function (event) {
  event.preventDefault()
  var checkboxes = document.getElementsByClassName('voterCheck')
  for (var i = 0, n = checkboxes.length; i < n; i++) {
    if (checkboxes[i].checked === true) {
      registeredVoters[i] = accounts[i]
      deployedContract.registerVoter(registeredVoters[i], { from: accounts[0], gas: 4700000 },
        function (error, result) {
          if (error) {
            console.log(error)
          } else {
            console.log(result)
          }
        })
    }
  }
  console.log(registeredVoters)
}
// function addVoter (deployedContract, address) {
//   deployedContract.methods.registerVoter('0xf17f52151EbEF6C7334FAD080c5704D77216b732')
//   .call({ from: accounts[0] }, function (error, result) {
//     if (error) {
//       console.log(error)
//     }
//   })
// }
