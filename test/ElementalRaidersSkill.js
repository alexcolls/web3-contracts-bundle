const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

const NFT_METADATA_BASEURI =
  "https://prod-web3-token-tracker-tqkvar3wjq-uc.a.run.app/metadata/";
const ROYALTIES_IN_BASIS_POINTS = 1000;

describe("ElementalRaidersSkill", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user, admin] = await ethers.getSigners();

    // GFAL TOKEN
    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();
    await gfalToken.deployed();
    await gfalToken.transfer(
      user.address,
      hre.ethers.utils.parseEther("10000000000")
    );

    // PROXY SC
    const Proxy = await ethers.getContractFactory("G4ALProxy");
    const proxy = await Proxy.deploy(gfalToken.address, admin.address);
    await proxy.deployed();

    // ORACLE CONSUMER
    const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
    const oracleConsumer = await OracleConsumer.deploy(
      proxy.address,
      ethers.utils.parseUnits("0.1", "ether")
    );
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

    await elementalRaidersSkill
      .connect(admin)
      .updateBaseURI(
        NFT_METADATA_BASEURI + elementalRaidersSkill.address + "/"
      );
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(1, hre.ethers.utils.parseEther("50"));
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(2, hre.ethers.utils.parseEther("100"));
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(3, hre.ethers.utils.parseEther("150"));
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(4, hre.ethers.utils.parseEther("200"));

    // Set Oracle for consuming the price when minting
    await proxy.updateOracleConsumer(oracleConsumer.address);

    return {
      owner,
      user,
      admin,
      gfalToken,
      oracleConsumer,
      elementalRaidersSkin,
      elementalRaidersSkin,
      gFALMarketplace,
      proxy,
      elementalRaidersSkill,
    };
  }

  describe("Deployment", function () {
    it("Should have been deployed successfully", async function () {
      const { elementalRaidersSkill } = await loadFixture(deployContracts);

      expect(elementalRaidersSkill.address).to.be.equal(
        elementalRaidersSkill.address
      );
    });
    it("Should have been set tokenURI", async function () {
      const { elementalRaidersSkill } = await loadFixture(deployContracts);

      const expectedTokenURI =
        NFT_METADATA_BASEURI + elementalRaidersSkill.address + "/";
      expect(await elementalRaidersSkill.baseURI()).to.be.equal(
        expectedTokenURI
      );
    });
  });

  describe("Workflow", function () {
    describe("Validations", function () {
      it("Should revert if a not owner tries to mint a token", async function () {
        const { elementalRaidersSkill, user } = await loadFixture(
          deployContracts
        );

        await expect(
          elementalRaidersSkill.connect(user).safeMint(user.address, 1)
        ).to.be.reverted;
      });

      it("Should return prices in USD by rarity", async function () {
        const { elementalRaidersSkill, user } = await loadFixture(
          deployContracts
        );

        const pricesRarity =
          await elementalRaidersSkill.getMintingPricesByRarity([1, 2, 3, 4]);

        expect(pricesRarity[0]).to.equal(ethers.utils.parseEther("500"));
        expect(pricesRarity[1]).to.equal(ethers.utils.parseEther("1000"));
        expect(pricesRarity[2]).to.equal(ethers.utils.parseEther("1500"));
        expect(pricesRarity[3]).to.equal(ethers.utils.parseEther("2000"));
      });

      it("Should have been set correct prices for minting", async function () {
        const { elementalRaidersSkill } = await loadFixture(deployContracts);

        expect(await elementalRaidersSkill.prices(1)).to.be.equal(
          hre.ethers.utils.parseEther("50")
        );
        expect(await elementalRaidersSkill.prices(2)).to.be.equal(
          hre.ethers.utils.parseEther("100")
        );
        expect(await elementalRaidersSkill.prices(3)).to.be.equal(
          hre.ethers.utils.parseEther("150")
        );
        expect(await elementalRaidersSkill.prices(4)).to.be.equal(
          hre.ethers.utils.parseEther("200")
        );
      });

      it("Should return the Owners by token", async function () {
        const { elementalRaidersSkill, admin } = await loadFixture(
          deployContracts
        );

        await elementalRaidersSkill.connect(admin).safeMint(admin.address, 0);
        await elementalRaidersSkill.connect(admin).safeMint(admin.address, 0);

        const ownerByID = await elementalRaidersSkill.getOwnersByTokens([0, 1]);
        expect(ownerByID[0]).to.equal(admin.address);
        expect(ownerByID[1]).to.equal(admin.address);
      });

      it("Should return `true` when calling supportsInterface() ", async function () {
        const { elementalRaidersSkill, admin } = await loadFixture(
          deployContracts
        );

        expect(
          await elementalRaidersSkill.supportsInterface(0x80ac58cd)
        ).to.equal(true);
      });
    });

    describe("Transfers", function () {
      it("Should let the owner mint a token for an user", async function () {
        const {
          owner,
          user,
          gfalToken,
          oracleConsumer,
          elementalRaidersSkin,
          gFALMarketplace,
          proxy,
          elementalRaidersSkill,
          admin,
        } = await loadFixture(deployContracts);

        // User approve spending
        await gfalToken
          .connect(user)
          .approve(
            elementalRaidersSkill.address,
            hre.ethers.utils.parseEther("500")
          );

        // Owner mints
        await elementalRaidersSkill.connect(admin).safeMint(user.address, 1);

        expect(await elementalRaidersSkill.totalSupply()).to.equal(1);
        expect(await elementalRaidersSkill.balanceOf(user.address)).to.equal(1);
        expect(await gfalToken.balanceOf(owner.address)).to.equal(
          hre.ethers.utils.parseEther("500")
        );

        // TokenURI
        const tokenURI = await elementalRaidersSkill.tokenURI(0);
        expect(tokenURI).to.equal(
          NFT_METADATA_BASEURI + elementalRaidersSkill.address + "/" + 0
        );

        // Owner updates the baseURI
        const newBaseURI = "ipfs://lol.com/";
        await elementalRaidersSkill.connect(admin).updateBaseURI(newBaseURI);

        // Check new tokenURI for preminted token
        const newTokenURI = await elementalRaidersSkill.tokenURI(0);
        expect(newTokenURI).to.equal(newBaseURI + "0");
      });
    });
  });
});
