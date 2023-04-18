const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { BigNumber } = require("ethers");

const ROYALTIES_IN_BASIS_POINTS = 1000;
const ERC721 = 0;
const ERC1155 = 1;

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
    ] = await ethers.getSigners();

    // Deploy mock dependency contracts
    const GFALToken = await ethers.getContractFactory("GFALToken");
    const gfalToken = await GFALToken.deploy();
    await gfalToken.deployed();

    const Proxy = await ethers.getContractFactory("G4ALProxy");
    const proxy = await Proxy.deploy(gfalToken.address);
    await proxy.deployed();

    // Set Royalty Collector
    await proxy.updateRoyaltiesCollector(royaltyCollector.address);

    const OracleConsumer = await ethers.getContractFactory("OracleConsumer");
    const oracleConsumer = await OracleConsumer.deploy(proxy.address);
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

    const ERC1155forTest = await ethers.getContractFactory("ERC1155forTest");
    const erc1155forTest = await ERC1155forTest.deploy(
      proxy.address,
      "ipfs://"
    );
    await erc1155forTest.deployed();

    // Oracle writes the priceFeed (Mocking external, untested here, workflow)
    await oracleConsumer.updateRateValue(
      ethers.utils.parseUnits("0.1", "ether")
    ); // here we are converting the float to wei to work as "intFloat"

    // Transferring $GFAL tokens to seller and buyer
    await gfalToken.approve(
      owner.address,
      ethers.utils.parseUnits("1100", "ether")
    );
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
    await elementalRaidersSkill.updateMintingPrice(
      1,
      ethers.utils.parseUnits("50", "ether")
    );
    await elementalRaidersSkill.updateMintingPrice(
      2,
      ethers.utils.parseUnits("100", "ether")
    );
    await elementalRaidersSkill.updateMintingPrice(
      3,
      ethers.utils.parseUnits("150", "ether")
    );
    await elementalRaidersSkill.updateMintingPrice(
      4,
      ethers.utils.parseUnits("200", "ether")
    );

    await elementalRaidersSkin.updateMintingPrice(
      1,
      ethers.utils.parseUnits("50", "ether")
    );
    await elementalRaidersSkin.updateMintingPrice(
      2,
      ethers.utils.parseUnits("100", "ether")
    );
    await elementalRaidersSkin.updateMintingPrice(
      3,
      ethers.utils.parseUnits("150", "ether")
    );
    await elementalRaidersSkin.updateMintingPrice(
      4,
      ethers.utils.parseUnits("200", "ether")
    );

    /**
     * Marketplace test workflow
     */

    // Deploy testing contract
    const GFALMarketplace = await ethers.getContractFactory("GFALMarketplace");
    const gfalMarketplace = await GFALMarketplace.deploy(
      ROYALTIES_IN_BASIS_POINTS,
      proxy.address
    );

    // Whitelist ElementalRaidersSkill by owner
    await gfalMarketplace.updateCollection(
      elementalRaidersSkill.address,
      ERC721,
      true
    );
    await gfalMarketplace.updateCollection(
      elementalRaidersSkin.address,
      ERC721,
      true
    );
    await gfalMarketplace.updateCollection(
      erc1155forTest.address,
      ERC1155,
      true
    );

    // Setting addresses in G4AL Proxy
    await proxy.updateOracleConsumer(oracleConsumer.address);
    await proxy.updateMarketPlace(gfalMarketplace.address);

    // Minting x2 NFT as owner to the seller
    // Player (future seller) approves spending to game for minting (x2 - 50+50)
    // Skill
    await gfalToken
      .connect(seller)
      .approve(
        elementalRaidersSkill.address,
        ethers.utils.parseUnits("1000", "ether")
      );

    await elementalRaidersSkill.safeMint(seller.address, 1);
    await elementalRaidersSkill.safeMint(seller.address, 1);

    // Skin
    await gfalToken
      .connect(seller)
      .approve(
        elementalRaidersSkin.address,
        ethers.utils.parseUnits("1000", "ether")
      );

    await elementalRaidersSkin.safeMint(seller.address, 1);
    await elementalRaidersSkin.safeMint(seller.address, 1);

    await erc1155forTest.connect(seller).mint(10);
    await erc1155forTest.connect(seller2).mint(10);

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
      erc1155forTest,
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

      expect(await proxy.oracleConsumer()).to.equal(oracleConsumer.address);
    });

    it("Should set the right $GFAL contract address", async function () {
      const { gfalToken, gfalMarketplace, proxy } = await loadFixture(
        deployContracts
      );

      expect(await proxy.gfalToken()).to.equal(gfalToken.address);
    });

    it("Should set the right royaltiesCollector contract address", async function () {
      const { owner, gfalMarketplace, proxy, royaltyCollector } =
        await loadFixture(deployContracts);

      expect(await proxy.royaltiesCollector()).to.equal(
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

  describe("Reentrancy", function () {
    describe("Workflow", function () {
      describe("Validations", function () {
        // SC PAUSED "isActive"
        it(`Update the contract Status to innactivated "UnderMaintenance" & try to buy listed item`, async function () {
          const {
            seller,
            owner,
            buyer,
            gfalMarketplace,
            elementalRaidersSkill,
            gfalToken,
          } = await loadFixture(deployContracts);

          // Approve
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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

          await gfalMarketplace.connect(owner).updateContractStatus(false);

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
          const { seller, owner, gfalMarketplace, elementalRaidersSkill } =
            await loadFixture(deployContracts);

          // Approve
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

          await gfalMarketplace.connect(owner).updateContractStatus(false);

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
          ).to.be.revertedWith("SC Under maintenance");
        });

        it(`Update the contract Status to innactivated "UnderMaintenance" & try to unlist listed item`, async function () {
          const { seller, owner, gfalMarketplace, elementalRaidersSkill } =
            await loadFixture(deployContracts);

          // Approve
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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

          await gfalMarketplace.connect(owner).updateContractStatus(false);

          expect(
            await gfalMarketplace
              .connect(seller)
              .removeToken(elementalRaidersSkill.address, 0)
          )
            .to.emit(gfalMarketplace, "RemoveToken")
            .withArgs(elementalRaidersSkill.address, 0, seller.address);
        });

        it(`Update the contract Status to innactivated "UnderMaintenance" by Owner`, async function () {
          const { seller, owner, gfalMarketplace, elementalRaidersSkill } =
            await loadFixture(deployContracts);

          // Approve
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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

          await gfalMarketplace.connect(owner).updateContractStatus(false);

          expect(await gfalMarketplace.isActive()).to.equal(false);
        });

        it(`Update the contract Status to innactivated "UnderMaintenance" by NOT Owner`, async function () {
          const { seller, gfalMarketplace, elementalRaidersSkill } =
            await loadFixture(deployContracts);

          await expect(
            gfalMarketplace.connect(seller).updateContractStatus(false)
          ).to.be.revertedWith("Not owner");
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

          const saleBefore = await gfalMarketplace.tokensForSale(
            elementalRaidersSkill.address,
            0,
            seller.address
          );

          expect(saleBefore[2]).to.equal(true);

          await gfalMarketplace
            .connect(buyer)
            .buyToken(elementalRaidersSkill.address, 0, seller.address);

          const saleAfter = await gfalMarketplace.tokensForSale(
            elementalRaidersSkill.address,
            0,
            seller.address
          );

          expect(saleAfter[2]).to.equal(false);
        });

        it("Test the contract's behavior when the price of a token is updated while it is being sold, and check that the buyer is charged the correct price", async function () {
          const { seller, gfalMarketplace, elementalRaidersSkill } =
            await loadFixture(deployContracts);

          // Approve
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);
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

          const NFTsOnSale = await gfalMarketplace.getOnSaleTokenIds(
            elementalRaidersSkill.address,
            seller.address,
            0,
            2
          );

          // IT should be x1 as the selling price is G4AL 1:1
          expect(NFTsOnSale[2][0]).to.equal(
            ethers.utils.parseUnits("50", "ether")
          );

          // IT should be x10 as the selling price is in USD and the GFAL Price is set to 0.10 per Dollar
          expect(NFTsOnSale[2][1]).to.equal(
            ethers.utils.parseUnits("500", "ether")
          );

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

          const NFTsOnSalePriceUpdated =
            await gfalMarketplace.getOnSaleTokenIds(
              elementalRaidersSkill.address,
              seller.address,
              0,
              2
            );

          // IT should be x1 as the selling price is G4AL 1:1
          expect(NFTsOnSalePriceUpdated[2][0]).to.equal(
            ethers.utils.parseUnits("10", "ether")
          );

          // IT should be x10 as the selling price is in USD and the GFAL Price is set to 0.10 per Dollar
          expect(NFTsOnSalePriceUpdated[2][1]).to.equal(
            ethers.utils.parseUnits("100", "ether")
          );
        });

        it("Get right mount of tokens Id on sale by seller on given dates elementalRaidersSkill", async function () {
          // getOnSaleTokenIds()
          const {
            owner,
            buyer,
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

          await elementalRaidersSkill.safeMint(seller.address, 1);
          await elementalRaidersSkill.safeMint(seller.address, 1); // 4 NFTs minted

          expect(await gfalToken.balanceOf(seller.address)).to.equal("0");

          // Approve and list 0, 1, 2 & 3 Skill NFTs in Marketplace
          for (let i = 0; i < 4; i++) {
            await elementalRaidersSkill
              .connect(seller)
              .approve(gfalMarketplace.address, i);

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
          const NFTsOnSale = await gfalMarketplace.getOnSaleTokenIds(
            elementalRaidersSkill.address,
            seller.address,
            0,
            5
          );

          // Check selling NFT id = NFT id
          for (let i = 0; i < NFTsMinted; i++) {
            expect(NFTsOnSale[0][i]).to.equal(i);
          }

          // check selling NFT id by seller
          for (let i = 0; i < NFTsMinted; i++) {
            expect(NFTsOnSale[1][i]).to.equal(seller.address);
          }

          // check selling NFT id by Price
          for (let i = 0; i < NFTsMinted; i++) {
            expect(NFTsOnSale[2][i]).to.equal(
              ethers.utils.parseUnits("50", "ether")
            );
          }

          // Check Not listed NFT (ID, Seller, Price) -> ID 4 is not listed
          expect(NFTsOnSale[0][4]).to.equal("0");
          expect(NFTsOnSale[1][4]).to.equal(
            "0x0000000000000000000000000000000000000000"
          );
          expect(NFTsOnSale[2][4]).to.equal(0);
        });

        it("Should revert if an user tries to sell a not-whitelistedNFT", async function () {
          const {
            owner,
            buyer,
            seller,
            gfalMarketplace,
            gfalToken,
            elementalRaidersSkill,
          } = await loadFixture(deployContracts);

          // Adding ERC721 to whitelist as FALSE (BlackListed)
          await gfalMarketplace
            .connect(owner)
            .updateCollection(elementalRaidersSkill.address, 0, false);

          // Approve Skill NFT for Marketplace
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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
          const { owner, seller, gfalMarketplace, elementalRaidersSkill } =
            await loadFixture(deployContracts);

          // Approve Skill NFT for Marketplace
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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
            .connect(owner)
            .updateCollection(elementalRaidersSkill.address, 0, false);

          // Remove Token un-whitelisted
          await gfalMarketplace
            .connect(seller)
            .removeToken(elementalRaidersSkill.address, 0);
        });

        it("Should revert if an user tries to sell a not-approved NFT", async function () {
          const {
            owner,
            buyer,
            seller,
            gfalMarketplace,
            gfalToken,
            elementalRaidersSkill,
          } = await loadFixture(deployContracts);

          // Selling without approval
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

        it("Should revert if an user tries to buy a not-whitelistedNFT (removed in the meantime)", async function () {
          const {
            owner,
            buyer,
            seller,
            gfalMarketplace,
            gfalToken,
            elementalRaidersSkill,
          } = await loadFixture(deployContracts);

          // Approve Skill NFT for Marketplace
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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
            .connect(owner)
            .updateCollection(elementalRaidersSkill.address, 0, false);

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
        });

        it("Should revert if an user tries to buy an NFT which has been disapproved after listing", async function () {
          const {
            buyer,
            seller,
            gfalMarketplace,
            gfalToken,
            elementalRaidersSkill,
          } = await loadFixture(deployContracts);

          // Approve Skill NFT for Marketplace
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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

          // Approve Skill NFT for Marketplace
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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

        it("Should revert if an user tries to updateRoyaltiesInBasisPoints", async function () {
          const { buyer, gfalMarketplace } = await loadFixture(deployContracts);

          // Expect to find it in the mapping as true
          await expect(
            gfalMarketplace.connect(buyer).updateRoyaltiesInBasisPoints(500)
          ).to.be.reverted;
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

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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
              seller.address
            );
        });

        it("Should emit an event RemoveToken on remove from sell a token", async function () {
          const { seller, elementalRaidersSkill, gfalMarketplace } =
            await loadFixture(deployContracts);

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

          await gfalMarketplace
            .connect(seller)
            .sellToken(
              elementalRaidersSkill.address,
              0,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            );

          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
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
            .withArgs(elementalRaidersSkill.address, 0, seller.address);
        });

        it("Should emit an event BuyToken buying a token ERC721", async function () {
          const {
            seller,
            buyer,
            elementalRaidersSkill,
            gfalToken,
            gfalMarketplace,
          } = await loadFixture(deployContracts);

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
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
              buyer.address
            );
        });
      });

      describe("Transfers", function () {
        it("Should put a whitelisted collection token for sell in $GFAL", async function () {
          const { seller, elementalRaidersSkill, gfalMarketplace } =
            await loadFixture(deployContracts);

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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

          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("50", "ether"));

          await expect(await gfalMarketplace.sellersList(0)).to.equal(
            seller.address
          );
          await expect(
            await gfalMarketplace.knownSellers(seller.address)
          ).to.equal(true);
        });

        it("Should put a whitelisted collection token for sell in Dollars", async function () {
          const { seller, elementalRaidersSkill, gfalMarketplace } =
            await loadFixture(deployContracts);

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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

          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("5", "ether"));

          await expect(await gfalMarketplace.sellersList(0)).to.equal(
            seller.address
          );
          await expect(
            await gfalMarketplace.knownSellers(seller.address)
          ).to.equal(true);
        });

        it("Should adjust the price for a token already for sell", async function () {
          const { seller, elementalRaidersSkill, gfalMarketplace } =
            await loadFixture(deployContracts);

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

          await gfalMarketplace
            .connect(seller)
            .sellToken(
              elementalRaidersSkill.address,
              0,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            );

          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("50", "ether"));

          await expect(await gfalMarketplace.sellersList(0)).to.equal(
            seller.address
          );
          await expect(
            await gfalMarketplace.knownSellers(seller.address)
          ).to.equal(true);

          await gfalMarketplace
            .connect(seller)
            .sellToken(
              elementalRaidersSkill.address,
              0,
              1,
              ethers.utils.parseUnits("100", "ether"),
              true
            );

          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("100", "ether"));

          await expect(await gfalMarketplace.sellersList(0)).to.equal(
            seller.address
          );
          await expect(
            await gfalMarketplace.knownSellers(seller.address)
          ).to.equal(true);
        });

        it("Should remove a token from sell", async function () {
          const { seller, elementalRaidersSkill, gfalMarketplace } =
            await loadFixture(deployContracts);

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

          await gfalMarketplace
            .connect(seller)
            .sellToken(
              elementalRaidersSkill.address,
              0,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            );

          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("50", "ether"));

          await expect(await gfalMarketplace.sellersList(0)).to.equal(
            seller.address
          );
          await expect(
            await gfalMarketplace.knownSellers(seller.address)
          ).to.equal(true);

          // Removes it
          await gfalMarketplace
            .connect(seller)
            .removeToken(elementalRaidersSkill.address, 0);

          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(false);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          await expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("0", "ether"));

          await expect(await gfalMarketplace.sellersList(0)).to.equal(
            seller.address
          );
          await expect(
            await gfalMarketplace.knownSellers(seller.address)
          ).to.equal(true);
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

          // Seller approves MARKETPLACE to manage NFTs SKINs
          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
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
          expect(
            await elementalRaidersSkill.balanceOf(seller.address)
          ).to.equal(2);
          expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(
            0
          );

          // Buyer buys NFTs from seller
          await gfalMarketplace
            .connect(buyer)
            .buyToken(elementalRaidersSkill.address, 0, seller.address);

          // NFT balance
          expect(
            await elementalRaidersSkill.balanceOf(seller.address)
          ).to.equal(1);
          expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(
            1
          );

          // Seller, buyer and Fee Collector balances checks
          expect(await gfalToken.balanceOf(seller.address)).to.equal(
            ethers.utils.parseUnits("45", "ether")
          );
          expect(await gfalToken.balanceOf(buyer.address)).to.equal(
            ethers.utils.parseUnits("50", "ether")
          );
          expect(
            await gfalToken.balanceOf(await proxy.royaltiesCollector())
          ).to.equal(ethers.utils.parseUnits("5", "ether")); // considering previous 50+50 for minting

          // Volume increase check
          expect(await gfalMarketplace.volume()).to.equal(
            ethers.utils.parseUnits("50", "ether")
          );

          // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
          const tokensForSale = await gfalMarketplace.tokensForSale(
            elementalRaidersSkill.address,
            0,
            seller.address
          );
          expect(tokensForSale.price).to.equal(
            ethers.utils.parseUnits("0", "ether")
          );
          expect(tokensForSale.isDollar).to.equal(false);
          expect(tokensForSale.isForSale).to.equal(false);

          // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
          const getOnSaleTokenIds = await gfalMarketplace.getOnSaleTokenIds(
            elementalRaidersSkill.address,
            seller.address,
            0,
            1
          );
          expect(getOnSaleTokenIds.tokenIds).to.deep.equal([BigNumber.from(0)]);
          expect(getOnSaleTokenIds.sellers).to.deep.equal([
            "0x0000000000000000000000000000000000000000",
          ]);
          expect(getOnSaleTokenIds.prices).to.deep.equal([BigNumber.from(0)]);
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

          await elementalRaidersSkill
            .connect(seller)
            .approve(gfalMarketplace.address, 0);

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
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(true);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                elementalRaidersSkill.address,
                0,
                seller.address
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
          expect(
            await elementalRaidersSkill.balanceOf(seller.address)
          ).to.equal(2);
          expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(
            0
          );

          // Buyer buys NFTs from seller
          await gfalMarketplace
            .connect(buyer)
            .buyToken(elementalRaidersSkill.address, 0, seller.address);

          // NFT balance
          expect(
            await elementalRaidersSkill.balanceOf(seller.address)
          ).to.equal(1);
          expect(await elementalRaidersSkill.balanceOf(buyer.address)).to.equal(
            1
          );

          // Seller, buyer and Fee Collector balances checks
          expect(await gfalToken.balanceOf(seller.address)).to.equal(
            ethers.utils.parseUnits("45", "ether")
          );
          expect(await gfalToken.balanceOf(buyer.address)).to.equal(
            ethers.utils.parseUnits("50", "ether")
          );
          expect(
            await gfalToken.balanceOf(await proxy.royaltiesCollector())
          ).to.equal(ethers.utils.parseUnits("5", "ether"));

          // Volume increase check
          expect(await gfalMarketplace.volume()).to.equal(
            ethers.utils.parseUnits("50", "ether")
          );

          // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
          const getOnSaleTokenIds = await gfalMarketplace.getOnSaleTokenIds(
            elementalRaidersSkill.address,
            seller.address,
            0,
            1
          );
          expect(getOnSaleTokenIds.tokenIds).to.deep.equal([BigNumber.from(0)]);
          expect(getOnSaleTokenIds.sellers).to.deep.equal([
            "0x0000000000000000000000000000000000000000",
          ]);
          expect(getOnSaleTokenIds.prices).to.deep.equal([BigNumber.from(0)]);
        });

        // TODO: Test selling bunch of ERC1155 copies (It should be done after)!
        it("Should buy a tokens ERC1155 with same IDs that are for sell in $GFAL", async function () {
          const {
            seller,
            seller2,
            buyer,
            proxy,
            gfalToken,
            gfalMarketplace,
            erc1155forTest,
          } = await loadFixture(deployContracts);

          // Seller 1 workflow
          await erc1155forTest
            .connect(seller)
            .setApprovalForAll(gfalMarketplace.address, true);
          await gfalMarketplace
            .connect(seller)
            .sellToken(
              erc1155forTest.address,
              0,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            );
          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(false);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("50", "ether"));

          // Seller 2 workflow
          await erc1155forTest
            .connect(seller2)
            .setApprovalForAll(gfalMarketplace.address, true);
          await gfalMarketplace
            .connect(seller2)
            .sellToken(
              erc1155forTest.address,
              1,
              1,
              ethers.utils.parseUnits("50", "ether"),
              false
            );
          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                1,
                seller2.address
              )
            ).isForSale
          ).to.equal(true);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                1,
                seller2.address
              )
            ).isDollar
          ).to.equal(false);
          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                1,
                seller2.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("50", "ether"));

          // NFT balance
          expect(await erc1155forTest.balanceOf(seller.address, 0)).to.equal(
            10
          );
          expect(await erc1155forTest.balanceOf(seller2.address, 1)).to.equal(
            10
          );
          expect(await erc1155forTest.balanceOf(buyer.address, 0)).to.equal(0);

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
            .buyToken(erc1155forTest.address, 0, seller.address);
          await gfalMarketplace
            .connect(buyer)
            .buyToken(erc1155forTest.address, 1, seller2.address);

          // NFT balance
          expect(await erc1155forTest.balanceOf(seller.address, 0)).to.equal(9);
          expect(await erc1155forTest.balanceOf(seller2.address, 1)).to.equal(
            9
          );
          expect(await erc1155forTest.balanceOf(buyer.address, 0)).to.equal(1);
          expect(await erc1155forTest.balanceOf(buyer.address, 1)).to.equal(1);

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
            await gfalToken.balanceOf(await proxy.royaltiesCollector())
          ).to.equal(ethers.utils.parseUnits("10", "ether")); // considering previous 50+50 for minting

          // Volume increase check
          expect(await gfalMarketplace.volume()).to.equal(
            ethers.utils.parseUnits("100", "ether")
          );

          // Check tokensForSale from Seller1 has been removed from mapping (marked as isForSale false, etc.)
          const tokensForSale1 = await gfalMarketplace.tokensForSale(
            erc1155forTest.address,
            0,
            seller.address
          );
          expect(tokensForSale1.price).to.equal(
            ethers.utils.parseUnits("0", "ether")
          );
          expect(tokensForSale1.isDollar).to.equal(false);
          expect(tokensForSale1.isForSale).to.equal(false);

          // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
          const tokensForSale2 = await gfalMarketplace.tokensForSale(
            erc1155forTest.address,
            0,
            seller2.address
          );
          expect(tokensForSale2.price).to.equal(
            ethers.utils.parseUnits("0", "ether")
          );
          expect(tokensForSale2.isDollar).to.equal(false);
          expect(tokensForSale2.isForSale).to.equal(false);

          // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
          const getOnSaleTokenIds = await gfalMarketplace.getOnSaleTokenIds(
            erc1155forTest.address,
            seller.address,
            0,
            1
          );
          expect(getOnSaleTokenIds.tokenIds).to.deep.equal([BigNumber.from(0)]);
          expect(getOnSaleTokenIds.sellers).to.deep.equal([
            "0x0000000000000000000000000000000000000000",
          ]);
          expect(getOnSaleTokenIds.prices).to.deep.equal([BigNumber.from(0)]);

          // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
          const getOnSaleTokenIds2 = await gfalMarketplace.getOnSaleTokenIds(
            erc1155forTest.address,
            seller.address,
            0,
            1
          );
          expect(getOnSaleTokenIds2.tokenIds).to.deep.equal([
            BigNumber.from(0),
          ]);
          expect(getOnSaleTokenIds2.sellers).to.deep.equal([
            "0x0000000000000000000000000000000000000000",
          ]);
          expect(getOnSaleTokenIds2.prices).to.deep.equal([BigNumber.from(0)]);
        });

        it("Should buy a tokens ERC1155 with same IDs that are for sell in Dollars", async function () {
          const {
            seller,
            seller2,
            buyer,
            erc1155forTest,
            proxy,
            gfalToken,
            gfalMarketplace,
          } = await loadFixture(deployContracts);

          // Seller 1 workflow
          await erc1155forTest
            .connect(seller)
            .setApprovalForAll(gfalMarketplace.address, true);

          await gfalMarketplace
            .connect(seller)
            .sellToken(
              erc1155forTest.address,
              0,
              1,
              ethers.utils.parseUnits("5", "ether"),
              true
            );

          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                0,
                seller.address
              )
            ).isForSale
          ).to.equal(true);

          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                0,
                seller.address
              )
            ).isDollar
          ).to.equal(true);

          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                0,
                seller.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("5", "ether"));

          // Seller 2 workflow
          await erc1155forTest
            .connect(seller2)
            .setApprovalForAll(gfalMarketplace.address, true);

          await gfalMarketplace
            .connect(seller2)
            .sellToken(
              erc1155forTest.address,
              1,
              1,
              ethers.utils.parseUnits("5", "ether"),
              true
            );

          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                1,
                seller2.address
              )
            ).isForSale
          ).to.equal(true);

          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                1,
                seller2.address
              )
            ).isDollar
          ).to.equal(true);

          expect(
            (
              await gfalMarketplace.tokensForSale(
                erc1155forTest.address,
                1,
                seller2.address
              )
            ).price
          ).to.equal(ethers.utils.parseUnits("5", "ether"));

          // NFT balance
          expect(await erc1155forTest.balanceOf(seller.address, 0)).to.equal(
            10
          );
          expect(await erc1155forTest.balanceOf(seller2.address, 1)).to.equal(
            10
          );
          expect(await erc1155forTest.balanceOf(buyer.address, 0)).to.equal(0);

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
            .buyToken(erc1155forTest.address, 0, seller.address);

          await gfalMarketplace
            .connect(buyer)
            .buyToken(erc1155forTest.address, 1, seller2.address);

          // NFT balance
          expect(await erc1155forTest.balanceOf(seller.address, 0)).to.equal(9);
          expect(await erc1155forTest.balanceOf(seller2.address, 1)).to.equal(
            9
          );
          expect(await erc1155forTest.balanceOf(buyer.address, 0)).to.equal(1);
          expect(await erc1155forTest.balanceOf(buyer.address, 1)).to.equal(1);

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
            await gfalToken.balanceOf(await proxy.royaltiesCollector())
          ).to.equal(ethers.utils.parseUnits("10", "ether")); // considering previous 50+50 for minting

          // Volume increase check
          expect(await gfalMarketplace.volume()).to.equal(
            ethers.utils.parseUnits("100", "ether")
          );

          // Check tokensForSale from Seller1 has been removed from mapping (marked as isForSale false, etc.)
          const tokensForSale1 = await gfalMarketplace.tokensForSale(
            erc1155forTest.address,
            0,
            seller.address
          );
          expect(tokensForSale1.price).to.equal(
            ethers.utils.parseUnits("0", "ether")
          );
          expect(tokensForSale1.isDollar).to.equal(false);
          expect(tokensForSale1.isForSale).to.equal(false);

          // Check tokensForSale has been removed from mapping (marked as isForSale false, etc.)
          const tokensForSale2 = await gfalMarketplace.tokensForSale(
            erc1155forTest.address,
            0,
            seller2.address
          );
          expect(tokensForSale2.price).to.equal(
            ethers.utils.parseUnits("0", "ether")
          );
          expect(tokensForSale2.isDollar).to.equal(false);
          expect(tokensForSale2.isForSale).to.equal(false);

          // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
          const getOnSaleTokenIds1 = await gfalMarketplace.getOnSaleTokenIds(
            erc1155forTest.address,
            seller.address,
            0,
            1
          );
          expect(getOnSaleTokenIds1.tokenIds).to.deep.equal([
            BigNumber.from(0),
          ]);
          expect(getOnSaleTokenIds1.sellers).to.deep.equal([
            "0x0000000000000000000000000000000000000000",
          ]);
          expect(getOnSaleTokenIds1.prices).to.deep.equal([BigNumber.from(0)]);

          // Check getOnSaleTokenIds is returning empty arrays after buying the only token listed
          const getOnSaleTokenIds2 = await gfalMarketplace.getOnSaleTokenIds(
            erc1155forTest.address,
            seller2.address,
            0,
            1
          );
          expect(getOnSaleTokenIds2.tokenIds).to.deep.equal([
            BigNumber.from(0),
          ]);
          expect(getOnSaleTokenIds2.sellers).to.deep.equal([
            "0x0000000000000000000000000000000000000000",
          ]);
          expect(getOnSaleTokenIds2.prices).to.deep.equal([BigNumber.from(0)]);
        });

        it("Owner should be able to add a collection", async function () {
          const { owner, gfalMarketplace } = await loadFixture(deployContracts);

          // Owner addCollection
          await gfalMarketplace
            .connect(owner)
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
          const { owner, elementalRaidersSkill, gfalMarketplace } =
            await loadFixture(deployContracts);

          // Owner addCollection
          await gfalMarketplace
            .connect(owner)
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
      });
    });
  });
});
