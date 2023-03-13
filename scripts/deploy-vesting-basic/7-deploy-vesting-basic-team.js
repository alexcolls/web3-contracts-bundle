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
const UNLOCK_TIME = 1713006000
const VESTING_SCHEDULE = {
  when: [
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
    1807614000, //04/13/2027 11:00:00 UTC
    1810206000, //05/13/2027 11:00:00 UTC
    1812884400, //06/13/2027 11:00:00 UTC
    1815476400, //07/13/2027 11:00:00 UTC
    1818154800, //08/13/2027 11:00:00 UTC
    1820833200, //09/13/2027 11:00:00 UTC
    1823425200, //10/13/2027 11:00:00 UTC
    1826103600, //11/13/2027 11:00:00 UTC
    1828695600, //12/13/2027 11:00:00 UTC
    1831374000, //01/13/2028 11:00:00 UTC
    1834052400, //02/13/2028 11:00:00 UTC
    1836558000, //03/13/2028 11:00:00 UTC
    1839236400, //04/13/2028 11:00:00 UTC
    1841828400, //05/13/2028 11:00:00 UTC
    1844506800, //06/13/2028 11:00:00 UTC
    1847098800, //07/13/2028 11:00:00 UTC
    1849777200, //08/13/2028 11:00:00 UTC
    1852455600, //09/13/2028 11:00:00 UTC
    1855047600, //10/13/2028 11:00:00 UTC
    1857726000, //11/13/2028 11:00:00 UTC
    1860318000, //12/13/2028 11:00:00 UTC
    1862996400, //01/13/2029 11:00:00 UTC
    1865674800, //02/13/2029 11:00:00 UTC
    1868094000, //03/13/2029 11:00:00 UTC
    1870772400, //04/13/2029 11:00:00 UTC
    1873364400, //05/13/2029 11:00:00 UTC
    1876042800, //06/13/2029 11:00:00 UTC
    1878634800, //07/13/2029 11:00:00 UTC
    1881313200, //08/13/2029 11:00:00 UTC
    1883991600, //09/13/2029 11:00:00 UTC
    1886583600, //10/13/2029 11:00:00 UTC
    1889262000, //11/13/2029 11:00:00 UTC
    1891854000, //12/13/2029 11:00:00 UTC
    1894532400, //01/13/2030 11:00:00 UTC
    1897210800, //02/13/2030 11:00:00 UTC
    1899630000, //03/13/2030 11:00:00 UTC
    1902308400, //04/13/2030 11:00:00 UTC
    1904900400, //05/13/2030 11:00:00 UTC
    1907578800, //06/13/2030 11:00:00 UTC
    1910170800, //07/13/2030 11:00:00 UTC
    1912849200, //08/13/2030 11:00:00 UTC
    1915527600, //09/13/2030 11:00:00 UTC
    1918119600, //10/13/2030 11:00:00 UTC
    1920798000, //11/13/2030 11:00:00 UTC
    1923390000, //12/13/2030 11:00:00 UTC
    1926068400, //01/13/2031 11:00:00 UTC
    1928746800, //02/13/2031 11:00:00 UTC
    1931166000, //03/13/2031 11:00:00 UTC
    1933844400, //04/13/2031 11:00:00 UTC
    1936436400, //05/13/2031 11:00:00 UTC
    1939114800, //06/13/2031 11:00:00 UTC
    1941706800, //07/13/2031 11:00:00 UTC
    1944385200, //08/13/2031 11:00:00 UTC
    1947063600, //09/13/2031 11:00:00 UTC
    1949655600, //10/13/2031 11:00:00 UTC
    1952334000, //11/13/2031 11:00:00 UTC
    1954926000, //12/13/2031 11:00:00 UTC
    1957604400, //01/13/2032 11:00:00 UTC
    1960282800, //02/13/2032 11:00:00 UTC
    1962788400, //03/13/2032 11:00:00 UTC
    1965466800, //04/13/2032 11:00:00 UTC
    1968058800, //05/13/2032 11:00:00 UTC
    1970737200, //06/13/2032 11:00:00 UTC
    1973329200, //07/13/2032 11:00:00 UTC
    1976007600, //08/13/2032 11:00:00 UTC
    1978686000, //09/13/2032 11:00:00 UTC
    1981278000, //10/13/2032 11:00:00 UTC
    1983956400, //11/13/2032 11:00:00 UTC
    1986548400, //12/13/2032 11:00:00 UTC
    1989226800, //01/13/2033 11:00:00 UTC
    1991905200, //02/13/2033 11:00:00 UTC
    1994324400, //03/13/2033 11:00:00 UTC
  ],
  amount: [
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666666)),
    ethers.utils.parseEther(String(16666738)),
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
    `VestingBasic "Team" allocation deployed to ${vestingBasic.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
