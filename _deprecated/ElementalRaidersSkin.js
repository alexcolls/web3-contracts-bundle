const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect} = require("chai");
const {ethers} = require("hardhat");
const hre = require("hardhat");

const NFT_METADATA_BASEURI = "https://prod-web3-token-tracker-tqkvar3wjq-uc.a.run.app/metadata/"
describe("ElementalRaidersSkin", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user] = await ethers.getSigners();

    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();
    await gfalToken.transfer(user.address, hre.ethers.utils.parseEther('10000000000'))

    const ElementalRaidersSkill = await ethers.getContractFactory("ElementalRaidersSkill");
    const elementalRaidersSkill = await ElementalRaidersSkill.deploy(gfalToken.address, "ipfs://");

    await elementalRaidersSkill.updateBaseURI(NFT_METADATA_BASEURI + elementalRaidersSkill.address + "/")
    await elementalRaidersSkill.updateMintingPrice(1, hre.ethers.utils.parseEther('50'))
    await elementalRaidersSkill.updateMintingPrice(2, hre.ethers.utils.parseEther('100'))
    await elementalRaidersSkill.updateMintingPrice(3, hre.ethers.utils.parseEther('150'))
    await elementalRaidersSkill.updateMintingPrice(4, hre.ethers.utils.parseEther('200'))

    return {owner, user, gfalToken, elementalRaidersSkill}
  }

  describe("Deployment", function () {
    it("Should have been deployed successfully", async function () {
      const {elementalRaidersSkill} = await loadFixture(deployContracts);

      expect(await elementalRaidersSkill.address).to.be.equal(elementalRaidersSkill.address);
    });
    it("Should have been set tokenURI", async function () {
      const {elementalRaidersSkill} = await loadFixture(deployContracts);

      const expectedTokenURI = NFT_METADATA_BASEURI + elementalRaidersSkill.address + "/"
      expect(await elementalRaidersSkill.baseURI()).to.be.equal(expectedTokenURI);
    });
    it("Should have been set correct prices for minting", async function () {
      const {elementalRaidersSkill} = await loadFixture(deployContracts);

      expect(await elementalRaidersSkill.prices(1)).to.be.equal(hre.ethers.utils.parseEther('50'));
      expect(await elementalRaidersSkill.prices(2)).to.be.equal(hre.ethers.utils.parseEther('100'));
      expect(await elementalRaidersSkill.prices(3)).to.be.equal(hre.ethers.utils.parseEther('150'));
      expect(await elementalRaidersSkill.prices(4)).to.be.equal(hre.ethers.utils.parseEther('200'));
    });
  });

  describe("Workflow", function () {
    describe("Validations", function () {
      it("Should revert if a not owner tries to mint a token", async function () {
        const {elementalRaidersSkill, user} = await loadFixture(deployContracts);

        await expect(elementalRaidersSkill.connect(user).safeMint(user.address, 1)).to.be.reverted
      });
    });

    describe("Events", function () {
      // TODO Polish this
      // it("Should emit an event UpdateRate on updating the rate", async function () {
      //   const {elementalRaidersSkill, owner} = await loadFixture(deployContracts);
      //
      //   await expect(await elementalRaidersSkill.updateRateValue(ethers.utils.parseUnits("0.1", "ether")))
      //     .to.emit(elementalRaidersSkill, "UpdateRate")
      //     .withArgs(ethers.utils.parseUnits("0.1", "ether"))
      // });
    });

    describe("Transfers", function () {
      it("Should let the owner mint a token for an user", async function () {
        const {gfalToken, elementalRaidersSkill, owner, user} = await loadFixture(deployContracts);

        // User approve spending
        await gfalToken.connect(user).approve(elementalRaidersSkill.address, hre.ethers.utils.parseEther('50'))

        // Owner mints
        await elementalRaidersSkill.safeMint(user.address, 1);

        await expect(await elementalRaidersSkill.totalSupply()).to.equal(1)
        await expect(await elementalRaidersSkill.balanceOf(user.address)).to.equal(1)
        await expect(await gfalToken.balanceOf(owner.address)).to.equal(hre.ethers.utils.parseEther('50'))

        // TokenURI
        const tokenURI = await elementalRaidersSkill.tokenURI(0)
        await expect(tokenURI).to.equal(NFT_METADATA_BASEURI + elementalRaidersSkill.address + "/" + 0)

        // Owner updates the baseURI
        const newBaseURI = 'ipfs://lol.com/'
        await elementalRaidersSkill.updateBaseURI(newBaseURI)

        // Check new tokenURI for preminted token
        const newTokenURI = await elementalRaidersSkill.tokenURI(0)
        await expect(newTokenURI).to.equal(newBaseURI + '0')
      });
    });
  });
});
