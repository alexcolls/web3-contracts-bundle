const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BigNumber } = require("ethers");

const ROYALTIES_IN_BASIS_POINTS = 1000;
const ERC721 = 0;
const ERC1155 = 1;
const UNLIMITED_GFAL_APPROVAL = ethers.constants.MaxUint256;

describe("GFALMarketplace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContracts() {
    // Contracts are deployed using the first signer/account by default
    const [
      owner,
      developer,
      seller,
      buyer,
      seller2,
      royaltyCollector,
      randomNFTCollection,
      admin,
    ] = await ethers.getSigners();

    // Deploy mock dependency contracts
    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();
    await gfalToken.deployed();

    const Proxy = await ethers.getContractFactory("G4ALProxy");
    const proxy = await Proxy.deploy(gfalToken.address, admin.address);
    await proxy.deployed();

    // Set Royalty Collector
    await proxy.updateRoyaltiesCollector(royaltyCollector.address);

    const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
    const oracleConsumer = await OracleConsumer.deploy(
      proxy.address,
      ethers.utils.parseUnits("0.1", "ether")
    );
    await oracleConsumer.deployed();

    const ElementalRaidersSkill = await ethers.getContractFactory(
      "ElementalRaidersSkill"
    );
    const elementalRaidersSkill = await ElementalRaidersSkill.deploy(
      proxy.address,
      "ipfs://"
    );
    await elementalRaidersSkill.deployed();

    const ElementalRaidersSkin = await ethers.getContractFactory(
      "ElementalRaidersSkin"
    );
    const elementalRaidersSkin = await ElementalRaidersSkin.deploy(
      proxy.address,
      "ipfs://"
    );
    await elementalRaidersSkill.deployed();

    const Erc1155MockUp = await ethers.getContractFactory("Erc1155MockUp");
    const erc1155MockUp = await Erc1155MockUp.deploy(proxy.address, "ipfs://");
    await erc1155MockUp.deployed();

    // Massive approvals of GFAL token for ERC721s when minting (ONE LIFE TIME)
    await gfalToken
      .connect(seller)
      .approve(elementalRaidersSkill.address, UNLIMITED_GFAL_APPROVAL);
    await gfalToken
      .connect(seller)
      .approve(elementalRaidersSkin.address, UNLIMITED_GFAL_APPROVAL);

    // Transferring $GFAL tokens to seller and buyer
    await gfalToken.transfer(
      seller.address,
      ethers.utils.parseUnits("2000", "ether")
    );
    await gfalToken.transfer(
      buyer.address,
      ethers.utils.parseUnits("100", "ether")
    );

    // SETUP CONFIG ERC721 CONTACT

    // Setting prices for rarity indexes
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(1, ethers.utils.parseUnits("50", "ether"));
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(2, ethers.utils.parseUnits("100", "ether"));
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(3, ethers.utils.parseUnits("150", "ether"));
    await elementalRaidersSkill
      .connect(admin)
      .updateMintingPrice(4, ethers.utils.parseUnits("200", "ether"));

    await elementalRaidersSkin
      .connect(admin)
      .updateMintingPrice(1, ethers.utils.parseUnits("50", "ether"));
    await elementalRaidersSkin
      .connect(admin)
      .updateMintingPrice(2, ethers.utils.parseUnits("100", "ether"));
    await elementalRaidersSkin
      .connect(admin)
      .updateMintingPrice(3, ethers.utils.parseUnits("150", "ether"));
    await elementalRaidersSkin
      .connect(admin)
      .updateMintingPrice(4, ethers.utils.parseUnits("200", "ether"));

    /**
     * Marketplace test workflow
     */

    // Deploy testing contract
    const GFALMarketplace = await ethers.getContractFactory("GFALMarketplace");
    const gfalMarketplace = await GFALMarketplace.deploy(
      ROYALTIES_IN_BASIS_POINTS,
      proxy.address
    );

    // Massive approvals of GFAL token for Marketplace when minting (ONE LIFE TIME)

    await gfalToken
      .connect(seller)
      .approve(gfalMarketplace.address, UNLIMITED_GFAL_APPROVAL);
    await gfalToken
      .connect(seller2)
      .approve(gfalMarketplace.address, UNLIMITED_GFAL_APPROVAL);

    // Whitelist ElementalRaidersSkill by owner
    await gfalMarketplace
      .connect(admin)
      .updateCollection(elementalRaidersSkill.address, ERC721, true);
    await gfalMarketplace
      .connect(admin)
      .updateCollection(elementalRaidersSkin.address, ERC721, true);
    await gfalMarketplace
      .connect(admin)
      .updateCollection(erc1155MockUp.address, ERC1155, true);

    // Setting addresses in G4AL Proxy
    await proxy.updateOracleConsumer(oracleConsumer.address);
    await proxy.updateMarketPlace(gfalMarketplace.address);

    // Minting x2 NFT as admin to the seller

    // Skill
    await elementalRaidersSkill.connect(admin).safeMint(seller.address, 1);
    await elementalRaidersSkill.connect(admin).safeMint(seller.address, 1);

    // Skin
    await gfalToken
      .connect(seller)
      .approve(
        elementalRaidersSkin.address,
        ethers.utils.parseUnits("1000", "ether")
      );

    await elementalRaidersSkin.connect(admin).safeMint(seller.address, 1);
    await elementalRaidersSkin.connect(admin).safeMint(seller.address, 1);

    await erc1155MockUp.connect(seller).mint(10);
    await erc1155MockUp.connect(seller2).mint(10);

    return {
      owner,
      admin,
      developer,
      seller,
      seller2,
      buyer,
      gfalToken,
      oracleConsumer,
      elementalRaidersSkill,
      elementalRaidersSkin,
      erc1155MockUp,
      gfalMarketplace,
      proxy,
      royaltyCollector,
      randomNFTCollection,
    };
  }

  describe("Deployment", function () {
    it("Should set the right Oracle contract address", async function () {
      const { oracleConsumer, gfalMarketplace, proxy } = await loadFixture(
        deployContracts
      );

      expect(await proxy.getOracleConsumer()).to.equal(oracleConsumer.address);
    });

    it("Should set the right $GFAL contract address", async function () {
      const { gfalToken, gfalMarketplace, proxy } = await loadFixture(
        deployContracts
      );

      expect(await proxy.getGfalToken()).to.equal(gfalToken.address);
    });

    it("Should set the right royaltiesCollector contract address", async function () {
      const { owner, gfalMarketplace, proxy, royaltyCollector } =
        await loadFixture(deployContracts);

      expect(await proxy.getRoyaltiesCollector()).to.equal(
        royaltyCollector.address
      );
    });

    it("Should set the right royaltiesInBasisPoints value", async function () {
      const { gfalMarketplace } = await loadFixture(deployContracts);

      expect(await gfalMarketplace.royaltiesInBasisPoints()).to.equal(
        ROYALTIES_IN_BASIS_POINTS
      );
    });
  });

  describe("Workflow", function () {
    describe("Validations", function () {
      // SC PAUSED "isActive"
      it(`Update the contract Status to innactivated "UnderMaintenance" & try to buy listed item`, async function () {
        const {
          seller,
          owner,
          admin,
          buyer,
          gfalMarketplace,
          elementalRaidersSkill,
          gfalToken,
        } = await loadFixture(deployContracts);

        // List NFT
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        expect(await elementalRaidersSkill.ownerOf(0)).to.equal(
          gfalMarketplace.address
        );

        await gfalMarketplace.connect(admin).updateContractStatus(false);

        await gfalToken
          .connect(buyer)
          .approve(
            gfalMarketplace.address,
            ethers.utils.parseUnits("50", "ether")
          );

        await expect(
          gfalMarketplace
            .connect(buyer)
            .buyToken(elementalRaidersSkill.address, ERC721, seller.address)
        ).to.be.revertedWith("SC Under maintenance");
      });

      it(`Update the contract Status to innactivated "UnderMaintenance" & try to sell`, async function () {
        const { seller, admin, owner, gfalMarketplace, elementalRaidersSkill } =
          await loadFixture(deployContracts);

        await gfalMarketplace.connect(admin).updateContractStatus(false);

        // List NFT
        await expect(
          gfalMarketplace
            .connect(seller)
            .sellToken(
              elementalRaidersSkill.address,
              0,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            )
        ).to.be.revertedWith("MarketPlace Under maintenance");

        expect(await elementalRaidersSkill.ownerOf(0)).to.not.equal(
          gfalMarketplace.address
        );
      });

      it(`Update the contract Status to innactivated "UnderMaintenance" & try to unlist listed item`, async function () {
        const { seller, owner, admin, gfalMarketplace, elementalRaidersSkill } =
          await loadFixture(deployContracts);

        // List NFT
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        expect(await elementalRaidersSkill.ownerOf(0)).to.equal(
          gfalMarketplace.address
        );

        await gfalMarketplace.connect(admin).updateContractStatus(false);

        expect(
          await gfalMarketplace
            .connect(seller)
            .removeToken(elementalRaidersSkill.address, 0)
        )
          .to.emit(gfalMarketplace, "RemoveToken")
          .withArgs(elementalRaidersSkill.address, 0, seller.address);
      });

      it(`Update the contract Status to innactivated "UnderMaintenance" by Owner`, async function () {
        const { seller, admin, owner, gfalMarketplace, elementalRaidersSkill } =
          await loadFixture(deployContracts);

        // List NFT
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        await gfalMarketplace.connect(admin).updateContractStatus(false);

        expect(await gfalMarketplace.isActive()).to.equal(false);
      });

      it(`Update the contract Status to innactivated "UnderMaintenance" by NOT Owner`, async function () {
        const { seller, gfalMarketplace, elementalRaidersSkill } =
          await loadFixture(deployContracts);

        await expect(
          gfalMarketplace.connect(seller).updateContractStatus(false)
        ).to.be.revertedWith("Not Admin");
      });

      // Selling checks
      it("Test the contract's behavior when the token for sale is already sold and check that it works as expected", async function () {
        const {
          seller,
          buyer,
          gfalToken,
          gfalMarketplace,
          elementalRaidersSkill,
        } = await loadFixture(deployContracts);

        // Approve NFT
        await elementalRaidersSkill
          .connect(seller)
          .approve(gfalMarketplace.address, 0);

        // Approve Token
        await gfalToken
          .connect(buyer)
          .approve(
            gfalMarketplace.address,
            ethers.utils.parseUnits("50", "ether")
          );

        // List for sale
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        const saleBefore = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          0
        );

        expect(saleBefore[2]).to.equal(true);

        await gfalMarketplace
          .connect(buyer)
          .buyToken(elementalRaidersSkill.address, 0, seller.address);

        expect(await elementalRaidersSkill.ownerOf(0)).to.equal(buyer.address);

        const saleAfter = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          0
        );

        expect(saleAfter[2]).to.equal(false);
      });

      it("Test the contract's behavior when the price of a token is updated while it is being sold, and check that the buyer is charged the correct price", async function () {
        const { seller, gfalMarketplace, elementalRaidersSkill } =
          await loadFixture(deployContracts);

        await elementalRaidersSkill
          .connect(seller)
          .approve(gfalMarketplace.address, 1);

        // G4AL Price
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        expect(await elementalRaidersSkill.ownerOf(0)).to.equal(
          gfalMarketplace.address
        );

        // USD Price
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            1,
            1,
            ethers.utils.parseUnits("50", "ether"),
            true
          );

        expect(await elementalRaidersSkill.ownerOf(1)).to.equal(
          gfalMarketplace.address
        );

        const NFTsSale_0 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          0
        );

        const NFTsSale_1 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          1
        );

        // IT should be x1 as the selling price is G4AL 1:1
        expect(NFTsSale_0.price).to.equal(
          ethers.utils.parseUnits("50", "ether")
        );

        // IT should return USD 1:1, but when selling the price will be exchanged to GFAL. In this case x10 as the selling price is in USD and the GFAL Price is set to 0.10 per Dollar
        expect(NFTsSale_1.price).to.equal(
          ethers.utils.parseUnits("50", "ether")
        );

        await gfalMarketplace
          .connect(seller)
          .removeToken(elementalRaidersSkill.address, 0);

        await gfalMarketplace
          .connect(seller)
          .removeToken(elementalRaidersSkill.address, 1);
        // UPDATE PRICE WHILE SELLING!
        // G4AL Price
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("10", "ether"),
            false
          );

        // USD Price
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            1,
            1,
            ethers.utils.parseUnits("10", "ether"),
            true
          );

        const NFTsSalePriceUpdated_0 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          0
        );

        const NFTsSalePriceUpdated_1 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          1
        );

        // IT should be x1 as the selling price is G4AL 1:1
        expect(NFTsSalePriceUpdated_0.price).to.equal(
          ethers.utils.parseUnits("10", "ether")
        );

        // IT should return USD 1:1, but when selling the price will be exchanged to GFAL. In this case x10 as the selling price is in USD and the GFAL Price is set to 0.10 per Dollar
        expect(NFTsSalePriceUpdated_1.price).to.equal(
          ethers.utils.parseUnits("10", "ether")
        );
      });

      it("Get right amount of tokens Id on sale by seller on given dates elementalRaidersSkill", async function () {
        // getOnSaleTokenIds()
        const {
          owner,
          buyer,
          admin,
          seller,
          gfalMarketplace,
          gfalToken,
          elementalRaidersSkill,
        } = await loadFixture(deployContracts);

        await gfalToken.transfer(
          seller.address,
          ethers.utils.parseUnits("1000", "ether")
        );
        // 100000000000000000000 Seller has;
        // 100000000000000000000 Allowed to SC;
        // Approve Skill NFT Contract to manage G4AL form NFT buyer.
        await gfalToken
          .connect(seller)
          .approve(
            elementalRaidersSkill.address,
            ethers.utils.parseEther("1000")
          );

        await elementalRaidersSkill.connect(admin).safeMint(seller.address, 1);
        await elementalRaidersSkill.connect(admin).safeMint(seller.address, 1); // 4 NFTs minted

        expect(await gfalToken.balanceOf(seller.address)).to.equal("0");

        // Approve and list 0, 1, 2 & 3 Skill NFTs in Marketplace
        for (let i = 0; i < 4; i++) {
          // await elementalRaidersSkill
          //   .connect(seller)
          //   .approve(gfalMarketplace.address, i);

          await gfalMarketplace
            .connect(seller)
            .sellToken(
              elementalRaidersSkill.address,
              i,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            );
        }
        const NFTsMinted = 4;
        const NFTsSale_0 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          0
        );
        const NFTsSale_1 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          1
        );
        const NFTsSale_2 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          2
        );
        const NFTsSale_3 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          3
        );

        const NFTsSale_4 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          4
        );

        // check selling NFT id by seller
        expect(NFTsSale_0.seller).to.equal(seller.address);
        expect(NFTsSale_1.seller).to.equal(seller.address);
        expect(NFTsSale_2.seller).to.equal(seller.address);
        expect(NFTsSale_3.seller).to.equal(seller.address);
        // Check Not listed NFT (ID, Seller, Price) -> ID 4 is not listed

        expect(NFTsSale_4.seller).to.equal(
          "0x0000000000000000000000000000000000000000"
        );

        // check selling NFT id by Price
        expect(NFTsSale_0.price).to.equal(
          ethers.utils.parseUnits("50", "ether")
        );
        expect(NFTsSale_1.price).to.equal(
          ethers.utils.parseUnits("50", "ether")
        );
        expect(NFTsSale_2.price).to.equal(
          ethers.utils.parseUnits("50", "ether")
        );
        expect(NFTsSale_3.price).to.equal(
          ethers.utils.parseUnits("50", "ether")
        );
        // Check Not listed NFT (ID, Seller, Price) -> ID 4 is not listed
        expect(NFTsSale_4.price).to.equal(0);
      });

      it("Should revert if an user tries to sell a not-whitelistedNFT", async function () {
        const {
          owner,
          admin,
          buyer,
          seller,
          gfalMarketplace,
          gfalToken,
          elementalRaidersSkill,
        } = await loadFixture(deployContracts);

        // Adding ERC721 to whitelist as FALSE (BlackListed)
        await gfalMarketplace
          .connect(admin)
          .updateCollection(elementalRaidersSkill.address, ERC721, false);

        await expect(
          gfalMarketplace
            .connect(seller)
            .sellToken(
              elementalRaidersSkill.address,
              0,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            )
        ).to.be.reverted;
      });

      it("Should allow a seller to removeToken even if un-whitelisted", async function () {
        const { admin, seller, gfalMarketplace, elementalRaidersSkill } =
          await loadFixture(deployContracts);

        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        // Adding ERC721 to whitelist as FALSE (BlackListed)
        await gfalMarketplace
          .connect(admin)
          .updateCollection(elementalRaidersSkill.address, ERC721, false);

        // Remove Token un-whitelisted
        await gfalMarketplace
          .connect(seller)
          .removeToken(elementalRaidersSkill.address, 0);
      });

      it("Should revert if an user tries to buy a not-whitelistedNFT (removed in the meantime)", async function () {
        const {
          owner,
          admin,
          buyer,
          seller,
          gfalMarketplace,
          gfalToken,
          elementalRaidersSkill,
        } = await loadFixture(deployContracts);

        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        // Adding ERC721 to whitelist as FALSE (BlackListed)
        await gfalMarketplace
          .connect(admin)
          .updateCollection(elementalRaidersSkill.address, ERC721, false);

        await gfalToken
          .connect(buyer)
          .approve(
            gfalMarketplace.address,
            ethers.utils.parseUnits("50", "ether")
          );

        await expect(
          gfalMarketplace
            .connect(buyer)
            .buyToken(elementalRaidersSkill.address, ERC721, seller.address)
        ).to.be.reverted;

        expect(await elementalRaidersSkill.ownerOf(0)).to.equal(
          gfalMarketplace.address
        );
      });

      it("Should revert if an user tries to buy an NFT which has been disapproved after listing", async function () {
        const {
          buyer,
          seller,
          gfalMarketplace,
          gfalToken,
          elementalRaidersSkill,
        } = await loadFixture(deployContracts);

        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        // Remove Token sale from Marketplace
        await gfalMarketplace
          .connect(seller)
          .removeToken(elementalRaidersSkill.address, 0);

        await gfalToken
          .connect(buyer)
          .approve(
            gfalMarketplace.address,
            ethers.utils.parseUnits("50", "ether")
          );

        await expect(
          gfalMarketplace
            .connect(buyer)
            .buyToken(elementalRaidersSkill.address, 0, seller.address)
        ).to.be.reverted;
      });

      it("Should revert if an user tries to buy an NFT with balance but not approved", async function () {
        const { buyer, seller, gfalMarketplace, elementalRaidersSkill } =
          await loadFixture(deployContracts);

        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        // Try to buy without G4AL token approval
        await expect(
          gfalMarketplace
            .connect(buyer)
            .buyToken(elementalRaidersSkill.address, 0, seller.address)
        ).to.be.reverted;

        expect(await elementalRaidersSkill.ownerOf(0)).to.equal(
          gfalMarketplace.address
        );
      });

      it("Should revert if an user tries to add a collection", async function () {
        const { buyer, gfalMarketplace } = await loadFixture(deployContracts);

        // Expect to be reverted
        await expect(
          gfalMarketplace
            .connect(buyer)
            .updateCollection(
              "0x1234567890123456789012345678901234567890",
              ERC721,
              true
            )
        ).to.be.reverted;
      });

      it("Should revert if an user tries to remove a collection", async function () {
        const { buyer, elementalRaidersSkill, gfalMarketplace } =
          await loadFixture(deployContracts);

        // Expect to find it in the mapping as true
        await expect(
          gfalMarketplace
            .connect(buyer)
            .updateCollection(elementalRaidersSkill.address, ERC721, true)
        ).to.be.reverted;
      });

      it("Should revert if an user tries to updateRoyaltiesInBasisPoints & should set if caller is admin", async function () {
        const { buyer, gfalMarketplace, admin } = await loadFixture(
          deployContracts
        );
        const oldRoyaltyPoints = await gfalMarketplace.royaltiesInBasisPoints();
        const newRoyaltyPoints = 500;

        await expect(
          gfalMarketplace
            .connect(buyer)
            .updateRoyaltiesInBasisPoints(newRoyaltyPoints)
        ).to.be.reverted;

        await gfalMarketplace
          .connect(admin)
          .updateRoyaltiesInBasisPoints(newRoyaltyPoints);

        expect(await gfalMarketplace.royaltiesInBasisPoints()).to.equal(
          newRoyaltyPoints
        );

        expect(
          await gfalMarketplace
            .connect(admin)
            .updateRoyaltiesInBasisPoints(newRoyaltyPoints)
        )
          .to.emit(gfalMarketplace, "RoyaltiesInBasisPointsUpdated")
          .withArgs(oldRoyaltyPoints, newRoyaltyPoints);
      });

      it("Should revert if royaltypoints exceeds 100%", async function () {
        const { buyer, gfalMarketplace, admin } = await loadFixture(
          deployContracts
        );
        const newRoyaltyPoints = 10001;

        await expect(
          gfalMarketplace
            .connect(admin)
            .updateRoyaltiesInBasisPoints(newRoyaltyPoints)
        ).to.be.reverted;
      });

      it("Should revert if invalid tokenStandard", async function () {
        const {
          buyer,
          seller,
          elementalRaidersSkill,
          elementalRaidersSkin,
          gfalMarketplace,
          erc1155MockUp,
          admin,
        } = await loadFixture(deployContracts);

        await gfalMarketplace
          .connect(admin)
          .updateCollection(elementalRaidersSkill.address, 0, true);

        await gfalMarketplace
          .connect(admin)
          .updateCollection(erc1155MockUp.address, 1, true);

        await expect(
          gfalMarketplace
            .connect(admin)
            .updateCollection(elementalRaidersSkin.address, 2, true)
        ).to.be.reverted;
      });

      it("Should increment saleID after each sale", async function () {
        const {
          buyer,
          seller,
          elementalRaidersSkill,
          gfalMarketplace,
          erc1155MockUp,
        } = await loadFixture(deployContracts);

        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            1,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        await gfalMarketplace
          .connect(seller)
          .sellToken(
            erc1155MockUp.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          );

        const sale0ERC721 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          0
        );
        const sale1ERC721 = await gfalMarketplace.tokensForSale721(
          elementalRaidersSkill.address,
          1
        );
        const sale0ERC1155 = await gfalMarketplace.tokensForSale1155(
          erc1155MockUp.address,
          0,
          seller.address
        );

        expect(sale0ERC721.saleId).to.equal(0);
        expect(sale1ERC721.saleId).to.equal(1);
        expect(sale0ERC1155.saleId).to.equal(2);

        await expect(
          gfalMarketplace
            .connect(seller)
            .removeToken(elementalRaidersSkill.address, 1)
        )
          .to.emit(gfalMarketplace, "RemoveToken")
          .withArgs(elementalRaidersSkill.address, 1, seller.address, 1);
      });
    });
  });

  describe("Events", function () {
    it("Should emit an event SellToken on put for sell a token", async function () {
      const {
        seller,
        buyer,
        elementalRaidersSkill,
        gfalToken,
        gfalMarketplace,
      } = await loadFixture(deployContracts);

      await expect(
        await gfalMarketplace
          .connect(seller)
          .sellToken(
            elementalRaidersSkill.address,
            0,
            1,
            ethers.utils.parseUnits("50", "ether"),
            false
          )
      )
        .to.emit(gfalMarketplace, "SellToken")
        .withArgs(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false,
          seller.address,
          0
        );
    });

    it("Should emit an event RemoveToken on remove from sell a token", async function () {
      const { seller, elementalRaidersSkill, gfalMarketplace } =
        await loadFixture(deployContracts);

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));

      // Removes it
      await expect(
        await gfalMarketplace
          .connect(seller)
          .removeToken(elementalRaidersSkill.address, 0)
      )
        .to.emit(gfalMarketplace, "RemoveToken")
        .withArgs(elementalRaidersSkill.address, 0, seller.address, 0);
    });

    it("Should emit an event BuyToken buying a token ERC721", async function () {
      const {
        seller,
        buyer,
        elementalRaidersSkill,
        gfalToken,
        gfalMarketplace,
      } = await loadFixture(deployContracts);

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));

      // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
      await gfalToken
        .connect(buyer)
        .approve(
          gfalMarketplace.address,
          ethers.utils.parseUnits("50", "ether")
        );

      // Buyer buys NFTs from seller
      await expect(
        await gfalMarketplace
          .connect(buyer)
          .buyToken(elementalRaidersSkill.address, 0, seller.address)
      )
        .to.emit(gfalMarketplace, "BuyToken")
        .withArgs(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          anyValue,
          anyValue,
          seller.address,
          buyer.address,
          0
        );

      expect(await elementalRaidersSkill.ownerOf(0)).to.equal(buyer.address);
    });
  });

  describe("Transfers", function () {
    it("Should put a whitelisted collection token for sell in $GFAL", async function () {
      const { seller, elementalRaidersSkill, gfalMarketplace } =
        await loadFixture(deployContracts);

      // he sells it for 50 GFAL
      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));
      const sellerList = await gfalMarketplace.getSellersList();
      expect(sellerList[0]).to.equal(seller.address);
    });

    it("Should put a whitelisted collection token for sell in Dollars", async function () {
      const { seller, elementalRaidersSkill, gfalMarketplace } =
        await loadFixture(deployContracts);

      // he sells it for 5$ that should be converted to 50 GFAL
      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("5", "ether"),
          true
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("5", "ether"));

      const sellerList = await gfalMarketplace.getSellersList();
      expect(sellerList[0]).to.equal(seller.address);
    });

    it("Should adjust the price for a token already for sell", async function () {
      const { seller, elementalRaidersSkill, gfalMarketplace } =
        await loadFixture(deployContracts);

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));

      await gfalMarketplace
        .connect(seller)
        .removeToken(elementalRaidersSkill.address, 0);

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("100", "ether"),
          true
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("100", "ether"));

      const sellerList = await gfalMarketplace.getSellersList();
      expect(sellerList[0]).to.equal(seller.address);
      expect(sellerList[1]).to.equal(undefined);
    });

    it("Should remove a token from sell", async function () {
      const { seller, elementalRaidersSkill, gfalMarketplace } =
        await loadFixture(deployContracts);

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));

      // Removes it
      await gfalMarketplace
        .connect(seller)
        .removeToken(elementalRaidersSkill.address, 0);

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("0", "ether"));
    });

    it("Should put on sale a token ERC721 and modify the price", async function () {
      const {
        seller,
        buyer,
        elementalRaidersSkill,
        gfalToken,
        gfalMarketplace,
        proxy,
      } = await loadFixture(deployContracts);

      await gfalMarketplace
        .connect(seller)
        .sellToken(elementalRaidersSkill.address, 0, 1, 100, false);

      const sale = await gfalMarketplace.tokensForSale721(
        elementalRaidersSkill.address,
        0
      );

      expect(sale.price).to.equal(100);
      expect(sale.isDollar).to.equal(false);

      await gfalMarketplace
        .connect(seller)
        .updatePrice(elementalRaidersSkill.address, 0, 10, true);

      const saleModified = await gfalMarketplace.tokensForSale721(
        elementalRaidersSkill.address,
        0
      );

      expect(saleModified.price).to.equal(10);
      expect(saleModified.isDollar).to.equal(true);
    });

    it("Should buy a token ERC721 that is for sell in $GFAL", async function () {
      const {
        seller,
        buyer,
        elementalRaidersSkill,
        gfalToken,
        gfalMarketplace,
        proxy,
      } = await loadFixture(deployContracts);

      // Seller approves MARKETPLACE to manage NFTs SKIN

      // Seller lists the Sale
      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));

      // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
      await gfalToken
        .connect(buyer)
        .approve(
          gfalMarketplace.address,
          ethers.utils.parseUnits("50", "ether")
        );

      // NFT balance
      expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(1);
      expect(
        await elementalRaidersSkill.balanceOf(gfalMarketplace.address)
      ).to.equal(1);
      expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(0);

      // Buyer buys NFTs from seller
      await gfalMarketplace
        .connect(buyer)
        .buyToken(elementalRaidersSkill.address, 0, seller.address);

      // NFT balance
      expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(1);
      expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(1);

      // Seller, buyer and Fee Collector balances checks
      expect(await gfalToken.balanceOf(seller.address)).to.equal(
        ethers.utils.parseUnits("45", "ether")
      );
      expect(await gfalToken.balanceOf(buyer.address)).to.equal(
        ethers.utils.parseUnits("50", "ether")
      );
      expect(
        await gfalToken.balanceOf(await proxy.getRoyaltiesCollector())
      ).to.equal(ethers.utils.parseUnits("5", "ether")); // considering previous 50+50 for minting

      // Volume increase check
      expect(await gfalMarketplace.volume()).to.equal(
        ethers.utils.parseUnits("50", "ether")
      );

      // Check tokensForSale721 has been removed from mapping (marked as isForSale false, etc.)
      const tokensForSale = await gfalMarketplace.tokensForSale721(
        elementalRaidersSkill.address,
        0
      );
      expect(tokensForSale.price).to.equal(
        ethers.utils.parseUnits("0", "ether")
      );
      expect(tokensForSale.isDollar).to.equal(false);
      expect(tokensForSale.isForSale).to.equal(false);
    });
    it("Should buy a token ERC721 that is for sell in Dollars", async function () {
      const {
        seller,
        buyer,
        elementalRaidersSkill,
        gfalToken,
        proxy,
        gfalMarketplace,
      } = await loadFixture(deployContracts);

      // he sells it for 5$ that should be converted to 50 GFAL
      await gfalMarketplace
        .connect(seller)
        .sellToken(
          elementalRaidersSkill.address,
          0,
          1,
          ethers.utils.parseUnits("5", "ether"),
          true
        );

      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).isDollar
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale721(
            elementalRaidersSkill.address,
            0
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("5", "ether")); // considering previous 50+50 for minting

      // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
      await gfalToken
        .connect(buyer)
        .approve(
          gfalMarketplace.address,
          ethers.utils.parseUnits("50", "ether")
        );

      // NFT balance
      expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(1);
      expect(
        await elementalRaidersSkill.balanceOf(gfalMarketplace.address)
      ).to.equal(1);
      expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(0);

      // Buyer buys NFTs from seller
      await gfalMarketplace
        .connect(buyer)
        .buyToken(elementalRaidersSkill.address, 0, seller.address);

      // NFT balance
      expect(await elementalRaidersSkill.balanceOf(seller.address)).to.equal(1);
      expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(1);

      // Seller, buyer and Fee Collector balances checks
      expect(await gfalToken.balanceOf(seller.address)).to.equal(
        ethers.utils.parseUnits("45", "ether")
      );
      expect(await gfalToken.balanceOf(buyer.address)).to.equal(
        ethers.utils.parseUnits("50", "ether")
      );
      expect(
        await gfalToken.balanceOf(await proxy.getRoyaltiesCollector())
      ).to.equal(ethers.utils.parseUnits("5", "ether"));

      // Volume increase check
      expect(await gfalMarketplace.volume()).to.equal(
        ethers.utils.parseUnits("50", "ether")
      );

      // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
      const getOnSaleTokenIds = await gfalMarketplace.tokensForSale721(
        elementalRaidersSkill.address,
        0
      );
      expect(getOnSaleTokenIds.seller).to.deep.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(getOnSaleTokenIds.price).to.deep.equal(BigNumber.from(0));
    });
  });

  describe("Workflow ERC1155", function () {
    it("Should buy a tokens ERC1155 with same IDs that are for sell in $GFAL", async function () {
      const {
        seller,
        seller2,
        buyer,
        proxy,
        gfalToken,
        gfalMarketplace,
        erc1155MockUp,
      } = await loadFixture(deployContracts);

      // Seller 1 workflow

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          erc1155MockUp.address,
          0,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );

      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 0)
      ).to.equal(1);

      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            0,
            seller.address
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            0,
            seller.address
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            0,
            seller.address
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));
      // Seller 2 workflow

      await gfalMarketplace
        .connect(seller2)
        .sellToken(
          erc1155MockUp.address,
          1,
          1,
          ethers.utils.parseUnits("50", "ether"),
          false
        );
      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            1,
            seller2.address
          )
        ).isForSale
      ).to.equal(true);
      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            1,
            seller2.address
          )
        ).isDollar
      ).to.equal(false);
      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            1,
            seller2.address
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("50", "ether"));

      // NFT balance
      expect(await erc1155MockUp.balanceOf(seller.address, 0)).to.equal(9);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 0)
      ).to.equal(1);
      expect(await erc1155MockUp.balanceOf(seller2.address, 1)).to.equal(9);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 1)
      ).to.equal(1);
      expect(await erc1155MockUp.balanceOf(buyer.address, 0)).to.equal(0);

      // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
      await gfalToken
        .connect(buyer)
        .approve(
          gfalMarketplace.address,
          ethers.utils.parseUnits("100", "ether")
        );

      // Buyer buys NFTs from seller
      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 0, seller.address);
      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 1, seller2.address);

      // NFT balance
      expect(await erc1155MockUp.balanceOf(seller.address, 0)).to.equal(9);
      expect(await erc1155MockUp.balanceOf(seller2.address, 1)).to.equal(9);
      expect(await erc1155MockUp.balanceOf(buyer.address, 0)).to.equal(1);
      expect(await erc1155MockUp.balanceOf(buyer.address, 1)).to.equal(1);

      // Seller, buyer and Fee Collector balances checks
      expect(await gfalToken.balanceOf(seller.address)).to.equal(
        ethers.utils.parseUnits("45", "ether")
      );
      expect(await gfalToken.balanceOf(seller2.address)).to.equal(
        ethers.utils.parseUnits("45", "ether")
      );
      expect(await gfalToken.balanceOf(buyer.address)).to.equal(
        ethers.utils.parseUnits("0", "ether")
      );
      expect(
        await gfalToken.balanceOf(await proxy.getRoyaltiesCollector())
      ).to.equal(ethers.utils.parseUnits("10", "ether")); // considering previous 50+50 for minting

      // Volume increase check
      expect(await gfalMarketplace.volume()).to.equal(
        ethers.utils.parseUnits("100", "ether")
      );

      // Check tokensForSale1155 from Seller1 has been removed from mapping (marked as isForSale false, etc.)
      const tokensForSale1 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        0,
        seller.address
      );
      expect(tokensForSale1.price).to.equal(
        ethers.utils.parseUnits("0", "ether")
      );
      expect(tokensForSale1.isDollar).to.equal(false);
      expect(tokensForSale1.isForSale).to.equal(false);

      // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
      const tokensForSale2 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        0,
        seller2.address
      );
      expect(tokensForSale2.price).to.equal(
        ethers.utils.parseUnits("0", "ether")
      );
      expect(tokensForSale2.isDollar).to.equal(false);
      expect(tokensForSale2.isForSale).to.equal(false);

      // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
      const getOnSaleTokenIds = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        0,
        seller2.address
      );

      expect(getOnSaleTokenIds.seller).to.deep.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(getOnSaleTokenIds.price).to.deep.equal(BigNumber.from(0));

      // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
      const getOnSaleTokenIds2 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        1,
        seller2.address
      );

      expect(getOnSaleTokenIds2.seller).to.deep.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(getOnSaleTokenIds2.price).to.deep.equal(BigNumber.from(0));
    });

    it("Should buy a tokens ERC1155 with same IDs that are for sell in Dollars", async function () {
      const {
        seller,
        seller2,
        buyer,
        erc1155MockUp,
        proxy,
        gfalToken,
        gfalMarketplace,
      } = await loadFixture(deployContracts);

      // Seller 1 workflow

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          erc1155MockUp.address,
          0,
          1,
          ethers.utils.parseUnits("5", "ether"),
          true
        );

      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            0,
            seller.address
          )
        ).isForSale
      ).to.equal(true);

      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            0,
            seller.address
          )
        ).isDollar
      ).to.equal(true);

      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            0,
            seller.address
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("5", "ether"));

      // Seller 2 workflow

      await gfalMarketplace
        .connect(seller2)
        .sellToken(
          erc1155MockUp.address,
          1,
          1,
          ethers.utils.parseUnits("5", "ether"),
          true
        );

      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            1,
            seller2.address
          )
        ).isForSale
      ).to.equal(true);

      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            1,
            seller2.address
          )
        ).isDollar
      ).to.equal(true);

      expect(
        (
          await gfalMarketplace.tokensForSale1155(
            erc1155MockUp.address,
            1,
            seller2.address
          )
        ).price
      ).to.equal(ethers.utils.parseUnits("5", "ether"));

      // NFT balance id: 0
      expect(await erc1155MockUp.balanceOf(seller.address, 0)).to.equal(9);
      expect(await erc1155MockUp.balanceOf(buyer.address, 0)).to.equal(0);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 0)
      ).to.equal(1);

      // NFT balance id: 1
      expect(await erc1155MockUp.balanceOf(seller2.address, 1)).to.equal(9);
      expect(await erc1155MockUp.balanceOf(buyer.address, 1)).to.equal(0);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 1)
      ).to.equal(1);

      // Buyer approves the marketplace contract for spending GFAL to buy NFT afterward
      await gfalToken
        .connect(buyer)
        .approve(
          gfalMarketplace.address,
          ethers.utils.parseUnits("100", "ether")
        );

      // Buyer buys NFTs from seller
      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 0, seller.address);

      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 1, seller2.address);

      // NFT balance
      expect(await erc1155MockUp.balanceOf(seller.address, 0)).to.equal(9);
      expect(await erc1155MockUp.balanceOf(seller2.address, 1)).to.equal(9);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 0)
      ).to.equal(0);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 0)
      ).to.equal(0);
      expect(await erc1155MockUp.balanceOf(buyer.address, 0)).to.equal(1);
      expect(await erc1155MockUp.balanceOf(buyer.address, 1)).to.equal(1);

      // Seller, buyer and Fee Collector balances checks
      expect(await gfalToken.balanceOf(seller.address)).to.equal(
        ethers.utils.parseUnits("45", "ether")
      );
      expect(await gfalToken.balanceOf(seller2.address)).to.equal(
        ethers.utils.parseUnits("45", "ether")
      );
      expect(await gfalToken.balanceOf(buyer.address)).to.equal(
        ethers.utils.parseUnits("0", "ether")
      );
      expect(
        await gfalToken.balanceOf(await proxy.getRoyaltiesCollector())
      ).to.equal(ethers.utils.parseUnits("10", "ether")); // considering previous 50+50 for minting

      // Volume increase check
      expect(await gfalMarketplace.volume()).to.equal(
        ethers.utils.parseUnits("100", "ether")
      );

      // Check tokensForSale1155 from Seller1 has been removed from mapping (marked as isForSale false, etc.)
      const tokensForSale0 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        0,
        seller.address
      );
      expect(tokensForSale0.price).to.equal(
        ethers.utils.parseUnits("0", "ether")
      );
      expect(tokensForSale0.isDollar).to.equal(false);
      expect(tokensForSale0.isForSale).to.equal(false);

      // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
      const tokensForSale1 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        1,
        seller2.address
      );
      expect(tokensForSale1.price).to.equal(
        ethers.utils.parseUnits("0", "ether")
      );
      expect(tokensForSale1.isDollar).to.equal(false);
      expect(tokensForSale1.isForSale).to.equal(false);
    });

    it("Owner should be able to add a collection", async function () {
      const { owner, admin, gfalMarketplace } = await loadFixture(
        deployContracts
      );

      // Owner addCollection
      await gfalMarketplace
        .connect(admin)
        .updateCollection(
          "0x1234567890123456789012345678901234567890",
          ERC721,
          true
        );

      // Expect to find it in the mapping as true
      expect(
        (
          await gfalMarketplace.whitelistNFTs(
            "0x1234567890123456789012345678901234567890"
          )
        ).tokenStandard
      ).to.equal(0);
      expect(
        (
          await gfalMarketplace.whitelistNFTs(
            "0x1234567890123456789012345678901234567890"
          )
        ).allowed
      ).to.equal(true);
    });

    it("Owner should be able to remove a collection", async function () {
      const { owner, admin, elementalRaidersSkill, gfalMarketplace } =
        await loadFixture(deployContracts);

      // Owner addCollection
      await gfalMarketplace
        .connect(admin)
        .updateCollection(elementalRaidersSkill.address, ERC721, false);

      // Expect to find it in the mapping as true
      expect(
        (await gfalMarketplace.whitelistNFTs(elementalRaidersSkill.address))
          .tokenStandard
      ).to.equal(0);
      expect(
        (await gfalMarketplace.whitelistNFTs(elementalRaidersSkill.address))
          .allowed
      ).to.equal(false);
    });

    it("Mint ERC1155, sell and remove", async function () {
      const {
        owner,
        admin,
        seller,
        seller2,
        buyer,
        erc1155MockUp,
        proxy,
        gfalToken,
        gfalMarketplace,
      } = await loadFixture(deployContracts);

      await erc1155MockUp.connect(seller2).mint(100);

      await gfalMarketplace
        .connect(seller2)
        .sellToken(erc1155MockUp.address, 2, 100, 1, true);

      await gfalMarketplace
        .connect(seller2)
        .removeToken(erc1155MockUp.address, 2);

      expect(await erc1155MockUp.balanceOf(seller2.address, 2)).to.equal(100);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 2)
      ).to.equal(0);
    });

    it("Should return sellers list", async function () {
      const {
        owner,
        admin,
        seller,
        seller2,
        buyer,
        erc1155MockUp,
        proxy,
        gfalToken,
        gfalMarketplace,
      } = await loadFixture(deployContracts);

      await gfalMarketplace
        .connect(seller)
        .sellToken(
          erc1155MockUp.address,
          0,
          1,
          ethers.utils.parseUnits("5", "ether"),
          true
        );

      const sellersList = await gfalMarketplace.getSellersList();
      expect(sellersList.length).to.equal(1);
    });

    it("Mint 100 copies of 4 ERC1155 NFTs and sell them", async function () {
      const {
        owner,
        admin,
        seller,
        seller2,
        buyer,
        erc1155MockUp,
        proxy,
        gfalToken,
        gfalMarketplace,
      } = await loadFixture(deployContracts);
      const PRICE_GFAL_10_NFT = ethers.utils.parseEther("10");
      const AMOUNT = "10";
      const PRICE_USD_10_NFT = ethers.utils.parseEther("1");
      const TOTAL_AMOUNT_PURCHASES = ethers.utils.parseEther("40");
      const BALANCE_FEECOLLECTOR = await gfalToken.balanceOf(
        proxy.getFeeCollector()
      );
      const BALANCE_SELLER_BEFORE_SALE = await gfalToken.balanceOf(
        seller.address
      );
      const BALANCE_SELLER2_BEFORE_SALE = await gfalToken.balanceOf(
        seller2.address
      );
      const BALANCE_BUYER_BEFORE_SALE = await gfalToken.balanceOf(
        buyer.address
      );

      // Mint 100 NFTs ID 2 & 3 by seller
      await erc1155MockUp.connect(seller).mint(100);
      await erc1155MockUp.connect(seller).mint(100);

      // Mint 100 NFTs ID 4 & 5 by seller2
      await erc1155MockUp.connect(seller2).mint(100);
      await erc1155MockUp.connect(seller2).mint(100);
      await erc1155MockUp.connect(seller2).mint(100);

      // List NFTs in GFAL from Seller
      await gfalMarketplace
        .connect(seller)
        .sellToken(erc1155MockUp.address, 2, AMOUNT, PRICE_GFAL_10_NFT, false);

      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 2)
      ).to.equal(AMOUNT);

      await gfalMarketplace
        .connect(seller)
        .sellToken(erc1155MockUp.address, 3, AMOUNT, PRICE_GFAL_10_NFT, false);

      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 3)
      ).to.equal(AMOUNT);
      // List NFTs in USD from Seller2
      await gfalMarketplace
        .connect(seller2)
        .sellToken(erc1155MockUp.address, 4, AMOUNT, PRICE_USD_10_NFT, true);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 4)
      ).to.equal(AMOUNT);

      await gfalMarketplace
        .connect(seller2)
        .sellToken(erc1155MockUp.address, 5, AMOUNT, PRICE_USD_10_NFT, true);
      expect(
        await erc1155MockUp.balanceOf(gfalMarketplace.address, 5)
      ).to.equal(AMOUNT);

      console.log("Balance:");
      await expect(
        gfalMarketplace
          .connect(seller2)
          .sellToken(erc1155MockUp.address, 5, 100, PRICE_GFAL_10_NFT, false)
      ).to.be.reverted;

      const NFTsSale_2 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        2,
        seller.address
      );
      const NFTsSale_3 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        3,
        seller.address
      );
      const NFTsSale_4 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        4,
        seller2.address
      );
      const NFTsSale_5 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        5,
        seller2.address
      );

      // Seller
      expect(NFTsSale_2.seller).to.equal(seller.address);
      expect(NFTsSale_3.seller).to.equal(seller.address);
      expect(NFTsSale_2.price).to.equal(PRICE_GFAL_10_NFT);
      expect(NFTsSale_3.price).to.equal(PRICE_GFAL_10_NFT);

      // Seller 2
      expect(NFTsSale_4.seller).to.equal(seller2.address);
      expect(NFTsSale_5.seller).to.equal(seller2.address);
      expect(NFTsSale_4.price).to.equal(PRICE_USD_10_NFT);
      expect(NFTsSale_5.price).to.equal(PRICE_USD_10_NFT);

      // Set approval from the buyer to the Marketplace to manage GFAL
      await gfalToken
        .connect(buyer)
        .approve(gfalMarketplace.address, TOTAL_AMOUNT_PURCHASES);

      // Buy NFTs in Marketplace
      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 2, seller.address);
      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 3, seller.address);
      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 4, seller2.address);
      await gfalMarketplace
        .connect(buyer)
        .buyToken(erc1155MockUp.address, 5, seller2.address);

      const BALANCE_SELLER_AFTER_SALE = await gfalToken.balanceOf(
        seller.address
      );

      expect(BALANCE_BUYER_BEFORE_SALE).to.be.greaterThan(
        await gfalToken.balanceOf(buyer.address)
      );
      expect(await gfalToken.balanceOf(seller.address)).to.be.greaterThan(
        BALANCE_SELLER_BEFORE_SALE
      );
      expect(await gfalToken.balanceOf(seller2.address)).to.be.greaterThan(
        BALANCE_SELLER2_BEFORE_SALE
      );
      expect(await proxy.getFeeCollector()).to.be.greaterThan(
        BALANCE_FEECOLLECTOR
      );

      // Check balances erc1155
      expect(await erc1155MockUp.balanceOf(seller.address, 2)).to.equal(90);
      expect(await erc1155MockUp.balanceOf(seller.address, 3)).to.equal(90);
      expect(await erc1155MockUp.balanceOf(seller2.address, 4)).to.equal(90);
      expect(await erc1155MockUp.balanceOf(seller2.address, 5)).to.equal(90);
      expect(await erc1155MockUp.balanceOf(buyer.address, 2)).to.equal(10);
      expect(await erc1155MockUp.balanceOf(buyer.address, 3)).to.equal(10);
      expect(await erc1155MockUp.balanceOf(buyer.address, 4)).to.equal(10);
      expect(await erc1155MockUp.balanceOf(buyer.address, 5)).to.equal(10);
      expect(await erc1155MockUp.balanceOf(admin.address, 2)).to.equal(0);
      expect(await erc1155MockUp.balanceOf(admin.address, 3)).to.equal(0);
      expect(await erc1155MockUp.balanceOf(admin.address, 4)).to.equal(0);
      expect(await erc1155MockUp.balanceOf(admin.address, 5)).to.equal(0);

      const NFTsSaleAfter_1 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        1,
        seller.address
      );
      const NFTsSaleAfter_2 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        2,
        seller.address
      );
      const NFTsSaleAfter_3 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        3,
        seller.address
      );
      const NFTsSaleAfter_4 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        4,
        seller2.address
      );
      const NFTsSaleAfter_5 = await gfalMarketplace.tokensForSale1155(
        erc1155MockUp.address,
        5,
        seller2.address
      );

      expect(NFTsSaleAfter_1.seller).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(NFTsSaleAfter_2.seller).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(NFTsSaleAfter_3.seller).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(NFTsSaleAfter_4.seller).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(NFTsSaleAfter_5.seller).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(NFTsSaleAfter_1.price).to.equal(0);
      expect(NFTsSaleAfter_2.price).to.equal(0);
      expect(NFTsSaleAfter_3.price).to.equal(0);
      expect(NFTsSaleAfter_4.price).to.equal(0);
      expect(NFTsSaleAfter_5.price).to.equal(0);
    });
  });
});
