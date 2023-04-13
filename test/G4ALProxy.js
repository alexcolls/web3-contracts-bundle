const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const NFT_METADATA_BASEURI =
  "https://prod-web3-token-tracker-tqkvar3wjq-uc.a.run.app/metadata/";

const ROYALTIES_IN_BASIS_POINTS = 1000;

describe("G4ALProxy", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user, contract] = await ethers.getSigners();

    // GFAL TOKEN
    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();
    await gfalToken.deployed();

    // PROXY SC
    const Proxy = await ethers.getContractFactory("G4ALProxy");
    const proxy = await Proxy.deploy(gfalToken.address);
    await proxy.deployed();

    // ORACLE CONSUMER
    const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
    const oracleConsumer = await OracleConsumer.deploy(proxy.address);
    await oracleConsumer.deployed();

    // SKIN NFT
    const ElementalRaidersSkin = await ethers.getContractFactory(
      "ElementalRaidersSkin"
    );
    const elementalRaidersSkin = await ElementalRaidersSkin.deploy(
      proxy.address,
      "ipfs://"
    );
    await elementalRaidersSkin.deployed();

    // SKILL NFT
    const ElementalRaidersSkill = await ethers.getContractFactory(
      "ElementalRaidersSkill"
    );
    const elementalRaidersSkill = await ElementalRaidersSkill.deploy(
      proxy.address,
      "ipfs://"
    );
    await elementalRaidersSkill.deployed();

    // MARKETPLACE
    const GFALMarketplace = await ethers.getContractFactory("GFALMarketplace");
    const gFALMarketplace = await GFALMarketplace.deploy(
      ROYALTIES_IN_BASIS_POINTS,
      proxy.address
    );
    await gFALMarketplace.deployed();

    return {
      owner,
      user,
      contract,
      gfalToken,
      elementalRaidersSkin,
      proxy,
      elementalRaidersSkill,
      oracleConsumer,
      gFALMarketplace,
    };
  }

  describe("Set addresses in G4ALProxy", function () {
    it("Owner should be set correctly", async function () {
      const {
        owner,
        user,
        contract,
        gfalToken,
        elementalRaidersSkin,
        proxy,
        elementalRaidersSkill,
        oracleConsumer,
        gFALMarketplace,
      } = await loadFixture(deployContracts);

      expect(await proxy.owner()).to.equal(owner.address);
      console.log("- Owner set correctly!");
    });

    it("Should have been set the addresses right", async function () {
      const {
        owner,
        user,
        contract,
        gfalToken,
        elementalRaidersSkin,
        proxy,
        elementalRaidersSkill,
        oracleConsumer,
        gFALMarketplace,
      } = await loadFixture(deployContracts);

      await proxy.connect(owner).updateGfalToken(gfalToken.address);
      expect(await proxy.gfalToken()).to.equal(gfalToken.address);

      await proxy.connect(owner).updateOracleConsumer(oracleConsumer.address);
      expect(await proxy.oracleConsumer()).to.equal(oracleConsumer.address);

      await proxy.connect(owner).updateFeeCollector(contract.address);
      expect(await proxy.feeCollector()).to.equal(contract.address);

      await proxy.connect(owner).updateRoyaltiesCollector(contract.address);
      expect(await proxy.royaltiesCollector()).to.equal(contract.address);

      await proxy.connect(owner).updateMarketPlace(gFALMarketplace.address);
      expect(await proxy.marketPlace()).to.equal(gFALMarketplace.address);

      await proxy
        .connect(owner)
        .updateSkillCollection(elementalRaidersSkill.address);
      expect(await proxy.skillCollection()).to.equal(
        elementalRaidersSkill.address
      );

      await proxy
        .connect(owner)
        .updateSkinCollection(elementalRaidersSkin.address);
      expect(await proxy.skinCollection()).to.equal(
        elementalRaidersSkin.address
      );

      console.log(
        `\n- All contracts addresses are set correctly in the Proxy!`
      );
    });

    it("Should reject to set addresses from not owner", async function () {
      const {
        owner,
        user,
        contract,
        gfalToken,
        elementalRaidersSkin,
        proxy,
        elementalRaidersSkill,
        oracleConsumer,
        gFALMarketplace,
      } = await loadFixture(deployContracts);

      await expect(proxy.connect(user).updateGfalToken(contract.address)).to.be
        .reverted;

      await expect(proxy.connect(user).updateOracleConsumer(contract.address))
        .to.be.reverted;

      await expect(proxy.connect(user).updateFeeCollector(contract.address)).to
        .be.reverted;

      await expect(
        proxy.connect(user).updateRoyaltiesCollector(contract.address)
      ).to.be.reverted;

      await expect(
        proxy.connect(user).updateMarketPlace(gFALMarketplace.address)
      ).to.be.reverted;

      await expect(proxy.connect(user).updateSkillCollection(contract.address))
        .to.be.reverted;

      await expect(proxy.connect(user).updateSkinCollection(contract.address))
        .to.be.reverted;

      console.log(`\n- Setting addresses in contract from NOT OWNER rejected!`);
    });
  });
});