// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");

const GFALTokenArtifact = require('../../artifacts/contracts/_mock/GFALToken.sol/GFALToken.json')
// Constants
const TRANSFERS_PAYLOAD = {
  address: [
    "0x63fd2851D4B6d7855d35e7E88fC0324C256E72b5", //Toad (moderator)
    "0x7712766e970C91Ea6031f2A0ebFec66554FC83c3", //Mada (moderator)
    "0x8B59D0F2a5E26702CeADD609609A4b043b58338a", //Skizo (moderator)
    "0x2Ea537ae9955acECFf13BB6e9144bF6E871669a2", //Dverse (Feb)
    "0x2Ea537ae9955acECFf13BB6e9144bF6E871669a2", //Dverse (Trip interview)
  ],
  amount: [
    ethers.utils.parseEther(String(50000)),
    ethers.utils.parseEther(String(50000)),
    ethers.utils.parseEther(String(50000)),
    ethers.utils.parseEther(String(160000)),
    ethers.utils.parseEther(String(240000)),
  ]
}

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET

async function main() {
  // Create a new provider
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER);

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
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await gfalToken.estimateGas.transfer(TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i], {from: signer.address});

    // Construct the transaction
    const tx = {
      from: signer.address, // specify the sender
      to: gfalToken.address,
      gasLimit,
      gasPrice,
      nonce: nonce + i,
      data: gfalToken.interface.encodeFunctionData('transfer', [TRANSFERS_PAYLOAD.address[i], TRANSFERS_PAYLOAD.amount[i]]),
    };
    const signedTx = await signer.signTransaction(tx);
    const transactionResponse = await provider.sendTransaction(signedTx);
    results.push(transactionResponse)
  }

  console.log(
    `TransferByAddressAmountMarketplace script executed:`,
    results
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
