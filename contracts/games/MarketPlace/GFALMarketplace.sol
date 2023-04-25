// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../../utils/OracleConsumer.sol";
import "../../utils/G4ALProxy.sol";

// import "hardhat/console.sol";
/**
 *@title GFALMarketplace
 *@dev A smart contract for a marketplace where users can sell and buy ERC721 and ERC1155 tokens. It uses OpenZeppelin contracts as libraries and inherits from ReentrancyGuard to prevent reentrancy attacks.
 */
contract GFALMarketplace is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Proxy to store variables as addresses from contracts and from wallets
    G4ALProxy public g4alProxy;

    mapping(address => Whitelist) public whitelistNFTs;

    // Marketplace
    mapping(address => mapping(uint256 => Sale)) public tokensForSale; // collectionAddress => (tokenId => Sale)
    address[] public sellersList; // to allow iterating in order to get on sale tokens for contractAddress and sellerAddress
    mapping(address => bool) public knownSellers; // to avoid repeated sellersList.push(sellerAddress)
    uint256 public volume; // $GFAL all-time-volume
    uint256 public royaltiesInBasisPoints;
    bool public isActive; // It will allow user to trade NFTs. They will always will be able to unlist them.

    modifier onlyOwner() {
        require(msg.sender == g4alProxy.owner(), "Not owner");
        _;
    }

    constructor(uint256 _royaltiesInBasisPoints, address _g4alProxy) {
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
        g4alProxy = G4ALProxy(_g4alProxy);
        isActive = true;
    }

    // Structures
    /**
     * @dev Structure to hold the sale information.
     */
    struct Sale {
        uint256 price; // Price = 1:1 price x amount
        bool isDollar;
        bool isForSale;
        uint256 amount;
        address seller;
    }

    /**
     * @dev Structure to hold the whitelist information of a collection.
     */
    struct Whitelist {
        bool allowed;
        TokenStandard tokenStandard;
    }

    /**
     * @dev Enum for different token standards.
     */
    enum TokenStandard {
        ERC721,
        ERC1155
    }

    // Events
    event SellToken(
        address collection,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        bool isDollar,
        address seller
    );
    event BuyToken(
        address collection,
        uint tokenId,
        uint256 amount,
        uint price,
        uint sellerRevenue,
        uint royalties,
        address seller,
        address buyer
    );
    event RemoveToken(address collection, uint256 tokenId, address seller);
    event ContractStatusUpdated(bool isActive);

    // Modifiers
    /**
     *@dev Modifier to check if the token is tradable based on whitelisted information and ownership.
     *@param contractAddress The address of the NFT contract.
     *@param from The address of the token owner.
     *@param tokenId The ID of the token being traded.
     *Requirements:
     *The collection must be whitelisted.
     *The token must belong to the user or not exist in the case of an ERC721.
     */
    modifier onlyTradableToken(
        address contractAddress,
        address from,
        uint256 tokenId
    ) {
        Whitelist memory collection = whitelistNFTs[contractAddress];
        require(
            collection.allowed == true,
            "You can sell only tokens about whitelisted collections."
        );
        // Ownership check for ERC721 and ERC1155 based on whitelisted information
        if (collection.tokenStandard == TokenStandard.ERC721) {
            require(
                IERC721Enumerable(contractAddress).ownerOf(tokenId) == from,
                "Token does not belong to user or not existing 721."
            );
        } else {
            require(
                IERC1155(contractAddress).balanceOf(msg.sender, tokenId) != 0,
                "Token does not belong to user or not existing 1155."
            );
        }
        _;
    }

    // -- Marketplace Methods
    /**
     *@dev Allows a user to sell an NFT token on the marketplace.
     *@param contractAddress The address of the NFT contract.
     *@param tokenId The ID of the token being sold.
     *@param amount The amount of tokens being sold.
     *@param price The price of the tokens being sold.
     *@param isDollar A boolean flag indicating whether the price is in dollars or not.
     *@notice This function can only be called by the owner of the token and if the token's collection is whitelisted.
     *@notice The token needs to be approved for spending before it can be sold.
     *@notice The amount cannot be 0, and the marketplace needs to be active and the NFT collection needs to be allowed.
     *@notice If the seller is unknown, they are added to the sellersList array.
     *@notice If the token is an ERC721 token, the amount needs to be 1 and the token needs to be approved for spending.
     *@notice If the token is an ERC1155 token, the token needs to be approved for spending.
     *@notice The details of the sale are stored in the tokensForSale mapping and an event is emitted with the details of the sale.
     */
    function sellToken(
        address contractAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        bool isDollar
    ) external onlyTradableToken(contractAddress, msg.sender, tokenId) {
        require(amount > 0, "Amount cannot be 0");
        require(isActive, "SC Under maintenance");
        require(
            whitelistNFTs[contractAddress].allowed,
            "Not allowed NFT collection"
        );
        require(price != 0, "Cannot put zero as a price");

        // If the seller is unknown, push it to the sellersList array
        if (knownSellers[msg.sender] == false) {
            knownSellers[msg.sender] = true;
            sellersList.push(msg.sender);
        }

        // Check on TokenStandard.ERC721 or ERC1155 in order to look for specific approval
        if (
            whitelistNFTs[contractAddress].tokenStandard == TokenStandard.ERC721
        ) {
            require(amount == 1, "Amount needs to be 1");
            require(
                IERC721Enumerable(contractAddress).getApproved(tokenId) ==
                    address(this),
                "NFT has not been approved for spending 721."
            );
        } else {
            require(
                IERC1155(contractAddress).isApprovedForAll(
                    msg.sender,
                    address(this)
                ) == true,
                "NFT has not been approved for spending 1155."
            );
        }

        tokensForSale[contractAddress][tokenId] = Sale(
            price,
            isDollar,
            true,
            amount,
            msg.sender
        );

        emit SellToken(
            contractAddress,
            tokenId,
            amount,
            price,
            isDollar,
            msg.sender
        );
    }

    // If you purchase an ERC1155 you will purchase the whole sale amount. Example: Seller lists NFTID 152, 5 copies (ERC1155). Buyer will buy the 5 copies for the listed price.
    /**
     *@dev Function to buy an NFT token from a seller
     *@param contractAddress The address of the NFT contract
     *@param tokenId The ID of the NFT token being sold
     *@param seller The address of the seller of the NFT token
     */
    function buyToken(
        address contractAddress,
        uint256 tokenId,
        address seller
    ) external nonReentrant {
        require(isActive, "SC Under maintenance");
        require(
            whitelistNFTs[contractAddress].allowed,
            "Not allowed NFT collection"
        );

        Sale memory sale = tokensForSale[contractAddress][tokenId];
        require(sale.isForSale, "Token is not for sale.");

        // Calculating royalties and wanted price
        uint256 price = sale.isDollar == true // if isDollar expressed listing
            ? OracleConsumer(g4alProxy.oracleConsumer()).getConversionRate(
                sale.price
            ) // convert from USD to GFAL
            : sale.price;
        // otherwise already in GFAL
        (
            uint256 amountAfterRoyalties,
            uint256 royaltiesAmount
        ) = _calculateMarketplaceRoyalties(price);

        // Check ERC20 allowance for buyer
        require(
            IERC20(g4alProxy.gfalToken()).allowance(
                msg.sender,
                address(this)
            ) >= price,
            "GFAL has not been approved for spending."
        );

        // Check NFT type and transfer it accordingly
        if (
            whitelistNFTs[contractAddress].tokenStandard == TokenStandard.ERC721
        ) {
            IERC721Enumerable(contractAddress).safeTransferFrom(
                seller,
                msg.sender,
                tokenId
            );
        } else {
            IERC1155(contractAddress).safeTransferFrom(
                seller,
                msg.sender,
                tokenId,
                sale.amount,
                ""
            );
        }

        // Transferring NFT, sending funds to seller, and sending fees to marketplaceRoyalties
        IERC20(g4alProxy.gfalToken()).safeTransferFrom(
            msg.sender,
            seller,
            amountAfterRoyalties
        );
        IERC20(g4alProxy.gfalToken()).safeTransferFrom(
            msg.sender,
            g4alProxy.royaltiesCollector(),
            royaltiesAmount
        );

        // Increasing marketplace volume
        volume += price;

        // Setting token as not for sell
        tokensForSale[contractAddress][tokenId] = Sale(
            0,
            false,
            false,
            0,
            address(0)
        );

        emit BuyToken(
            contractAddress,
            tokenId,
            sale.amount,
            price,
            amountAfterRoyalties,
            royaltiesAmount,
            seller,
            msg.sender
        );
    }

    /**
     *@dev Function to buy an NFT token from a seller
     *@param contractAddress The address of the NFT contract
     *@param _from The address of the NFT owner (Seller)
     *@param tokenId The ID of the NFT token being sold
     * Note: SC Owner can unlist the NFT token. (Useful in case the seller transfers/sells the NFT to other wallet)
     */
    function removeToken(
        address contractAddress,
        address _from,
        uint256 tokenId
    ) external {
        // Ownership check for ERC721 and ERC1155 based on whitelisted information
        address owner = g4alProxy.owner();

        require(
            msg.sender == _from || msg.sender == owner,
            "Not owner token or owner SC"
        );
        if (
            whitelistNFTs[contractAddress].tokenStandard == TokenStandard.ERC721
        ) {
            require(
                IERC721Enumerable(contractAddress).ownerOf(tokenId) == _from ||
                    msg.sender == owner,
                "Token does not belong to user or not existing 721."
            );
        } else {
            require(
                IERC1155(contractAddress).balanceOf(_from, tokenId) != 0 ||
                    msg.sender == owner,
                "Token does not belong to user or not existing 1155."
            );
        }

        tokensForSale[contractAddress][tokenId] = Sale(
            0,
            false,
            false,
            0,
            address(0)
        );
        emit RemoveToken(contractAddress, tokenId, _from);
    }

    // Private marketplace methods
    /**
     *@dev internal function to calculate the marketplace royalties to split the sale price.
     *@param amount Total selling price to split.
     *@return amountAfterRoyalties selling price substracting the royaltiesAmount.
     *@return royaltiesAmount royaltiesAmount the royaltiesCollector keeps.
     */
    function _calculateMarketplaceRoyalties(
        uint256 amount
    )
        internal
        view
        returns (uint256 amountAfterRoyalties, uint256 royaltiesAmount)
    {
        royaltiesAmount = amount.mul(royaltiesInBasisPoints).div(10000);
        amountAfterRoyalties = amount.sub(royaltiesAmount);
    }

    // Getters
    /**
     *@dev function to get the total of sellers that have list NFTs in GFALMarketplace.
     *@return Array containing the total of sellers.
     */
    function getSellersList() external view returns (address[] memory) {
        return sellersList;
    }

    /**
     *@dev function to get the total of sellers that have sold in GFALMarketplace.
     *@param contractAddress NFT collection address.
     *@param start NFT id from which to start the search.
     *@param end NFT id from which ends the search.
     *@return tokenIds Array with the tokenIds on sale.
     *@return sellers Array containing the sellers of the ids from start to end.
     *@return prices Array containing the prices of the ids from start to end.
     */
    function getOnSaleTokenIds(
        address contractAddress,
        uint256 start,
        uint256 end
    )
        external
        view
        returns (
            uint256[] memory tokenIds,
            address[] memory sellers,
            uint256[] memory prices
        )
    {
        require(end > start, "End must be higher than start");

        uint256[] memory _tokenIds = new uint256[](end - start);
        address[] memory _sellers = new address[](end - start);
        uint256[] memory _prices = new uint256[](end - start);

        uint256 counter = 0;
        for (uint256 i = start; i <= end; i++) {
            Sale memory currentSale = tokensForSale[contractAddress][i];
            if (currentSale.isForSale) {
                _tokenIds[counter] = i;
                _sellers[counter] = currentSale.seller;
                _prices[counter] = currentSale.isDollar
                    ? OracleConsumer(g4alProxy.oracleConsumer())
                        .getConversionRate(currentSale.price) // if isDollar we convert it to GFAL
                    : currentSale.price;
                counter++;
            }
        }
        return (_tokenIds, _sellers, _prices);
    }

    // Owner functions
    /**
     *@dev Function to set the contract status.
     *@param _isActive Boolean value to set the contract status. (True -> Contract activated, False -> Contract not active)
     * Requirements: The caller must be the contract owner.
     */
    function updateContractStatus(bool _isActive) external onlyOwner {
        isActive = _isActive;
        emit ContractStatusUpdated(_isActive);
    }

    /**
     *@dev Function to add or remove NFTs contracts from the whitelist. It will allow or refuse the selling option.
     *@param _collectionAddress NFT collection address.
     *@param _tokenStandard ERC Standar of the NFTscontract. (ERC721 or ERC1155)
     *@param _allowed Boolean value to allow the NFT contract to be minted. (True -> Contract allowed, False -> Contract not allowed)
     * Requirements: The caller must be the contract owner.
     */
    function updateCollection(
        address _collectionAddress,
        TokenStandard _tokenStandard,
        bool _allowed
    ) external onlyOwner {
        whitelistNFTs[_collectionAddress] = Whitelist(_allowed, _tokenStandard);
    }

    /**
     *@dev Function set a new Royalties basis points
     *@param _royaltiesInBasisPoints Royalties amount to set.
     * Note: The amount given as parameter wil be divided between 10.000 as Solidity does not allow decimals. Example: 1.000 / 10.000 = 0.1
     * Requirements: The caller must be the contract owner.
     */
    function updateRoyaltiesInBasisPoints(
        uint256 _royaltiesInBasisPoints
    ) external onlyOwner {
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
    }
}
