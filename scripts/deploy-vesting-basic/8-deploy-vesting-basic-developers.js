// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");

// Constants
const VESTER_ROLE = "0x64ed6499e2f5a7ea55dfd56da361bf9d48064843bb3891c36f1dabd9ba246135"
const UNLOCK_TIME = 1689246000
const VESTING_SCHEDULE = {
  when: [
    1689246000, //07/13/2023 11:00:00 UTC
    1691924400, //08/13/2023 11:00:00 UTC
    1694602800, //09/13/2023 11:00:00 UTC
    1697194800, //10/13/2023 11:00:00 UTC
    1699873200, //11/13/2023 11:00:00 UTC
    1702465200, //12/13/2023 11:00:00 UTC
    1705143600, //01/13/2024 11:00:00 UTC
    1707822000, //02/13/2024 11:00:00 UTC
    1710327600, //03/13/2024 11:00:00 UTC
    1713006000, //04/13/2024 11:00:00 UTC
    1715598000, //05/13/2024 11:00:00 UTC
    1718276400, //06/13/2024 11:00:00 UTC
    1720868400, //07/13/2024 11:00:00 UTC
    1723546800, //08/13/2024 11:00:00 UTC
    1726225200, //09/13/2024 11:00:00 UTC
    1728817200, //10/13/2024 11:00:00 UTC
    1731495600, //11/13/2024 11:00:00 UTC
    1734087600, //12/13/2024 11:00:00 UTC
    1736766000, //01/13/2025 11:00:00 UTC
    1739444400, //02/13/2025 11:00:00 UTC
    1741863600, //03/13/2025 11:00:00 UTC
    1744542000, //04/13/2025 11:00:00 UTC
    1747134000, //05/13/2025 11:00:00 UTC
    1749812400, //06/13/2025 11:00:00 UTC
    1752404400, //07/13/2025 11:00:00 UTC
    1755082800, //08/13/2025 11:00:00 UTC
    1757761200, //09/13/2025 11:00:00 UTC
    1760353200, //10/13/2025 11:00:00 UTC
    1763031600, //11/13/2025 11:00:00 UTC
    1765623600, //12/13/2025 11:00:00 UTC
    1768302000, //01/13/2026 11:00:00 UTC
    1770980400, //02/13/2026 11:00:00 UTC
    1773399600, //03/13/2026 11:00:00 UTC
    1776078000, //04/13/2026 11:00:00 UTC
    1778670000, //05/13/2026 11:00:00 UTC
    1781348400, //06/13/2026 11:00:00 UTC
    1783940400, //07/13/2026 11:00:00 UTC
    1786618800, //08/13/2026 11:00:00 UTC
    1789297200, //09/13/2026 11:00:00 UTC
    1791889200, //10/13/2026 11:00:00 UTC
    1794567600, //11/13/2026 11:00:00 UTC
    1797159600, //12/13/2026 11:00:00 UTC
    1799838000, //01/13/2027 11:00:00 UTC
    1802516400, //02/13/2027 11:00:00 UTC
    1804935600, //03/13/2027 11:00:00 UTC
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

const GFAL_TOKEN = process.env.GFAL_TOKEN_MAINNET

async function main() {
  const vester = new ethers.Wallet(process.env.VESTER_PRIVATE_KEY_MAINNET)

  const VestingBasic = await hre.ethers.getContractFactory("VestingBasic")
  const vestingBasic = await VestingBasic.deploy(GFAL_TOKEN, vester.address, UNLOCK_TIME)

  await vestingBasic.deployed()

  // Executing functions

  let totalVestingAmount = ethers.utils.parseEther(String(0))
  for (let i = 0; i < VESTING_SCHEDULE.amount.length; i++) {
    totalVestingAmount = totalVestingAmount.add(VESTING_SCHEDULE.amount[i])
  }

  await vestingBasic.grantRole(VESTER_ROLE, vester.address)
  await vestingBasic.setVestingSchedule(VESTING_SCHEDULE.when, VESTING_SCHEDULE.amount)

  console.log(
    `VestingBasic "Developers" allocation deployed to ${vestingBasic.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
