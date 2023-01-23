// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [owner, developer] = await ethers.getSigners()

  const GameGoldToken = await hre.ethers.getContractFactory("GameGoldToken");
  const OracleConsumer = await hre.ethers.getContractFactory("OracleConsumer");
  const ElementalRaidersSkill = await hre.ethers.getContractFactory("ElementalRaidersSkill");
  const G4ALMarketplace = await hre.ethers.getContractFactory("G4ALMarketplace");

  const gameGoldToken = await GameGoldToken.deploy();
  const oracleConsumer = await OracleConsumer.deploy();
  const elementalRaidersSkill = await ElementalRaidersSkill.deploy(owner.address, developer.address, gameGoldToken.address, "ipfs://");
  const g4alMarkeplace = await G4ALMarketplace.deploy(oracleConsumer.address, gameGoldToken.address, developer.address, 1000);

  await gameGoldToken.deployed();
  await oracleConsumer.deployed();
  await elementalRaidersSkill.deployed();
  await g4alMarkeplace.deployed()

  console.log(
    `GameGoldToken deployed to ${gameGoldToken.address}`,
    `OracleConsumer deployed to ${oracleConsumer.address}`,
    `ElementalRaidersSkill deployed to ${elementalRaidersSkill.address}`
    `G4ALMarketplace deployed to ${g4alMarkeplace.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
