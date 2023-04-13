const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const NFT_METADATA_BASEURI =
  "https://prod-web3-token-tracker-tqkvar3wjq-uc.a.run.app/metadata/";

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

    // ORACLE CONSUMER
    const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
    const oracleConsumer = await OracleConsumer.deploy();
    await oracleConsumer.deployed();

    // SKIN NFT
    const ElementalRaidersSkin = await ethers.getContractFactory(
      "ElementalRaidersSkin"
    );
    const elementalRaidersSkin = await ElementalRaidersSkin.deploy(
      gfalToken.address,
      oracleConsumer.address,
      "ipfs://"
    );
    await elementalRaidersSkin.deployed();

    // SKILL NFT
    const ElementalRaidersSkill = await ethers.getContractFactory(
      "ElementalRaidersSkill"
    );
    const elementalRaidersSkill = await ElementalRaidersSkill.deploy(
      gfalToken.address,
      oracleConsumer.address,
      "ipfs://"
    );
    await elementalRaidersSkill.deployed();

    // PROXY SC
    const Proxy = await ethers.getContractFactory("G4ALProxy");
    const proxy = await Proxy.deploy();
    await proxy.deployed();

    return {
      owner,
      user,
      contract,
      gfalToken,
      elementalRaidersSkin,
      proxy,
      elementalRaidersSkill,
      oracleConsumer,
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
      } = await loadFixture(deployContracts);

      await proxy.connect(owner).updateGfalToken(contract.address);
      expect(await proxy.gfalToken()).to.equal(contract.address);

      await proxy.connect(owner).updateOracleConsumer(contract.address);
      expect(await proxy.oracleConsumer()).to.equal(contract.address);

      await proxy.connect(owner).updateFeeCollector(contract.address);
      expect(await proxy.feeCollector()).to.equal(contract.address);

      await proxy.connect(owner).updateMarketPlace(contract.address);
      expect(await proxy.marketPlace()).to.equal(contract.address);

      await proxy.connect(owner).updateSkillCollection(contract.address);
      expect(await proxy.skillCollection()).to.equal(contract.address);

      await proxy.connect(owner).updateSkinCollection(contract.address);
      expect(await proxy.skinCollection()).to.equal(contract.address);

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
      } = await loadFixture(deployContracts);

      await expect(proxy.connect(user).updateGfalToken(contract.address)).to.be
        .reverted;

      await expect(proxy.connect(user).updateOracleConsumer(contract.address))
        .to.be.reverted;

      await expect(proxy.connect(user).updateFeeCollector(contract.address)).to
        .be.reverted;

      await expect(proxy.connect(user).updateMarketPlace(contract.address)).to
        .be.reverted;

      await expect(proxy.connect(user).updateSkillCollection(contract.address))
        .to.be.reverted;

      await expect(proxy.connect(user).updateSkinCollection(contract.address))
        .to.be.reverted;

      console.log(`\n- Setting addresses in contract from NOT OWNER rejected!`);
    });
  });
});
