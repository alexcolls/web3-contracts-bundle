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
    "0x977817a1fdde5c74d8a9201c1d2bd52664a4a1ed", //Bitget (Airdrop)
  ],
  amount: [
    ethers.utils.parseEther(String(15000)),
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
