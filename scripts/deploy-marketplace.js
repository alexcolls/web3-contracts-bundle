// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")

const GFAL_TOKEN = process.env.GFAL_TOKEN
const ORACLE_CONSUMER = process.env.ORACLE_CONSUMER
const ER_SKILL = process.env.ER_SKILL
const ER_SKIN = process.env.ER_SKIN

async function main() {
  const owner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY)

  const GFALMarketplace = await hre.ethers.getContractFactory("GFALMarketplace")
  const gfalMarkeplace = await GFALMarketplace.deploy(ORACLE_CONSUMER, GFAL_TOKEN, owner.address, 1000)
  await gfalMarkeplace.deployed()

  // Executing functions

  await gfalMarkeplace.addCollection(ER_SKILL, "ERC721")
  await gfalMarkeplace.addCollection(ER_SKIN, "ERC1155")

  console.log(
    `GFALMarketplace deployed to ${gfalMarkeplace.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
