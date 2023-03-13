// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const {ethers} = require("hardhat");

// Constants

const GFAL_TOKEN = process.env.GFAL_TOKEN
const ORACLE_CONSUMER = process.env.ORACLE_CONSUMER
const NFT_METADATA_BASEURI = "https://prod-web3-token-tracker-tqkvar3wjq-uc.a.run.app/metadata/"

// TODO fill this before deploying on mainnet
const ERC1155 = [
  {
    tokenId: 42,
    price: 0,
    maxSupply: 10,
  },
  {
    tokenId: 48,
    price: 0,
    maxSupply: 2751,
  },
  {
    tokenId: 61,
    price: 0,
    maxSupply: 20,
  },
  {
    tokenId: 82,
    price: 0,
    maxSupply: 15,
  },
  {
    tokenId: 84,
    price: 0,
    maxSupply: 11,
  },
  {
    tokenId: 86,
    price: 0,
    maxSupply: 10,
  },
  {
    tokenId: 88,
    price: 0,
    maxSupply: 10,
  },
  {
    tokenId: 89,
    price: 0,
    maxSupply: 500,
  },
  {
    tokenId: 90,
    price: 0,
    maxSupply: 500,
  },
  {
    tokenId: 93,
    price: 0,
    maxSupply: 300,
  },
  {
    tokenId: 94,
    price: 0,
    maxSupply: 300,
  },
  {
    tokenId: 95,
    price: 0,
    maxSupply: 300,
  },
  {
    tokenId: 96,
    price: 0,
    maxSupply: 300,
  },
  {
    tokenId: 97,
    price: 0,
    maxSupply: 500,
  },
  {
    tokenId: 99,
    price: 0,
    maxSupply: 2814,
  },
  {
    tokenId: 118,
    price: 0,
    maxSupply: 4,
  },
  {
    tokenId: 131,
    price: 0,
    maxSupply: 10,
  },
  {
    tokenId: 132,
    price: 0,
    maxSupply: 1,
  },
]

async function main() {
  const ElementalRaidersSkill = await hre.ethers.getContractFactory("ElementalRaidersSkill")
  const elementalRaidersSkill = await ElementalRaidersSkill.deploy(GFAL_TOKEN, ORACLE_CONSUMER, "")
  await elementalRaidersSkill.deployed()

  const ElementalRaidersSkin = await hre.ethers.getContractFactory("ElementalRaidersSkin")
  const elementalRaidersSkin = await ElementalRaidersSkin.deploy(GFAL_TOKEN, ORACLE_CONSUMER)
  await elementalRaidersSkin.deployed()

  // Executing functions

  // Updating baseURIs for both collections
  await elementalRaidersSkill.updateBaseURI(NFT_METADATA_BASEURI + elementalRaidersSkill.address + "/")
  await elementalRaidersSkin.setURI(NFT_METADATA_BASEURI + elementalRaidersSkin.address + "/")

  // Updating prices for minting BY RARITY INDEX
  await elementalRaidersSkill.updateMintingPrice(1, hre.ethers.utils.parseEther('1'))
  await elementalRaidersSkill.updateMintingPrice(2, hre.ethers.utils.parseEther('3'))
  await elementalRaidersSkill.updateMintingPrice(3, hre.ethers.utils.parseEther('5'))
  await elementalRaidersSkill.updateMintingPrice(4, hre.ethers.utils.parseEther('7'))

  // Updating prices for minting BY TOKEN ID (erc1155)
  for (let item of ERC1155) {
    if (item.price) {
      await elementalRaidersSkin.updateMintingPrice(item.tokenId, ethers.utils.parseUnits(String(item.price), "ether"))
    }
    if (item.maxSupply) {
      await elementalRaidersSkin.updateMintingMaxSupply(item.tokenId, item.maxSupply)
    }
  }

  console.log(
    `ElementalRaidersSkill deployed to ${elementalRaidersSkill.address}`,
    `ElementalRaidersSkin deployed to ${elementalRaidersSkin.address}`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
