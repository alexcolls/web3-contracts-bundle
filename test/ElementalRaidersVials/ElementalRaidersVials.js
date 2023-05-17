const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BigNumber } = require("ethers");

const { proofFormated1, root1, wallet1 } = require("./1_merkleTree");
const { proofFormated2, root2, wallet2 } = require("./2_merkleTree");

const BASE_URI = "http://baseUri/";

describe("Elemental Raiders Vials", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user, admin] = await ethers.getSigners();

    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();
    await gfalToken.deployed();

    const Proxy = await ethers.getContractFactory("G4ALProxy");
    const proxy = await Proxy.deploy(gfalToken.address, admin.address);
    await proxy.deployed();

    const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
    const oracleConsumer = await OracleConsumer.deploy(
      proxy.address,
      ethers.utils.parseUnits("0.1", "ether")
    );
    await oracleConsumer.deployed();

    await proxy.connect(owner).updateOracleConsumer(oracleConsumer.address);

    const ElementalRaidersVials = await ethers.getContractFactory(
      "ElementalRaidersVials"
    );
    const elementalRaidersVials = await ElementalRaidersVials.deploy(
      BASE_URI,
      proxy.address
    );
    await elementalRaidersVials.deployed();

    await elementalRaidersVials
      .connect(admin)
      .createVial(ethers.utils.parseUnits("10", "ether"), 10, 1, root1);

    await elementalRaidersVials
      .connect(admin)
      .createVial(ethers.utils.parseUnits("100", "ether"), 20, 6, root2);

    await gfalToken
      .connect(owner)
      .transfer(user.address, ethers.utils.parseUnits("100000", "ether"));

    await gfalToken
      .connect(user)
      .approve(
        elementalRaidersVials.address,
        ethers.utils.parseUnits("1000000000000000000", "ether")
      );

    await gfalToken
      .connect(owner)
      .approve(
        elementalRaidersVials.address,
        ethers.utils.parseUnits("1000000000000000000", "ether")
      );

    return { owner, user, admin, elementalRaidersVials, gfalToken, proxy };
  }

  describe("Deployment", function () {
    it("Vials should have been stored correctly", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      const vial0 = await elementalRaidersVials.vials(0);
      expect(vial0.price).to.equal(ethers.utils.parseUnits("10", "ether"));
      expect(vial0.maxSupplySale).to.equal(10);
      expect(vial0.totalSold).to.equal(0);
      expect(vial0.maxClaimableSupply).to.equal(1);
      expect(vial0.totalClaimed).to.equal(0);
      expect(vial0.hashRoot).to.equal(root1);

      const vial1 = await elementalRaidersVials.vials(1);
      expect(vial1.price).to.equal(ethers.utils.parseUnits("100", "ether"));
      expect(vial1.maxSupplySale).to.equal(20);
      expect(vial1.totalSold).to.equal(0);
      expect(vial1.maxClaimableSupply).to.equal(6);
      expect(vial1.totalClaimed).to.equal(0);
      expect(vial1.hashRoot).to.equal(root2);
    });

    it("Base Uri should have been stored correctly", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      expect(await elementalRaidersVials.uri(0)).to.equal(BASE_URI + 0);
    });
  });

  describe("Validations", function () {
    it("Should revert if minter is not Admin", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await expect(
        elementalRaidersVials
          .connect(user)
          .createVial(ethers.utils.parseUnits("10", "ether"), 20, 6, root2)
      ).to.be.reverted;
    });

    it("Should revert if sending not existent vialId", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await expect(elementalRaidersVials.mint(owner.address, 2)).to.be.reverted;
      await expect(
        elementalRaidersVials.mintWhitelisted(owner.address, 2, proofFormated2)
      ).to.be.reverted;
    });

    it("Should revert if empty Proof (Hash merkle tree)", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await expect(elementalRaidersVials.mintWhitelisted(owner.address, 0, []))
        .to.be.reverted;
    });

    it("Should revert if not valid Proof (Hash merkle tree)", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await expect(
        elementalRaidersVials.mintWhitelisted(owner.address, 0, proofFormated2)
      ).to.be.reverted;
    });

    it("Should revert if minter is not in whitelist", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await expect(
        elementalRaidersVials
          .connect(owner)
          .mintWhitelisted(user.address, 0, proofFormated1)
      ).to.be.reverted;

      await expect(
        elementalRaidersVials
          .connect(owner)
          .mintWhitelisted(user.address, 0, proofFormated2)
      ).to.be.reverted;
    });

    it("Should allow user to mint NFT if whitelisted and revert if claiming more than once", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials
        .connect(user)
        .mintWhitelisted(user.address, 0, proofFormated1);

      await expect(
        elementalRaidersVials
          .connect(user)
          .mintWhitelisted(user.address, 0, proofFormated1)
      ).to.be.reverted;
    });

    it("Should revert if burning a burned NFT", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials.connect(user).mint(user.address, 0);

      await elementalRaidersVials.connect(user).burn(0);
      await expect(elementalRaidersVials.connect(user).burn(0)).to.be.reverted;
    });

    it("Should revert if burning a not owned NFT", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials.connect(user).mint(user.address, 0);

      await expect(elementalRaidersVials.connect(owner).burn(0)).to.be.reverted;
    });
  });

  describe("Workflow", function () {
    it("Should allow user to mint NFT", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials.connect(user).mint(user.address, 0);
    });

    it("Should allow user to mint NFT if whitelisted", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials
        .connect(user)
        .mintWhitelisted(user.address, 0, proofFormated1);

      expect(await elementalRaidersVials.isMinted(0, user.address)).to.equal(
        true
      );
    });

    it("Should increment the totalSold when mint()", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      for (let i = 0; i < 10; i++) {
        await elementalRaidersVials.connect(user).mint(user.address, 0);
      }

      let vialDetails = await elementalRaidersVials.vials(0);

      expect(vialDetails.totalSold).to.equal(10);
    });

    it("Should increment the totalClaimed when mintWhitelisted()", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials
        .connect(user)
        .mintWhitelisted(user.address, 0, proofFormated1);

      let vialDetails = await elementalRaidersVials.vials(0);

      expect(vialDetails.totalClaimed).to.equal(1);
    });

    it("Should revert if totalSold reached", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      for (let i = 0; i < 20; i++) {
        await elementalRaidersVials.connect(user).mint(user.address, 1);
      }

      await expect(elementalRaidersVials.connect(user).mint(user.address, 1)).to
        .be.reverted;

      const vialDetails = await elementalRaidersVials.vials(1);

      expect(vialDetails.totalSold).to.equal(20);
    });

    it("Should revert if totalClaimed reached", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials
        .connect(user)
        .mintWhitelisted(user.address, 0, proofFormated1);

      await expect(
        elementalRaidersVials
          .connect(owner)
          .mintWhitelisted(user.address, 0, proofFormated1)
      ).to.be.reverted;
    });

    it("Should be FREE of GFAL charge if user is Whitelisted mintWhitelisted()", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy, gfalToken } =
        await loadFixture(deployContracts);
      const balanceBeforeUser = await gfalToken.balanceOf(user.address);
      const balanceBeforeOwner = await gfalToken.balanceOf(owner.address);

      await elementalRaidersVials
        .connect(user)
        .mintWhitelisted(user.address, 0, proofFormated1);

      const balanceAfterUser = await gfalToken.balanceOf(user.address);
      const balanceAfterOwner = await gfalToken.balanceOf(owner.address);

      expect(balanceAfterUser).to.equal(balanceBeforeUser);
      expect(balanceAfterOwner).to.equal(balanceBeforeOwner);
    });

    it("Should send the right amount of GFAL when minting mint()", async function () {
      const { owner, user, admin, gfalToken, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);
      const balanceBefore = await gfalToken.balanceOf(owner.address);
      await elementalRaidersVials.connect(user).mint(user.address, 0);
      const balanceAfter = await gfalToken.balanceOf(owner.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should be FREE of GFAL charge if Admin is caller mint()", async function () {
      const { owner, user, admin, gfalToken, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);
      const balanceBefore = await gfalToken.balanceOf(owner.address);
      await elementalRaidersVials.connect(admin).mint(user.address, 0);
      const balanceAfter = await gfalToken.balanceOf(owner.address);

      expect(balanceBefore).to.equal(balanceAfter);
    });

    it("Should validate the user receives the NFT when minted mint()", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      for (let i = 0; i < 20; i++) {
        await elementalRaidersVials.connect(user).mint(user.address, 1);
      }

      expect(await elementalRaidersVials.balanceOf(user.address, 1)).to.equal(
        20
      );
    });

    it("Should validate the user receives the NFT when minted by Admin mint()", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      for (let i = 0; i < 20; i++) {
        await elementalRaidersVials.connect(admin).mint(user.address, 1);
      }

      expect(await elementalRaidersVials.balanceOf(user.address, 1)).to.equal(
        20
      );
    });

    it("Should validate the user receives the NFT mintWhitelisted()", async function () {
      const { owner, user, admin, elementalRaidersVials, proxy } =
        await loadFixture(deployContracts);

      await elementalRaidersVials
        .connect(user)
        .mintWhitelisted(user.address, 0, proofFormated1);

      expect(await elementalRaidersVials.balanceOf(user.address, 0)).to.equal(
        1
      );
    });
  });
});
