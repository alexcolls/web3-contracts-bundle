// THIS SCRIPT WILL DEPLOY AND SET THE CONTRACTS FOR PRODUCTION!
const hre = require("hardhat");
const { ethers } = require("hardhat");

const TEMPORARY_URI = "https://ipfs/";
const ROYALTIES_IN_BASIS_POINTS = 1000;
const SKILLS_PRICE_GFAL = ethers.utils.parseUnits("10", "ether");
const SKILLS_PRICE_BUSD = ethers.utils.parseUnits("1", "ether");
const SKINS_PRICE_GFAL = ethers.utils.parseUnits("50", "ether");
const SKINS_PRICE_BUSD = ethers.utils.parseUnits("5", "ether");
const ERC1155_PRICE_GFAL = ethers.utils.parseUnits("100", "ether");
const ERC721 = 0;
const ERC1155 = 1;
// -OracleConsumer set RateValue (GFAL -> USD) price
const RateValue = ethers.utils.parseUnits("0.1", "ether"); // here we are converting the float to wei to work as "intFloat"

// Wait for 10 second to do not overload the block
async function wait() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (e) {
    console.log(e);
  }
}
// npx hardhat run scripts/massive-deploy-set.js --network bsctest
async function main() {
  // const [Owner] = await ethers.getSigners(); // Hardhat local

  // const Owner = new ethers.Wallet(process.env.BSC_PRIVATE_KEY); // Ganache or local

  const [Owner, Admin] = await ethers.getSigners();

  // -ERC20 Token
  const GFALToken = await ethers.getContractFactory("GFALToken", Owner);
  const gfalToken = await GFALToken.deploy();
  await gfalToken.deployed();
  console.log("\n*GFALToken deployed to:", gfalToken.address);

  // -Proxy Contract
  const G4ALProxy = await ethers.getContractFactory("G4ALProxy", Owner);
  const g4alProxy = await G4ALProxy.deploy(gfalToken.address, Admin.address);
  await g4alProxy.deployed();
  console.log("*G4ALProxy deployed to:", g4alProxy.address);

  // -OracleConsumer Contract
  const OracleConsumer = await ethers.getContractFactory(
    "OracleConsumer",
    Owner
  );
  const oracleConsumer = await OracleConsumer.deploy(
    g4alProxy.address,
    RateValue
  );
  await oracleConsumer.deployed();
  console.log("*OracleConsumer deployed to:", oracleConsumer.address);

  // TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
  // -ERC1155 Token (Mockup)
  const ERC1155MockUp = await ethers.getContractFactory("Erc1155MockUp", Owner);
  const erc1155MockUp = await ERC1155MockUp.deploy(
    g4alProxy.address,
    TEMPORARY_URI
  );
  await erc1155MockUp.deployed();
  console.log("\n*ERC1155MockUp deployed to:", erc1155MockUp.address);

  // -ERC721 Token
  const ElementalRaidersSkill = await ethers.getContractFactory(
    "ElementalRaidersSkill",
    Owner
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
    "ElementalRaidersSkin",
    Owner
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
  const GFALMarketplace = await ethers.getContractFactory(
    "GFALMarketplace",
    Owner
  );
  const gfalMarketplace = await GFALMarketplace.deploy(
    ROYALTIES_IN_BASIS_POINTS,
    g4alProxy.address
  );
  await gfalMarketplace.deployed();
  console.log("*GFALMarketplace deployed to:", gfalMarketplace.address);

  await wait(); // Wait for 10 second to do not overload the block

  // SET CONTRACTS
  // -Proxy Contract set addresses
  await g4alProxy.updateOracleConsumer(oracleConsumer.address);
  await g4alProxy.updateMarketPlace(gfalMarketplace.address);
  console.log("\n*Set OracleConsumer address & MarketPlace in GFALProxy");

  // -Marketplace Set NFT collections in whitelist
  await gfalMarketplace
    .connect(Admin)
    .updateCollection(elementalRaidersSkill.address, ERC721, true);
  await gfalMarketplace
    .connect(Admin)
    .updateCollection(elementalRaidersSkin.address, ERC721, true);
  //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
  await gfalMarketplace
    .connect(Admin)
    .updateCollection(erc1155MockUp.address, ERC1155, true);

  console.log("*Skin & Skill collections is set in the Marketplace");

  await wait(); // Wait for 10 second to do not overload the block

  // -Skins NFT Contract Set rarity
  for (let i = 1; i < 5; i++) {
    // Common items, Uncommon items, Rare items, Epic items.
    await elementalRaidersSkin
      .connect(Admin)
      .updateMintingPrice(i, ethers.utils.parseUnits("1", "ether"));
  }
  console.log("*Rarities 1 to 4 are set in Skins NFT Contract");

  await wait(); // Wait for 10 second to do not overload the block

  // NO NEED TO APPROVE AS THE RARITY IS  0 so 0 GFAL

  // -Mint 10 NFTs rarity 0 -> TokenPrice 0 GFAL & Does not need permissions to manage ERC20
  for (let i = 0; i < 10; i++) {
    await elementalRaidersSkin.connect(Admin).safeMint(Admin.address, 0);
  }
  console.log("*Minted 10 Skins NFTs rarity 0 (Price 0)");

  await wait(); // Wait for 10 second to do not overload the block

  // -Skills NFT Contract Set rarity
  for (let i = 1; i < 5; i++) {
    // Common items, Uncommon items, Rare items, Epic items.
    await elementalRaidersSkill
      .connect(Admin)
      .updateMintingPrice(i, ethers.utils.parseUnits("1", "ether"));
  }
  console.log("*Rarities 1 to 4 are set in Skins NFT Contract");

  await wait(); // Wait for 10 second to do not overload the block

  // -Mint 10 NFTs rarity 0 -> TokenPrice 0 GFAL & Does not need permissions to manage ERC20
  for (let i = 0; i < 10; i++) {
    await elementalRaidersSkill.connect(Admin).safeMint(Admin.address, 0);
  }
  console.log("*Minted 10 Skills NFTs rarity 0 (Price 0)");

  //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
  for (let i = 0; i < 10; i++) {
    await erc1155MockUp.connect(Admin).mint(100);
  }
  console.log("*Minted 10 ERC1155MockUp NFTs (100 copies each)");

  await wait(); // Wait for 10 second to do not overload the block

  // - Allow Marketplace to manage NFTs
  for (let i = 0; i < 10; i++) {
    await elementalRaidersSkill
      .connect(Admin)
      .approve(gfalMarketplace.address, i);
    await elementalRaidersSkin
      .connect(Admin)
      .approve(gfalMarketplace.address, i);
    //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
    await erc1155MockUp
      .connect(Admin)
      .setApprovalForAll(gfalMarketplace.address, true);
  }
  console.log(
    "*Approved Marketplace to manage NFTs (Skills & Skins) from 0 to 9 (So 10 NFTs each collection)"
  );

  await wait(); // Wait for 10 second to do not overload the block

  // -List 5 Skills & 5 Skins in GFAL "Sale Price"
  for (let i = 0; i < 5; i++) {
    await gfalMarketplace
      .connect(Admin)
      .sellToken(elementalRaidersSkill.address, i, 1, SKILLS_PRICE_GFAL, false);

    await gfalMarketplace
      .connect(Admin)
      .sellToken(elementalRaidersSkin.address, i, 1, SKINS_PRICE_GFAL, false);

    //TODO! COMMENT MOCK UP WHEN DEPLOYING TO MAINNET
    await gfalMarketplace
      .connect(Admin)
      .sellToken(erc1155MockUp.address, i, 20, ERC1155_PRICE_GFAL, false);
  }
  console.log(
    "*Listed in Marketplace (Skills & Skins) in GFAL from 0 to 4 (So 5 NFTs each collection)"
  );

  await wait(); // Wait for 10 second to do not overload the block

  // -List 5 Skills & 5 Skins in BUSD "Sale Price"
  for (let i = 5; i < 10; i++) {
    await gfalMarketplace
      .connect(Admin)
      .sellToken(elementalRaidersSkill.address, i, 1, SKILLS_PRICE_BUSD, false);

    await gfalMarketplace
      .connect(Admin)
      .sellToken(elementalRaidersSkin.address, i, 1, SKINS_PRICE_BUSD, false);
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
