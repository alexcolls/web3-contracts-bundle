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

describe("GFALMarketplace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [owner, developer, seller, buyer] = await ethers.getSigners()

    // Deploy mock dependency contracts
    const GFALToken = await ethers.getContractFactory("GFALToken")
    const gfalToken = await GFALToken.deploy()
    const OracleConsumer = await ethers.getContractFactory("OracleConsumer")
    const oracleConsumer = await OracleConsumer.deploy()
    const ElementalRaidersSkill = await ethers.getContractFactory("ElementalRaidersSkill")
    const elementalRaidersSkill = await ElementalRaidersSkill.deploy(owner.address, developer.address, gfalToken.address, "ipfs://")

    // Oracle writes the priceFeed (Mocking external, untested here, workflow)
    await oracleConsumer.updateRateValue(ethers.utils.parseUnits("0.1", "ether")) // here we are converting the float to wei to work as "intFloat"

    // Transferring $GFAL tokens to seller and buyer
    await gfalToken.approve(owner.address, ethers.utils.parseUnits("200", "ether"))
    await gfalToken.transferFrom(owner.address, seller.address, ethers.utils.parseUnits("100", "ether"))
    await gfalToken.transferFrom(owner.address, buyer.address, ethers.utils.parseUnits("100", "ether"))

    // Player (future seller) approves spending to game for minting (x2 - 50+50)
    await gfalToken.connect(seller).approve(elementalRaidersSkill.address, ethers.utils.parseUnits("100", "ether"))

    // Setting prices for rarity indexes
    await elementalRaidersSkill.updateMintingPrice(1, ethers.utils.parseUnits("50", "ether"))
    await elementalRaidersSkill.updateMintingPrice(2, ethers.utils.parseUnits("100", "ether"))
    await elementalRaidersSkill.updateMintingPrice(3, ethers.utils.parseUnits("150", "ether"))
    await elementalRaidersSkill.updateMintingPrice(4, ethers.utils.parseUnits("200", "ether"))

    // Minting x2 NFT as owner to the seller
    await elementalRaidersSkill.safeMint(seller.address, 1)
    await elementalRaidersSkill.safeMint(seller.address, 1)

    /**
     * Marketplace test workflow
     */

    // Deploy testing contract
    const GFALMarketplace = await ethers.getContractFactory("GFALMarketplace")
    const gfalMarketplace = await GFALMarketplace.deploy(oracleConsumer.address, gfalToken.address, developer.address, ROYALTIES_IN_BASIS_POINTS)

    // Whitelist ElementalRaidersSkill by owner
    await gfalMarketplace.addCollection(elementalRaidersSkill.address)

    return {owner, developer, seller, buyer, gfalToken, oracleConsumer, elementalRaidersSkill, gfalMarketplace}
  }

  describe("Deployment", function () {
    it("Should set the right Oracle contract address", async function () {
      const {oracleConsumer, gfalMarketplace} = await loadFixture(deployContracts)

      expect(await gfalMarketplace.oracleConsumer()).to.equal(oracleConsumer.address)
    })

    it("Should set the right $GFAL contract address", async function () {
      const {gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

      expect(await gfalMarketplace.gfalToken()).to.equal(gfalToken.address)
    })

    it("Should set the right royaltiesCollector contract address", async function () {
      const {developer, gfalMarketplace} = await loadFixture(deployContracts)

      expect(await gfalMarketplace.royaltiesCollector()).to.equal(developer.address)
    })

    it("Should set the right royaltiesInBasisPoints value", async function () {
      const {gfalMarketplace} = await loadFixture(deployContracts)

      expect(await gfalMarketplace.royaltiesInBasisPoints()).to.equal(ROYALTIES_IN_BASIS_POINTS)
    })
  })

  describe("Workflow", function () {
    describe("Validations", function () {
      // TODO: Should revert if an user tries to sell a not-whitelistedNFT.

      // TODO: Should revert if an user tries to sell a not-approved NFT.

      // TODO: Should revert if an user tries to buy a not-whitelistedNFT (removed in the meantime).

      // TODO: Should revert if an user tries to buy an NFT which has been disapproved after listing.

      // TODO: Should revert if an user tries to buy an NFT with balance but not approved.

      it("Should revert if an user tries to add a collection", async function () {
        const {buyer, gfalMarketplace} = await loadFixture(deployContracts)

        // Expect to be reverted
        await expect(gfalMarketplace.connect(buyer).addCollection("0x1234567890123456789012345678901234567890"))
          .to.be.reverted
      })

      it("Should revert if an user tries to remove a collection", async function () {
        const {buyer, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        // Expect to find it in the mapping as true
        await expect(gfalMarketplace.connect(buyer).removeCollection(elementalRaidersSkill.address))
          .to.be.reverted
      })

      it("Should revert if an user tries to updateGgtToken", async function () {
        const {buyer, gfalMarketplace} = await loadFixture(deployContracts)

        // Expect to find it in the mapping as true
        await expect(gfalMarketplace.connect(buyer).updateGFALToken("0x1234567890123456789012345678901234567890"))
          .to.be.reverted
      })

      it("Should revert if an user tries to updateOracleConsumer", async function () {
        const {buyer, gfalMarketplace} = await loadFixture(deployContracts)

        // Expect to find it in the mapping as true
        await expect(gfalMarketplace.connect(buyer).updateOracleConsumer("0x1234567890123456789012345678901234567890"))
          .to.be.reverted
      })

      it("Should revert if an user tries to updateRoyaltiesInBasisPoints", async function () {
        const {buyer, gfalMarketplace} = await loadFixture(deployContracts)

        // Expect to find it in the mapping as true
        await expect(gfalMarketplace.connect(buyer).updateRoyaltiesInBasisPoints(500))
          .to.be.reverted
      })

      // TODO: Should revert if an user tries to pause the contract

      // TODO: Should revert if an user tries to unpause the contract
    })

    describe("Events", function () {
      it("Should emit an event SellToken on put for sell a token", async function () {
        const {seller, buyer, elementalRaidersSkill, gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await expect(await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false))
          .to.emit(gfalMarketplace, "SellToken")
          .withArgs(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false, seller.address)
      })

      it("Should emit an event RemoveToken on remove from sell a token", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Removes it
        await expect(await gfalMarketplace.connect(seller).removeToken(elementalRaidersSkill.address, 0))
          .to.emit(gfalMarketplace, "RemoveToken")
          .withArgs(elementalRaidersSkill.address, 0, seller.address)
      })

      it("Should emit an event BuyToken buying a token", async function () {
        const {seller, buyer, elementalRaidersSkill, gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // Buyer buys NFTs from seller
        await expect(await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0))
          .to.emit(gfalMarketplace, "BuyToken")
          .withArgs(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), anyValue, anyValue, seller.address, buyer.address)
      })
    })

    describe("Transfers", function () {
      it("Should put a whitelisted collection token for sell in $GFAL", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        // he sells it for 50 GFAL
        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))
      })

      it("Should put a whitelisted collection token for sell in Dollars", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        // he sells it for 5$ that should be converted to 50 GFAL
        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("5", "ether"), true)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("5", "ether"))
      })

      it("Should adjust the price for a token already for sell", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("100", "ether"), true)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("100", "ether"))
      })

      it("Should remove a token from sell", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Removes it
        await gfalMarketplace.connect(seller).removeToken(elementalRaidersSkill.address, 0)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("0", "ether"))

        // TODO: Check tokenForSale has been removed from mapping
      })

      // TODO: Should allow a seller to removeToken even if un-whitelisted

      it("Should buy a token that is for sell in $GFAL", async function () {
        const {seller, buyer, elementalRaidersSkill, gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // Buyer buys NFTs from seller
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gfalToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("50", "ether"))
        await expect(await gfalToken.balanceOf(await gfalMarketplace.royaltiesCollector())).to.equal(ethers.utils.parseUnits("105", "ether")) // considering previous 50+50 for minting

        // Volume increase check
        await expect(await gfalMarketplace.volume()).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
        const tokensForSale = await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0)
        await expect(tokensForSale.contractAddress).to.equal(elementalRaidersSkill.address)
        await expect(tokensForSale.tokenId).to.equal(0)
        await expect(tokensForSale.seller).to.equal('0x0000000000000000000000000000000000000000')
        await expect(tokensForSale.price).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(tokensForSale.isDollar).to.equal(false)
        await expect(tokensForSale.isForSale).to.equal(false)

        // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
        const getOnSaleTokenIds = await gfalMarketplace.getOnSaleTokenIds(elementalRaidersSkill.address, 0, 1)
        await expect(getOnSaleTokenIds.tokenIds).to.deep.equal([])
        await expect(getOnSaleTokenIds.sellers).to.deep.equal([])
        await expect(getOnSaleTokenIds.prices).to.deep.equal([])
        await expect(getOnSaleTokenIds.isDollars).to.deep.equal([])
      })

      it("Should buy a token that is for sell in Dollars", async function () {
        const {seller, buyer, elementalRaidersSkill, gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        // he sells it for 5$ that should be converted to 50 GFAL
        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("5", "ether"), true)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[5]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[4]).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0))[3]).to.equal(ethers.utils.parseUnits("5", "ether")) // considering previous 50+50 for minting

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // Buyer buys NFTs from seller
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gfalToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("50", "ether"))
        await expect(await gfalToken.balanceOf(await gfalMarketplace.royaltiesCollector())).to.equal(ethers.utils.parseUnits("105", "ether"))

        // Volume increase check
        await expect(await gfalMarketplace.volume()).to.equal(ethers.utils.parseUnits("50", "ether"))
      })

      it("Owner should be able to add a collection", async function () {
        const {owner, gfalMarketplace} = await loadFixture(deployContracts)

        // Owner addCollection
        await gfalMarketplace.connect(owner).addCollection("0x1234567890123456789012345678901234567890")

        // Expect to find it in the mapping as true
        await expect((await gfalMarketplace.whitelistNFTs("0x1234567890123456789012345678901234567890"))).to.equal(true)
      })

      it("Owner should be able to remove a collection", async function () {
        const {owner, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        // Owner addCollection
        await gfalMarketplace.connect(owner).removeCollection(elementalRaidersSkill.address)

        // Expect to find it in the mapping as true
        await expect((await gfalMarketplace.whitelistNFTs(elementalRaidersSkill.address))).to.equal(false)
      })

      it("Owner should be able to update GgtToken", async function () {
        const {owner, gfalMarketplace} = await loadFixture(deployContracts)

        // Owner updateGFALToken()
        await gfalMarketplace.connect(owner).updateGFALToken("0x1234567890123456789012345678901234567890")

        // Expect to find it in the variable as exact value
        await expect((await gfalMarketplace.gfalToken())).to.equal("0x1234567890123456789012345678901234567890")
      })

      it("Owner should be able to update OracleConsumer", async function () {
        const {owner, gfalMarketplace} = await loadFixture(deployContracts)

        // Owner updateOracleConsumer()
        await gfalMarketplace.connect(owner).updateOracleConsumer("0x1234567890123456789012345678901234567890")

        // Expect to find it in the variable as exact value
        await expect((await gfalMarketplace.oracleConsumer())).to.equal("0x1234567890123456789012345678901234567890")
      })

      it("Owner should be able to update RoyaltiesInBasisPoints", async function () {
        const {owner, gfalMarketplace} = await loadFixture(deployContracts)

        // Owner updateGgtToken()
        await gfalMarketplace.connect(owner).updateRoyaltiesInBasisPoints(500)

        // Expect to find it in the variable as exact value
        await expect((await gfalMarketplace.royaltiesInBasisPoints())).to.equal(500)
      })

      // TODO: Owner should be able to unpause the contract

      // TODO: Owner should be able to pause the contract
    })
  })
})
