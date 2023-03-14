// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");
const GFALTokenArtifact = require("../../artifacts/contracts/_mock/GFALToken.sol/GFALToken.json");

// Constants
const VESTING_CONTRACTS = [
  "0x08E6D346cef70D8F680D520256B75ba504cCB942", // Team
  "0x8EEDd042caCE47963F52E9D2190c97Ab00F33f03", // Reserve
  "0x5C3227A15a4917590f0Ea114652725D7030B5537", // Game
  "0xD5dcB7b469eF01283B41EFE468593a71BEee48D6", // Marketing
  "0x5a1A22Dd99AF1835042572436Fb24b13b05f0375", // Foundation
  "0x6f4FC00457CAfb8fFF19715A6E38D6Fc386B6857", // Private
  "0xA46E64D618475ff8379f152A03317a108a89fDd1", // Advisors
  "0x39cf1cdF5152e851C769Ee4B8c7fFF489B1B36cF", // KOLS
  "0xb18771af81eFEd73911Bfe95389F0A28e946592d", // Developers
]

async function main() {
  // Create a new signer and provider
  const signer = new ethers.Wallet(process.env.VESTER_PRIVATE_KEY_MAINNET)
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER);

  // Executing transactions and saving results
  let results = []
  for (let i = 0; i < VESTING_CONTRACTS.length; i++) {
    console.log('Iteration: '+VESTING_CONTRACTS[i])

    // Create a new instance of the contract using the provider
    const vestingBasic = new ethers.Contract(VESTING_CONTRACTS[i], GFALTokenArtifact.abi, provider);

    // Construct the transaction
    const nonce = await provider.getTransactionCount(signer.address);
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await vestingBasic.estimateGas.withdraw({from: signer.address});
    const tx = {
      from: signer.address, // specify the sender
      to: vestingBasic.address,
      gasLimit,
      gasPrice,
      nonce: nonce + i,
      data: vestingBasic.interface.encodeFunctionData('withdraw'),
    };
    const signedTx = await signer.signTransaction(tx);
    const transactionResponse = await provider.sendTransaction(signedTx);
    results.push(transactionResponse)
  }

  console.log(
    `VestingBasicWithdraw script executed:`,
    results
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
