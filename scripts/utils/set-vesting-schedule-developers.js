// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");
const DeployVestingUtils = require("../deploy-vesting-basic/_deploy_vesting_utils");

const VBArtifact = require('../../artifacts/contracts/vestings/VestingBasic.sol/VestingBasic.json')
// Constants
const VESTING_SCHEDULE = {
  when: [
    1686664800, //06/13/2023 14:00:00 UTC
    1689256800, //07/13/2023 14:00:00 UTC
    1691935200, //08/13/2023 14:00:00 UTC
    1694613600, //09/13/2023 14:00:00 UTC
    1697205600, //10/13/2023 14:00:00 UTC
    1699884000, //11/13/2023 14:00:00 UTC
    1702476000, //12/13/2023 14:00:00 UTC
    1705154400, //01/13/2024 14:00:00 UTC
    1707832800, //02/13/2024 14:00:00 UTC
    1710338400, //03/13/2024 14:00:00 UTC
    1713016800, //04/13/2024 14:00:00 UTC
    1715608800, //05/13/2024 14:00:00 UTC
    1718287200, //06/13/2024 14:00:00 UTC
    1720879200, //07/13/2024 14:00:00 UTC
    1723557600, //08/13/2024 14:00:00 UTC
    1726236000, //09/13/2024 14:00:00 UTC
    1728828000, //10/13/2024 14:00:00 UTC
    1731506400, //11/13/2024 14:00:00 UTC
    1734098400, //12/13/2024 14:00:00 UTC
    1736776800, //01/13/2025 14:00:00 UTC
    1739455200, //02/13/2025 14:00:00 UTC
    1741874400, //03/13/2025 14:00:00 UTC
    1744552800, //04/13/2025 14:00:00 UTC
    1747144800, //05/13/2025 14:00:00 UTC
    1749823200, //06/13/2025 14:00:00 UTC
    1752415200, //07/13/2025 14:00:00 UTC
    1755093600, //08/13/2025 14:00:00 UTC
    1757772000, //09/13/2025 14:00:00 UTC
    1760364000, //10/13/2025 14:00:00 UTC
    1763042400, //11/13/2025 14:00:00 UTC
    1765634400, //12/13/2025 14:00:00 UTC
    1768312800, //01/13/2026 14:00:00 UTC
    1770991200, //02/13/2026 14:00:00 UTC
    1773410400, //03/13/2026 14:00:00 UTC
    1776088800, //04/13/2026 14:00:00 UTC
    1778680800, //05/13/2026 14:00:00 UTC
    1781359200, //06/13/2026 14:00:00 UTC
    1783951200, //07/13/2026 14:00:00 UTC
    1786629600, //08/13/2026 14:00:00 UTC
    1789308000, //09/13/2026 14:00:00 UTC
    1791900000, //10/13/2026 14:00:00 UTC
    1794578400, //11/13/2026 14:00:00 UTC
    1797170400, //12/13/2026 14:00:00 UTC
    1799848800, //01/13/2027 14:00:00 UTC
    1802527200, //02/13/2027 14:00:00 UTC
  ],
  amount: [
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111111)),
    ethers.utils.parseEther(String(11111116)),
  ]
}
const VB_ADDR = "0xb18771af81eFEd73911Bfe95389F0A28e946592d"

async function main() {
  // Create a new provider
  let provider = new ethers.providers.JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER);

  // Create a new instance of the contract using the provider
  const vestingBasic = new ethers.Contract(VB_ADDR, VBArtifact.abi, provider);

  // Validate correct length of arrays
  if (VESTING_SCHEDULE.when.length !== VESTING_SCHEDULE.amount.length) {
    throw Error('Array lengths mismatch')
  }

  // Sender from private key
  const signer = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY)
  const nonce = await provider.getTransactionCount(signer.address);


  let vestingExecutions = DeployVestingUtils.splitVestingSchedule(VESTING_SCHEDULE.when, VESTING_SCHEDULE.amount)
  // Iterate through each batch and call setVestingSchedules() function
  let results = []
  for (let i = 0; i < vestingExecutions.length; i++) {
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await vestingBasic.estimateGas.setVestingSchedule(vestingExecutions[i].when, vestingExecutions[i].amount, {from: signer.address});

    // Construct the transaction
    const tx = {
      from: signer.address, // specify the sender
      to: vestingBasic.address,
      gasLimit,
      gasPrice,
      nonce: nonce + i,
      data: vestingBasic.interface.encodeFunctionData('setVestingSchedule', [vestingExecutions[i].when, vestingExecutions[i].amount]),
    };
    const signedTx = await signer.signTransaction(tx);
    const transactionResponse = await provider.sendTransaction(signedTx);
    results.push(transactionResponse)
  }

  console.log(
    `SetVestingScheduleDevelopers script executed:`,
    results
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
