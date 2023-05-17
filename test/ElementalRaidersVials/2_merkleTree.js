const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const wallet2 = keccak256("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

const leaves = [
  "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
  "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C",
  "0x583031D1113aD414F02576BD6afaBfb302140225",
  "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
  "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C",
  "0x583031D1113aD414F02576BD6afaBfb302140225",
  "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
  "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C",
  "0x583031D1113aD414F02576BD6afaBfb302140225",
  "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
  "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C",
  "0x583031D1113aD414F02576BD6afaBfb302140225",
  "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
  "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C",
  "0x583031D1113aD414F02576BD6afaBfb302140225",
  "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7",
  "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
  "0x5c6B0f7Bf3E7ce046039Bd8FABdfD3f9F5021678",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c",
  "0x14723A09ACff6D2A60DcdF7aA4AFf308FDDC160C",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // user Public key
];

// Create Root.
const tree = new MerkleTree(leaves, keccak256, {
  /** If set to `true`, the leaves will hashed using the set hashing algorithms. */
  hashLeaves: true,
  /** If set to `true`, the hashing pairs will be sorted. */
  sortPairs: true,
});

const root2 = tree.getHexRoot();
// console.log(`\n- Merkle tree root`, root2);

// Get Proof from the root hash
const proof = tree.getHexProof(wallet2);
//Solidity needs it to have " double quotes" instead of `single quotes`
const proofFormated2 = proof.map(function (element) {
  return element.replace(/'/g, '"');
});

// console.log(`\n- Proof is:`, proofFormated2);

module.exports = { proofFormated2, root2, wallet2 };
