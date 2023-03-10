const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const {expect} = require("chai");
const {BigNumber} = require('ethers');

const ROYALTIES_IN_BASIS_POINTS = 1000
const ERC721 = 0
const ERC1155 = 1

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
    const [owner, developer, seller, buyer, seller2] = await ethers.getSigners()

    // Deploy mock dependency contracts
    const GFALToken = await ethers.getContractFactory("GFALToken")
    const gfalToken = await GFALToken.deploy()
    const OracleConsumer = await ethers.getContractFactory("OracleConsumer")
    const oracleConsumer = await OracleConsumer.deploy()
    const ElementalRaidersSkill = await ethers.getContractFactory("ElementalRaidersSkill")
    const elementalRaidersSkill = await ElementalRaidersSkill.deploy(gfalToken.address, oracleConsumer.address, "ipfs://")
    const ElementalRaidersSkin = await ethers.getContractFactory("ElementalRaidersSkin")
    const elementalRaidersSkin = await ElementalRaidersSkin.deploy(gfalToken.address, oracleConsumer.address)

    // Oracle writes the priceFeed (Mocking external, untested here, workflow)
    await oracleConsumer.updateRateValue(ethers.utils.parseUnits("0.1", "ether")) // here we are converting the float to wei to work as "intFloat"

    // Transferring $GFAL tokens to seller and buyer
    await gfalToken.approve(owner.address, ethers.utils.parseUnits("1100", "ether"))
    await gfalToken.transfer(seller.address, ethers.utils.parseUnits("1000", "ether"))
    await gfalToken.transfer(buyer.address, ethers.utils.parseUnits("100", "ether"))

    // SETUP CONFIG ERC721 CONTACT

    // Setting prices for rarity indexes
    await elementalRaidersSkill.updateMintingPrice(1, ethers.utils.parseUnits("50", "ether"))
    await elementalRaidersSkill.updateMintingPrice(2, ethers.utils.parseUnits("100", "ether"))
    await elementalRaidersSkill.updateMintingPrice(3, ethers.utils.parseUnits("150", "ether"))
    await elementalRaidersSkill.updateMintingPrice(4, ethers.utils.parseUnits("200", "ether"))

    // Minting x2 NFT as owner to the seller
    // Player (future seller) approves spending to game for minting (x2 - 50+50)
    await gfalToken.connect(seller).approve(elementalRaidersSkill.address, ethers.utils.parseUnits("1000", "ether"))
    await elementalRaidersSkill.safeMint(seller.address, 1)
    await elementalRaidersSkill.safeMint(seller.address, 1)

    // SETUP CONFIG ERC1155 CONTACT

    // Minting x1 supply of tokenId to seller
    // Player (future seller) approves spending to game for minting (x2 - 50+50)
    await elementalRaidersSkin.mint(seller.address, 0, 1)
    // Minting x1 supply of tokenId to seller2, this will be used to test same tokenId sell from different sellers
    await elementalRaidersSkin.mint(seller2.address, 0, 1)

    /**
     * Marketplace test workflow
     */

      // Deploy testing contract
    const GFALMarketplace = await ethers.getContractFactory("GFALMarketplace")
    const gfalMarketplace = await GFALMarketplace.deploy(oracleConsumer.address, gfalToken.address, developer.address, ROYALTIES_IN_BASIS_POINTS)

    // Whitelist ElementalRaidersSkill by owner
    await gfalMarketplace.updateCollection(elementalRaidersSkill.address, ERC721, true)
    await gfalMarketplace.updateCollection(elementalRaidersSkin.address, ERC1155, true)

    return {
      owner,
      developer,
      seller,
      seller2,
      buyer,
      gfalToken,
      oracleConsumer,
      elementalRaidersSkill,
      elementalRaidersSkin,
      gfalMarketplace
    }
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
        await expect(gfalMarketplace.connect(buyer).updateCollection("0x1234567890123456789012345678901234567890", ERC721, true))
          .to.be.reverted
      })

      it("Should revert if an user tries to remove a collection", async function () {
        const {buyer, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        // Expect to find it in the mapping as true
        await expect(gfalMarketplace.connect(buyer).updateCollection(elementalRaidersSkill.address, ERC721, true))
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

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Removes it
        await expect(await gfalMarketplace.connect(seller).removeToken(elementalRaidersSkill.address, 0))
          .to.emit(gfalMarketplace, "RemoveToken")
          .withArgs(elementalRaidersSkill.address, 0, seller.address)
      })

      it("Should emit an event BuyToken buying a token ERC721", async function () {
        const {seller, buyer, elementalRaidersSkill, gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // Buyer buys NFTs from seller
        await expect(await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0, seller.address))
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

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        await expect(await gfalMarketplace.sellersList(0)).to.equal(seller.address)
        await expect(await gfalMarketplace.knownSellers(seller.address)).to.equal(true)
      })

      it("Should put a whitelisted collection token for sell in Dollars", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        // he sells it for 5$ that should be converted to 50 GFAL
        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("5", "ether"), true)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("5", "ether"))

        await expect(await gfalMarketplace.sellersList(0)).to.equal(seller.address)
        await expect(await gfalMarketplace.knownSellers(seller.address)).to.equal(true)
      })

      it("Should adjust the price for a token already for sell", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        await expect(await gfalMarketplace.sellersList(0)).to.equal(seller.address)
        await expect(await gfalMarketplace.knownSellers(seller.address)).to.equal(true)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("100", "ether"), true)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("100", "ether"))

        await expect(await gfalMarketplace.sellersList(0)).to.equal(seller.address)
        await expect(await gfalMarketplace.knownSellers(seller.address)).to.equal(true)
      })

      it("Should remove a token from sell", async function () {
        const {seller, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        await expect(await gfalMarketplace.sellersList(0)).to.equal(seller.address)
        await expect(await gfalMarketplace.knownSellers(seller.address)).to.equal(true)

        // Removes it
        await gfalMarketplace.connect(seller).removeToken(elementalRaidersSkill.address, 0)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("0", "ether"))

        await expect(await gfalMarketplace.sellersList(0)).to.equal(seller.address)
        await expect(await gfalMarketplace.knownSellers(seller.address)).to.equal(true)
      })

      // TODO: Should allow a seller to removeToken even if un-whitelisted

      it("Should buy a token ERC721 that is for sell in $GFAL", async function () {
        const {seller, buyer, elementalRaidersSkill, gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("50", "ether"), false)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // NFT balance
        await expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(2)
        await expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(0)

        // Buyer buys NFTs from seller
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0, seller.address)

        // NFT balance
        await expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(1)
        await expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(1)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gfalToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("50", "ether"))
        await expect(await gfalToken.balanceOf(await gfalMarketplace.royaltiesCollector())).to.equal(ethers.utils.parseUnits("5", "ether")) // considering previous 50+50 for minting

        // Volume increase check
        await expect(await gfalMarketplace.volume()).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
        const tokensForSale = await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)
        await expect(tokensForSale.price).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(tokensForSale.isDollar).to.equal(false)
        await expect(tokensForSale.isForSale).to.equal(false)

        // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
        const getOnSaleTokenIds = await gfalMarketplace.getOnSaleTokenIds(elementalRaidersSkill.address, seller.address, 0, 1)
        await expect(getOnSaleTokenIds.tokenIds).to.deep.equal([BigNumber.from(0)])
        await expect(getOnSaleTokenIds.sellers).to.deep.equal(['0x0000000000000000000000000000000000000000'])
        await expect(getOnSaleTokenIds.prices).to.deep.equal([BigNumber.from(0)])
      })

      it("Should buy a token ERC721 that is for sell in Dollars", async function () {
        const {seller, buyer, elementalRaidersSkill, gfalToken, gfalMarketplace} = await loadFixture(deployContracts)

        await elementalRaidersSkill.connect(seller).approve(gfalMarketplace.address, 0)

        // he sells it for 5$ that should be converted to 50 GFAL
        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkill.address, 0, ethers.utils.parseUnits("5", "ether"), true)

        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).isDollar).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkill.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("5", "ether")) // considering previous 50+50 for minting

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("50", "ether"))

        // NFT balance
        await expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(2)
        await expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(0)

        // Buyer buys NFTs from seller
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkill.address, 0, seller.address)

        // NFT balance
        await expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(1)
        await expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(1)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gfalToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("50", "ether"))
        await expect(await gfalToken.balanceOf(await gfalMarketplace.royaltiesCollector())).to.equal(ethers.utils.parseUnits("5", "ether"))

        // Volume increase check
        await expect(await gfalMarketplace.volume()).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
        const getOnSaleTokenIds = await gfalMarketplace.getOnSaleTokenIds(elementalRaidersSkill.address, seller.address, 0, 1)
        await expect(getOnSaleTokenIds.tokenIds).to.deep.equal([BigNumber.from(0)])
        await expect(getOnSaleTokenIds.sellers).to.deep.equal(['0x0000000000000000000000000000000000000000'])
        await expect(getOnSaleTokenIds.prices).to.deep.equal([BigNumber.from(0)])
      })

      it("Should buy a tokens ERC1155 with same IDs that are for sell in $GFAL", async function () {
        const {
          seller,
          seller2,
          buyer,
          elementalRaidersSkin,
          gfalToken,
          gfalMarketplace
        } = await loadFixture(deployContracts)

        // Seller 1 workflow
        await elementalRaidersSkin.connect(seller).setApprovalForAll(gfalMarketplace.address, true)
        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkin.address, 0, ethers.utils.parseUnits("50", "ether"), false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        // Seller 2 workflow
        await elementalRaidersSkin.connect(seller2).setApprovalForAll(gfalMarketplace.address, true)
        await gfalMarketplace.connect(seller2).sellToken(elementalRaidersSkin.address, 0, ethers.utils.parseUnits("50", "ether"), false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)).isDollar).to.equal(false)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)).price).to.equal(ethers.utils.parseUnits("50", "ether"))

        // NFT balance
        await expect(await elementalRaidersSkin.balanceOf(seller.address, 0)).to.equal(1)
        await expect(await elementalRaidersSkin.balanceOf(seller2.address, 0)).to.equal(1)
        await expect(await elementalRaidersSkin.balanceOf(buyer.address, 0)).to.equal(0)

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("100", "ether"))

        // Buyer buys NFTs from seller
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkin.address, 0, seller.address)
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkin.address, 0, seller2.address)

        // NFT balance
        await expect(await elementalRaidersSkin.balanceOf(seller.address, 0)).to.equal(0)
        await expect(await elementalRaidersSkin.balanceOf(seller2.address, 0)).to.equal(0)
        await expect(await elementalRaidersSkin.balanceOf(buyer.address, 0)).to.equal(2)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gfalToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(seller2.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(await gfalToken.balanceOf(await gfalMarketplace.royaltiesCollector())).to.equal(ethers.utils.parseUnits("10", "ether")) // considering previous 50+50 for minting

        // Volume increase check
        await expect(await gfalMarketplace.volume()).to.equal(ethers.utils.parseUnits("100", "ether"))

        // Check tokensForSale from Seller1 has been removed from mapping (marked as isForSale false, etc.)
        const tokensForSale1 = await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)
        await expect(tokensForSale1.price).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(tokensForSale1.isDollar).to.equal(false)
        await expect(tokensForSale1.isForSale).to.equal(false)

        // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
        const tokensForSale2 = await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)
        await expect(tokensForSale2.price).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(tokensForSale2.isDollar).to.equal(false)
        await expect(tokensForSale2.isForSale).to.equal(false)

        // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
        const getOnSaleTokenIds = await gfalMarketplace.getOnSaleTokenIds(elementalRaidersSkin.address, seller.address, 0, 1)
        await expect(getOnSaleTokenIds.tokenIds).to.deep.equal([BigNumber.from(0)])
        await expect(getOnSaleTokenIds.sellers).to.deep.equal(['0x0000000000000000000000000000000000000000'])
        await expect(getOnSaleTokenIds.prices).to.deep.equal([BigNumber.from(0)])

        // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
        const getOnSaleTokenIds2 = await gfalMarketplace.getOnSaleTokenIds(elementalRaidersSkin.address, seller.address, 0, 1)
        await expect(getOnSaleTokenIds2.tokenIds).to.deep.equal([BigNumber.from(0)])
        await expect(getOnSaleTokenIds2.sellers).to.deep.equal(['0x0000000000000000000000000000000000000000'])
        await expect(getOnSaleTokenIds2.prices).to.deep.equal([BigNumber.from(0)])
      })

      it("Should buy a tokens ERC1155 with same IDs that are for sell in Dollars", async function () {
        const {
          seller,
          seller2,
          buyer,
          elementalRaidersSkin,
          gfalToken,
          gfalMarketplace
        } = await loadFixture(deployContracts)

        // Seller 1 workflow
        await elementalRaidersSkin.connect(seller).setApprovalForAll(gfalMarketplace.address, true)
        await gfalMarketplace.connect(seller).sellToken(elementalRaidersSkin.address, 0, ethers.utils.parseUnits("5", "ether"), true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)).isDollar).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)).price).to.equal(ethers.utils.parseUnits("5", "ether"))

        // Seller 2 workflow
        await elementalRaidersSkin.connect(seller2).setApprovalForAll(gfalMarketplace.address, true)
        await gfalMarketplace.connect(seller2).sellToken(elementalRaidersSkin.address, 0, ethers.utils.parseUnits("5", "ether"), true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)).isForSale).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)).isDollar).to.equal(true)
        await expect((await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)).price).to.equal(ethers.utils.parseUnits("5", "ether"))

        // NFT balance
        await expect(await elementalRaidersSkin.balanceOf(seller.address, 0)).to.equal(1)
        await expect(await elementalRaidersSkin.balanceOf(seller2.address, 0)).to.equal(1)
        await expect(await elementalRaidersSkin.balanceOf(buyer.address, 0)).to.equal(0)

        // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
        await gfalToken.connect(buyer).approve(gfalMarketplace.address, ethers.utils.parseUnits("100", "ether"))

        // Buyer buys NFTs from seller
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkin.address, 0, seller.address)
        await gfalMarketplace.connect(buyer).buyToken(elementalRaidersSkin.address, 0, seller2.address)

        // NFT balance
        await expect(await elementalRaidersSkin.balanceOf(seller.address, 0)).to.equal(0)
        await expect(await elementalRaidersSkin.balanceOf(seller2.address, 0)).to.equal(0)
        await expect(await elementalRaidersSkin.balanceOf(buyer.address, 0)).to.equal(2)

        // Seller, buyer and Fee Collector balances checks
        await expect(await gfalToken.balanceOf(seller.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(seller2.address)).to.equal(ethers.utils.parseUnits("45", "ether"))
        await expect(await gfalToken.balanceOf(buyer.address)).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(await gfalToken.balanceOf(await gfalMarketplace.royaltiesCollector())).to.equal(ethers.utils.parseUnits("10", "ether")) // considering previous 50+50 for minting

        // Volume increase check
        await expect(await gfalMarketplace.volume()).to.equal(ethers.utils.parseUnits("100", "ether"))

        // Check tokensForSale from Seller1 has been removed from mapping (marked as isForSale false, etc.)
        const tokensForSale1 = await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller.address)
        await expect(tokensForSale1.price).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(tokensForSale1.isDollar).to.equal(false)
        await expect(tokensForSale1.isForSale).to.equal(false)

        // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
        const tokensForSale2 = await gfalMarketplace.tokensForSale(elementalRaidersSkin.address, 0, seller2.address)
        await expect(tokensForSale2.price).to.equal(ethers.utils.parseUnits("0", "ether"))
        await expect(tokensForSale2.isDollar).to.equal(false)
        await expect(tokensForSale2.isForSale).to.equal(false)

        // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
        const getOnSaleTokenIds1 = await gfalMarketplace.getOnSaleTokenIds(elementalRaidersSkin.address, seller.address, 0, 1)
        await expect(getOnSaleTokenIds1.tokenIds).to.deep.equal([BigNumber.from(0)])
        await expect(getOnSaleTokenIds1.sellers).to.deep.equal(['0x0000000000000000000000000000000000000000'])
        await expect(getOnSaleTokenIds1.prices).to.deep.equal([BigNumber.from(0)])

        // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
        const getOnSaleTokenIds2 = await gfalMarketplace.getOnSaleTokenIds(elementalRaidersSkin.address, seller2.address, 0, 1)
        await expect(getOnSaleTokenIds2.tokenIds).to.deep.equal([BigNumber.from(0)])
        await expect(getOnSaleTokenIds2.sellers).to.deep.equal(['0x0000000000000000000000000000000000000000'])
        await expect(getOnSaleTokenIds2.prices).to.deep.equal([BigNumber.from(0)])
      })

      it("Owner should be able to add a collection", async function () {
        const {owner, gfalMarketplace} = await loadFixture(deployContracts)

        // Owner addCollection
        await gfalMarketplace.connect(owner).updateCollection("0x1234567890123456789012345678901234567890", ERC721, true)

        // Expect to find it in the mapping as true
        await expect((await gfalMarketplace.whitelistNFTs("0x1234567890123456789012345678901234567890")).tokenStandard).to.equal(0)
        await expect((await gfalMarketplace.whitelistNFTs("0x1234567890123456789012345678901234567890")).allowed).to.equal(true)
      })

      it("Owner should be able to remove a collection", async function () {
        const {owner, elementalRaidersSkill, gfalMarketplace} = await loadFixture(deployContracts)

        // Owner addCollection
        await gfalMarketplace.connect(owner).updateCollection(elementalRaidersSkill.address, ERC721, false)

        // Expect to find it in the mapping as true
        await expect((await gfalMarketplace.whitelistNFTs(elementalRaidersSkill.address)).tokenStandard).to.equal(0)
        await expect((await gfalMarketplace.whitelistNFTs(elementalRaidersSkill.address)).allowed).to.equal(false)
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
    })
  })
})
