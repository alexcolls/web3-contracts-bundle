// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
// const hre = require("hardhat")
const {ethers} = require("hardhat");
const VestingBasicArtifact = {
  "_format": "hh-sol-artifact-1",
  "contractName": "skfghkjsahgfjhkgasjhkfhjgk",
  "sourceName": "contracts/_mock/vestingcontract.sol",
  "abi": [{"inputs":[{"internalType":"address","name":"_vestingToken","type":"address"},{"internalType":"address","name":"_vestingCollector","type":"address"},{"internalType":"uint256","name":"_unlockTime","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"when","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawal","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"VESTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextVestingPeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"when","type":"uint256[]"},{"internalType":"uint256[]","name":"amount","type":"uint256[]"}],"name":"setVestingSchedule","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unlockTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_vestingCollector","type":"address"}],"name":"updateVestingCollector","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"vestingCollector","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"vestingSchedule","outputs":[{"internalType":"uint256","name":"when","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"vestingScheduleMaxLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"vestingToken","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}],
  "bytecode": "esdkjgfhjkhasdghjkasd",
  "deployedBytecode": "kghkasdhgkjahkjsghkjag",
  "linkReferences": {},
  "deployedLinkReferences": {}
};

const VESTING_CONTRACTS = [ // Constants - Thu Apr 13 2023 16:00:00 GMT+0200
  "0x5C3227A15a4917590f0Ea114652725D7030B5537", // Game
  "0xD5dcB7b469eF01283B41EFE468593a71BEee48D6", // Marketing
  "0x39cf1cdF5152e851C769Ee4B8c7fFF489B1B36cF", // KOLS
  // Constants - Tue Jun 13 2023 16:00:00 GMT+0200 - Private, developers
  "0x6f4FC00457CAfb8fFF19715A6E38D6Fc386B6857", // Private
  "0xb18771af81eFEd73911Bfe95389F0A28e946592d", // Developers
  // Constants - Fri Sep 13 2024 16:00:00 GMT+0200 - Reserve
  "0x8EEDd042caCE47963F52E9D2190c97Ab00F33f03", // Reserve
  // Constants - Wed Mar 13 2024 15:00:00 GMT+0100 - Team, advisors, Foundation
  "0x08E6D346cef70D8F680D520256B75ba504cCB942", // Team
  "0xA46E64D618475ff8379f152A03317a108a89fDd1", // Advisors
  "0x5a1A22Dd99AF1835042572436Fb24b13b05f0375" // Foundation
]


async function main() {
  // Create a new signer and provider
  const signer = new ethers.Wallet(process.env.VESTER_PRIVATE_KEY)
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER);
  let results = []

  // Executing transactions and saving results
  for (let i = 0; i < VESTING_CONTRACTS.length; i++) {

    try{

      console.log('Iteration: ' + VESTING_CONTRACTS[i])

      // Create a new instance of the contract using the provider
      let vestingBasic = new ethers.Contract(VESTING_CONTRACTS[i], VestingBasicArtifact.abi, provider);

      // Construct the transaction
      let nonce = await provider.getTransactionCount(signer.address);
      let gasPrice = await provider.getGasPrice();
      let gasLimit = await vestingBasic.estimateGas.withdraw({from: signer.address});
      let tx = {
        from: signer.address, // specify the sender
        to: vestingBasic.address,
        gasLimit,
        gasPrice,
        nonce: nonce + i,
        data: vestingBasic.interface.encodeFunctionData('withdraw'),
      };
      let signedTx = await signer.signTransaction(tx);
      let transactionResponse = await provider.sendTransaction(signedTx);
      console.log('Response: ' + transactionResponse)
      results.push(transactionResponse)
    }catch(e){
      console.log("ERROR: " + e)
    }
  }
  console.log(`VestingBasicWithdraw script executed:`, results)

}

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.performVestingsHTTP = (req, res) => {
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  let message = req.query.message || req.body.message || 'On it';

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

