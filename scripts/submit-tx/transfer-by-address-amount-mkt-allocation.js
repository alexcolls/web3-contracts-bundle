// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
//const hre = require("hardhat")
const {ethers} = require("hardhat");

//const GFALTokenArtifact = require('./GFALToken.json')
const GFALTokenArtifact = {
  "_format": "hh-sol-artifact-1",
  "contractName": "skfghkjsahgfjhkgasjhkfhjgk",
  "sourceName": "contracts/_mock/GFALTokenArtifact.sol",
  "abi": [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}],
  "bytecode": "esdkjgfhjkhasdghjkasd",
  "deployedBytecode": "kghkasdhgkjahkjsghkjag",
  "linkReferences": {},
  "deployedLinkReferences": {}
};

// Constants
const TRANSFERS_PAYLOAD = {
  address: [
    "0x63fd2851D4B6d7855d35e7E88fC0324C256E72b5", //Toad (moderator)
    "0x7712766e970C91Ea6031f2A0ebFec66554FC83c3", //Mada (moderator)
    "0x8B59D0F2a5E26702CeADD609609A4b043b58338a", //Skizo (moderator)
    "0x2Ea537ae9955acECFf13BB6e9144bF6E871669a2", //Dverse (Feb)
    "0x2Ea537ae9955acECFf13BB6e9144bF6E871669a2", //Dverse (Trip interview)
    "0xC7618E69F6cBECf2d3926D02DCC8357A7fdB27eF", //Lach (mkt contractor)
  ],
  amount: [
    ethers.utils.parseEther(String(50000)),
    ethers.utils.parseEther(String(50000)),
    ethers.utils.parseEther(String(50000)),
    ethers.utils.parseEther(String(160000)),
    ethers.utils.parseEther(String(240000)),
    ethers.utils.parseEther(String(100000)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET


async function main() {
  // Create a new provider
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER_MAIN);

  // Create a new instance of the contract using the provider
  const gfalToken = new ethers.Contract(GFAL_TOKEN, GFALTokenArtifact.abi, provider);

  // Validate correct length of arrays
  if (TRANSFERS_PAYLOAD.address.length !== TRANSFERS_PAYLOAD.amount.length) {
    throw Error('Array lengths mismatch')
  }

  // Sender from private key
  const signer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY)
  const nonce = await provider.getTransactionCount(signer.address);

  // Executing transactions and saving results
  let results = []
  for (let i = 0; i < TRANSFERS_PAYLOAD.address.length; i++) {
    let gasPrice = await provider.getGasPrice();
    let gasLimit = await gfalToken.estimateGas.transfer(TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i], {from: signer.address});

    // Construct the transaction
    let tx = {
      from: signer.address, // specify the sender
      to: gfalToken.address,
      gasLimit,
      gasPrice,
      nonce: nonce + i,
      data: gfalToken.interface.encodeFunctionData('transfer', [TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i]]),
    };
    let signedTx = await signer.signTransaction(tx);
    let transactionResponse = await provider.sendTransaction(signedTx);
    results.push(transactionResponse)
  }

  console.log(
      `TransferByAddressAmountMarketplace script executed:`,
      results
  )
}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.performTransferByAddressAmountMktAllocationHTTP = (req, res) => {
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  let message = req.query.message || req.body.message || 'On it - ';

  main().catch((error) => {
    let message = error.message;
    console.error(error);
    process.exitCode = 1;
  })
  res.status(200).send(message);
}

const local = false;
if(local) {
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
