const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect} = require("chai");

const ROYALTIES_IN_BASIS_POINTS = 1000

//TODO
// Important: Test the contract's behavior when the contract is trying to be reentrant and check that it works as expected.
// .
// Test the contract's behavior when the price of a token is updated while it is being sold, and check that the buyer is charged the correct price.
// Test the contract's behavior when the whitelist of NFTs is updated and check that it works as expected.
// Test the contract's behavior when the token for sale is already sold and check that it works as expected.
// Test the contract's behavior when the contract is paused and check that it works as expected.
// Test the contract's getters and check that it works as expected. getOnSaleTokenIds(), getRateValue(), getConversionRate()
// .
// Optional: Test the contract's behavior when the token for sale is not a valid ERC721 token and check that it works as expected.
// .
// External: Test the contract's behavior when the OracleConsumer contract returns an unexpected value, such as a price that is too low or too high.

describe("G4ALMarketplace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, developer, seller, buyer] = await ethers.getSigners();

    // Deploy mock dependency contracts
    const GameGoldToken = await ethers.getContractFactory("GameGoldToken");
    const gameGoldToken = await GameGoldToken.deploy();
    const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
    const oracleConsumer = await OracleConsumer.deploy();
    const ElementalRaidersSkill = await ethers.getContractFactory("ElementalRaidersSkill");
    const elementalRaidersSkill = await ElementalRaidersSkill.deploy(owner.address, developer.address, gameGoldToken.address, "ipfs://");

    // Oracle writes the priceFeed (Mocking external, untested here, workflow)
    await oracleConsumer.updateRateValue(ethers.utils.parseUnits("0.1", "ether")); // here we are converting the float to wei to work as "intFloat"

    // Transferring $GGT tokens to seller and buyer
    await gameGoldToken.approve(owner.address, ethers.utils.parseUnits("200", "ether"))
    await gameGoldToken.transferFrom(owner.address, seller.address, ethers.utils.parseUnits("100", "ether"))
    await gameGoldToken.transferFrom(owner.address, buyer.address, ethers.utils.parseUnits("100", "ether"))

    // Player (future seller) approves spending to game for minting (x2 - 50+50)
    await gameGoldToken.connect(seller).approve(elementalRaidersSkill.address, ethers.utils.parseUnits("100", "ether"))

    // Minting x2 NFT as owner to the seller
    await elementalRaidersSkill.safeMint(seller.address, ethers.utils.parseUnits("50", "ether"))
    await elementalRaidersSkill.safeMint(seller.address, ethers.utils.parseUnits("50", "ether"))

    /**
     * Marketplace test workflow
     */

    // Deploy testing contract
    const G4ALMarketplace = await ethers.getContractFactory("G4ALMarketplace");
    const g4alMarketplace = await G4ALMarketplace.deploy(oracleConsumer.address, gameGoldToken.address, developer.address, ROYALTIES_IN_BASIS_POINTS);

    // Whitelist ElementalRaidersSkill by owner
    await g4alMarketplace.addCollection(elementalRaidersSkill.address)

    return {owner, developer, seller, buyer, gameGoldToken, oracleConsumer, elementalRaidersSkill, g4alMarketplace};
  }

  describe("Deployment", function () {
    it("Should set the right Oracle contract address", async function () {
      const {oracleConsumer, g4alMarketplace} = await loadFixture(deployContracts);

      expect(await g4alMarketplace.oracleConsumer()).to.equal(oracleConsumer.address);
    });

    it("Should set the right $GGT contract address", async function () {
      const {gameGoldToken, g4alMarketplace} = await loadFixture(deployContracts);

      expect(await g4alMarketplace.ggtToken()).to.equal(gameGoldToken.address);
    });

    it("Should set the right FeeCollector contract address", async function () {
      const {developer, g4alMarketplace} = await loadFixture(deployContracts);

      expect(await g4alMarketplace.feeCollector()).to.equal(developer.address);
    });

    it("Should set the right royaltiesInBasisPoints value", async function () {
      const {g4alMarketplace} = await loadFixture(deployContracts);

      expect(await g4alMarketplace.royaltiesInBasisPoints()).to.equal(ROYALTIES_IN_BASIS_POINTS);
    });
  });

  describe("Workflow", function () {
    describe("Validations", function () {
      // TODO: Should revert if an user tries to sell a not-whitelistedNFT.

      // TODO: Should revert if an user tries to sell a not-approved NFT.

      // TODO: Should revert if an user tries to buy a not-whitelistedNFT (removed in the meantime).

      // TODO: Should revert if an user tries to buy an NFT which has been disapproved after listing.

      // TODO: Should revert if an user tries to buy an NFT with balance but not approved.

      it("Should revert if an user tries to add a collection", async function () {
        const {buyer, g4alMarketplace} = await loadFixture(deployContracts);

        // Expect to be reverted
        await expect(g4alMarketplace.connect(buyer).addCollection("0x1234567890123456789012345678901234567890"))
          .to.be.reverted
      });

      it("Should revert if an user tries to remove a collection", async function () {
        const {buyer, elementalRaidersSkill, g4alMarketplace} = await loadFixture(deployContracts);

        // Expect to find it in the mapping as true
        await expect(g4alMarketplace.connect(buyer).removeCollection(elementalRaidersSkill.address))
          .to.be.reverted
      });

      it("Should revert if an user tries to updateGgtToken", async function () {
        const {buyer, g4alMarketplace} = await loadFixture(deployContracts);

        // Expect to find it in the mapping as true
        await expect(g4alMarketplace.connect(buyer).updateGgtToken("0x1234567890123456789012345678901234567890"))
          .to.be.reverted
      });

      it("Should revert if an user tries to updateOracleConsumer", async function () {
        const {buyer, g4alMarketplace} = await loadFixture(deployContracts);

        // Expect to find it in the mapping as true
        await expect(g4alMarketplace.connect(buyer).updateOracleConsumer("0x1234567890123456789012345678901234567890"))
          .to.be.reverted
      });

      it("Should revert if an user tries to updateRoyaltiesInBasisPoints", async function () {
        const {buyer, g4alMarketplace} = await loadFixture(deployContracts);

        // Expect to find it in the mapping as true
        await expect(g4alMarketplace.connect(buyer).updateRoyaltiesInBasisPoints(500))
          .to.be.reverted
      });

      // TODO: Should revert if an user tries to pause the contract

      // TODO: Should revert if an user tries to unpause the contract
    });

    describe("Events", function () {
      it("Should emit an event SellToken on put for sell a token", async function () {
        const {seller, buyer, elementalRaidersSkill, gameGoldToken, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        await expect(await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false))
          .to.emit(g4alMarketplace, "SellToken")
          .withArgs(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false, seller.address)
      });

      it("Should emit an event RemoveToken on remove from sell a token", async function () {
        const {seller, elementalRaidersSkill, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Removes it
        await expect(await g4alMarketplace.connect(seller).removeToken(elementalRaidersSkill.address, 0))
          .to.emit(g4alMarketplace, "RemoveToken")
          .withArgs(elementalRaidersSkill.address, 0, seller.address)
      });

      it("Should emit an event BuyToken buying buy a token", async function () {
        const {seller, buyer, elementalRaidersSkill, gameGoldToken, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Buyer approves the marketplace contract for spending GGT to buy NFT afterward
        await gameGoldToken.connect(buyer).approve(g4alMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // Buyer buys NFTs from seller
        await expect(await g4alMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0))
          .to.emit(g4alMarketplace, "BuyToken")
          .withArgs(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), anyValue, anyValue, seller.address, buyer.address)
      });
    });

    describe("Transfers", function () {
      it("Should put a whitelisted collection token for sell in $GGT", async function () {
        const {seller, elementalRaidersSkill, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        // he sells it for 50 GGT
        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))
      });

      it("Should put a whitelisted collection token for sell in Dollars", async function () {
        const {seller, elementalRaidersSkill, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        // he sells it for 5$ that should be converted to 50 GGT
        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("5", "ether"), true)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("5", "ether"))
      });

      it("Should adjust the price for a token already for sell", async function () {
        const {seller, elementalRaidersSkill, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("100", "ether"), true)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("100", "ether"))
      });

      it("Should remove a token from sell", async function () {
        const {seller, elementalRaidersSkill, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Removes it
        await g4alMarketplace.connect(seller).removeToken(elementalRaidersSkill.address, 0)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("0", "ether"))

        // TODO: Check tokenForSale has been removed from mapping
      });

      // TODO: Should allow a seller to removeToken even if un-whitelisted

      it("Should buy a token that is for sell in $GGT", async function () {
        const {seller, buyer, elementalRaidersSkill, gameGoldToken, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Buyer approves the marketplace contract for spending GGT to buy NFT afterward
        await gameGoldToken.connect(buyer).approve(g4alMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // Buyer buys NFTs from seller
        await g4alMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gameGoldToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gameGoldToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("50", "ether"))
        await expect(await gameGoldToken.balanceOf(await g4alMarketplace.feeCollector())).to.equal(ethers.utils.parseUnits("105", "ether")) // considering previous 50+50 for minting

        // Volume increase check
        await expect(await g4alMarketplace.volume()).to.equal(ethers.utils.parseUnits("50", "ether"))

        // TODO: Check tokenForSale has been removed from mapping
      });

      it("Should buy a token that is for sell in Dollars", async function () {
        const {seller, buyer, elementalRaidersSkill, gameGoldToken, g4alMarketplace} = await loadFixture(deployContracts);

        await elementalRaidersSkill.connect(seller).approve(g4alMarketplace.address, 0)

        // he sells it for 5$ that should be converted to 50 GGT
        await g4alMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("5", "ether"), true)

        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(true)
        await expect((await g4alMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("5", "ether")) // considering previous 50+50 for minting

        // Buyer approves the marketplace contract for spending GGT to buy NFT afterward
        await gameGoldToken.connect(buyer).approve(g4alMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // Buyer buys NFTs from seller
        await g4alMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gameGoldToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gameGoldToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("50", "ether"))
        await expect(await gameGoldToken.balanceOf(await g4alMarketplace.feeCollector())).to.equal(ethers.utils.parseUnits("105", "ether"))

        // Volume increase check
        await expect(await g4alMarketplace.volume()).to.equal(ethers.utils.parseUnits("50", "ether"))
      });

      it("Owner should be able to add a collection", async function () {
        const {owner, g4alMarketplace} = await loadFixture(deployContracts);

        // Owner addCollection
        await g4alMarketplace.connect(owner).addCollection("0x1234567890123456789012345678901234567890")

        // Expect to find it in the mapping as true
        await expect((await g4alMarketplace.whitelistNFTs("0x1234567890123456789012345678901234567890"))).to.equal(true)
      });

      it("Owner should be able to remove a collection", async function () {
        const {owner, elementalRaidersSkill, g4alMarketplace} = await loadFixture(deployContracts);

        // Owner addCollection
        await g4alMarketplace.connect(owner).removeCollection(elementalRaidersSkill.address)

        // Expect to find it in the mapping as true
        await expect((await g4alMarketplace.whitelistNFTs(elementalRaidersSkill.address))).to.equal(false)
      });

      it("Owner should be able to update GgtToken", async function () {
        const {owner, g4alMarketplace} = await loadFixture(deployContracts);

        // Owner updateGgtToken()
        await g4alMarketplace.connect(owner).updateGgtToken("0x1234567890123456789012345678901234567890")

        // Expect to find it in the variable as exact value
        await expect((await g4alMarketplace.ggtToken())).to.equal("0x1234567890123456789012345678901234567890")
      });

      it("Owner should be able to update OracleConsumer", async function () {
        const {owner, g4alMarketplace} = await loadFixture(deployContracts);

        // Owner updateGgtToken()
        await g4alMarketplace.connect(owner).updateOracleConsumer("0x1234567890123456789012345678901234567890")

        // Expect to find it in the variable as exact value
        await expect((await g4alMarketplace.oracleConsumer())).to.equal("0x1234567890123456789012345678901234567890")
      });

      it("Owner should be able to update RoyaltiesInBasisPoints", async function () {
        const {owner, g4alMarketplace} = await loadFixture(deployContracts);

        // Owner updateGgtToken()
        await g4alMarketplace.connect(owner).updateRoyaltiesInBasisPoints(500)

        // Expect to find it in the variable as exact value
        await expect((await g4alMarketplace.royaltiesInBasisPoints())).to.equal(500)
      });

      // TODO: Owner should be able to unpause the contract

      // TODO: Owner should be able to pause the contract
    });
  });
});
