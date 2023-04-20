// THIS SCRIPT WILL DEPLOY AND SET THE CONTRACTS FOR PRODUCTION!
const hre = require("hardhat");
const { ethers } = require("hardhat");

const TEMPORARY_URI = "https://ipfs/";
const ROYALTIES_IN_BASIS_POINTS = 1000;
const SKILLS_PRICE_GFAL = ethers.utils.parseUnits("10", "ether");
const SKILLS_PRICE_BUSD = ethers.utils.parseUnits("1", "ether");
const SKINS_PRICE_GFAL = ethers.utils.parseUnits("50", "ether");
const SKINS_PRICE_BUSD = ethers.utils.parseUnits("5", "ether");
const ERC721 = 0;
const ERC1105 = 1;

// Wait for 10 second to do not overload the block
async function wait() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  // const [owner] = await ethers.getSigners(); // Hardhat local

  // const owner = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY); // Ganache
  const owner = new ethers.Wallet(process.env.BSC_PRIVATE_KEY); // BSC Testnet & Mainnet

  // DEPLOY CONTRACTS

  // -ERC20 Token
  const GFALToken = await ethers.getContractFactory("GFALToken");
  const gfalToken = await GFALToken.deploy();
  await gfalToken.deployed();
  console.log("\n*GFALToken deployed to:", gfalToken.address);

  // -Proxy Contract
  const G4ALProxy = await ethers.getContractFactory("G4ALProxy");
  const g4alProxy = await G4ALProxy.deploy(gfalToken.address);
  await g4alProxy.deployed();
  console.log("*G4ALProxy deployed to:", g4alProxy.address);

  // -OracleConsumer Contract
  const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
  const oracleConsumer = await OracleConsumer.deploy(g4alProxy.address);
  await oracleConsumer.deployed();
  console.log("*OracleConsumer deployed to:", oracleConsumer.address);

  // -ERC721 Token
  const ElementalRaidersSkill = await ethers.getContractFactory(
    "ElementalRaidersSkill"
  );
  const elementalRaidersSkill = await ElementalRaidersSkill.deploy(
    g4alProxy.address,
    TEMPORARY_URI
  );
  await elementalRaidersSkill.deployed();
  console.log(
    "*ElementalRaidersSkill deployed to:",
    elementalRaidersSkill.address
  );

  const ElementalRaidersSkin = await ethers.getContractFactory(
    "ElementalRaidersSkin"
  );
  const elementalRaidersSkin = await ElementalRaidersSkin.deploy(
    g4alProxy.address,
    TEMPORARY_URI
  );
  await elementalRaidersSkin.deployed();
  console.log(
    "*ElementalRaidersSkin deployed to:",
    elementalRaidersSkin.address
  );

  // -Market place ERC721 & ERC721
  const GFALMarketplace = await ethers.getContractFactory("GFALMarketplace");
  const gfalMarketplace = await GFALMarketplace.deploy(
    ROYALTIES_IN_BASIS_POINTS,
    g4alProxy.address
  );
  await gfalMarketplace.deployed();
  console.log("*GFALMarketplace deployed to:", gfalMarketplace.address);

  // SET CONTRACTS
  // -Proxy Contract set addresses
  await g4alProxy.updateOracleConsumer(oracleConsumer.address);
  await g4alProxy.updateMarketPlace(gfalMarketplace.address);
  console.log("\n*Set OracleConsumer address & MarketPlace in GFALProxy");

  // -Marketplace Set NFT collections in whitelist
  await gfalMarketplace.updateCollection(
    elementalRaidersSkill.address,
    ERC721,
    true
  );
  await gfalMarketplace.updateCollection(
    elementalRaidersSkin.address,
    ERC721,
    true
  );
  console.log("*Skin & Skill collections is set in the Marketplace");

  await wait(); // Wait for 10 second to do not overload the block

  // -OracleConsumer set RateValue (GFAL -> USD) price
  await oracleConsumer.updateRateValue(ethers.utils.parseUnits("0.1", "ether")); // here we are converting the float to wei to work as "intFloat"

  // -Skins NFT Contract Set rarity
  for (let i = 1; i < 5; i++) {
    // Common items, Uncommon items, Rare items, Epic items.
    await elementalRaidersSkin.updateMintingPrice(
      i,
      ethers.utils.parseUnits("1", "ether")
    );
  }
  console.log("*Rarities 1 to 4 are set in Skins NFT Contract");

  await wait(); // Wait for 10 second to do not overload the block

  // NO NEED TO APPROVE AS THE RARITY IS  0 so 0 GFAL

  // -Mint 10 NFTs rarity 0 -> TokenPrice 0 GFAL & Does not need permissions to manage ERC20
  for (let i = 0; i < 10; i++) {
    await elementalRaidersSkin.safeMint(owner.address, 0);
  }
  console.log("*Minted 10 Skins NFTs rarity 0 (Price 0)");

  await wait(); // Wait for 10 second to do not overload the block

  // -Skills NFT Contract Set rarity
  for (let i = 1; i < 5; i++) {
    // Common items, Uncommon items, Rare items, Epic items.
    await elementalRaidersSkill.updateMintingPrice(
      i,
      ethers.utils.parseUnits("1", "ether")
    );
  }
  console.log("*Rarities 1 to 4 are set in Skins NFT Contract");

  await wait(); // Wait for 10 second to do not overload the block

  // -Mint 10 NFTs rarity 0 -> TokenPrice 0 GFAL & Does not need permissions to manage ERC20
  for (let i = 0; i < 10; i++) {
    await elementalRaidersSkill.safeMint(owner.address, 0);
  }
  console.log("*Minted 10 Skills NFTs rarity 0 (Price 0)");

  await wait(); // Wait for 10 second to do not overload the block

  // - Allow Marketplace to manage NFTs
  for (let i = 0; i < 10; i++) {
    await elementalRaidersSkill.approve(gfalMarketplace.address, i);
    await elementalRaidersSkin.approve(gfalMarketplace.address, i);
  }
  console.log(
    "*Approved Marketplace to manage NFTs (Skills & Skins) from 0 to 9 (So 10 NFTs each collection)"
  );

  await wait(); // Wait for 10 second to do not overload the block

  // -List 5 Skills & 5 Skins in GFAL "Sale Price"
  for (let i = 0; i < 5; i++) {
    await gfalMarketplace.sellToken(
      elementalRaidersSkill.address,
      i,
      1,
      SKILLS_PRICE_GFAL,
      false
    );

    await gfalMarketplace.sellToken(
      elementalRaidersSkin.address,
      i,
      1,
      SKINS_PRICE_GFAL,
      false
    );
  }
  console.log(
    "*Listed in Marketplace (Skills & Skins) in GFAL from 0 to 4 (So 5 NFTs each collection)"
  );

  await wait(); // Wait for 10 second to do not overload the block

  // -List 5 Skills & 5 Skins in BUSD "Sale Price"
  for (let i = 5; i < 10; i++) {
    await gfalMarketplace.sellToken(
      elementalRaidersSkill.address,
      i,
      1,
      SKILLS_PRICE_BUSD,
      false
    );

    await gfalMarketplace.sellToken(
      elementalRaidersSkin.address,
      i,
      1,
      SKINS_PRICE_BUSD,
      false
    );
  }
  console.log(
    "*Listed in Marketplace (Skills & Skins) in BUSD from 5 to 9 (So 5 NFTs each collection)"
  );

  console.log("\n Workflow finished!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
