// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../../utils/OracleConsumer/IOracleConsumer.sol";
import "../../utils/G4ALProxy/IG4ALProxy.sol";

/**
 *@title GFALMarketplace
 *@dev A smart contract for a marketplace where users can sell and buy ERC721 and ERC1155 tokens. It uses OpenZeppelin contracts as libraries and inherits from ReentrancyGuard to prevent reentrancy attacks.
 */
contract GFALMarketplace is ReentrancyGuard, ERC721Holder, ERC1155Holder {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

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

    IG4ALProxy immutable g4alProxy; // Proxy to store variables as addresses from contracts and from wallets
    address[] private sellersList; // to allow iterating in order to get on sale tokens for contractAddress and sellerAddress
    uint256 public volume; // $GFAL all-time-volume
    uint256 public royaltiesInBasisPoints;
    bool public isActive; // It will allow user to trade NFTs. They will always will be able to unlist them.

    mapping(address => Whitelist) public whitelistNFTs; // Whitelisted NFTs smart contracts
    mapping(address => mapping(uint256 => mapping(address => Sale)))
        public tokensForSale1155; // collectionAddressERC1155 => (tokenId => ( seller => Sale))
    mapping(address => mapping(uint256 => Sale)) public tokensForSale721; // collectionAddressERC721 => (tokenId => Sale)
    mapping(address => bool) private knownSellers; // to avoid repeated sellersList.push(sellerAddress)

    modifier onlyAdmin() {
        require(msg.sender == g4alProxy.getAdmin(), "Not Admin");
        _;
    }

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
            collection.allowed,
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

    event SellToken(
        address indexed collection,
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        bool isDollar,
        address indexed seller
    );
    event BuyToken(
        address indexed collection,
        uint tokenId,
        uint256 amount,
        uint price,
        uint sellerRevenue,
        uint royalties,
        address indexed seller,
        address indexed buyer
    );
    event RemoveToken(
        address indexed collection,
        uint256 tokenId,
        address indexed seller
    );
    event ContractStatusUpdated(bool isActive);
    event RoyaltiesInBasisPointsUpdated(
        uint256 oldRoyalties,
        uint256 newRoyalties
    );

    /**
     * @dev Initializes the GFALMarketplace contract with the given G4ALProxy contract address and the rolaties in basis points to calculate the marketplace fees.
     * @param _royaltiesInBasisPoints Royalties amount to set.
     * @param _g4alProxy The address of the Proxy contract.
     * Note: It sets the Marketplace as Activ by default.
     */
    constructor(uint256 _royaltiesInBasisPoints, address _g4alProxy) {
        require(_g4alProxy != address(0), "Address cannot be 0");
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
        g4alProxy = IG4ALProxy(_g4alProxy);
        isActive = true;
    }

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
        require(isActive, "MarketPlace Under maintenance");
        require(
            whitelistNFTs[contractAddress].allowed,
            "Not allowed NFT collection"
        );
        require(price != 0, "Cannot put zero as a price");

        // If the seller is unknown, push it to the sellersList array
        if (!knownSellers[msg.sender]) {
            knownSellers[msg.sender] = true;
            sellersList.push(msg.sender);
        }

        // Check on TokenStandard.ERC721 or ERC1155 in order to look for specific approval
        if (
            whitelistNFTs[contractAddress].tokenStandard == TokenStandard.ERC721
        ) {
            require(amount == 1, "Amount needs to be 1");
            require(
                tokensForSale721[contractAddress][tokenId].amount == 0,
                "TokenID already on sale"
            );
            require(
                IERC721Enumerable(contractAddress).isApprovedForAll(
                    msg.sender,
                    address(this)
                ),
                "NFTs has not been approved for spending 721."
            );
            tokensForSale721[contractAddress][tokenId] = Sale(
                price,
                isDollar,
                true,
                amount,
                msg.sender
            );
            IERC721Enumerable(contractAddress).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId
            );
        } else {
            require(
                IERC1155(contractAddress).balanceOf(msg.sender, tokenId) >=
                    amount,
                "Not enough token balance 1155"
            );
            require(
                tokensForSale1155[contractAddress][tokenId][msg.sender]
                    .amount == 0,
                "Only one sale per id 1155"
            );
            require(
                IERC1155(contractAddress).isApprovedForAll(
                    msg.sender,
                    address(this)
                ),
                "NFTs has not been approved for spending 1155."
            );
            tokensForSale1155[contractAddress][tokenId][msg.sender] = Sale(
                price,
                isDollar,
                true,
                amount,
                msg.sender
            );
            IERC1155(contractAddress).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId,
                amount,
                ""
            );
        }

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

        bool isERC721 = whitelistNFTs[contractAddress].tokenStandard ==
            TokenStandard.ERC721;

        Sale memory sale;

        if (isERC721) {
            sale = tokensForSale721[contractAddress][tokenId];
            delete tokensForSale721[contractAddress][tokenId]; // Setting token as not for sell
        } else {
            sale = tokensForSale1155[contractAddress][tokenId][seller];
            delete tokensForSale1155[contractAddress][tokenId][seller]; // Setting token as not for sell
        }

        require(sale.isForSale, "Token is not for sale.");

        // Calculating royalties and wanted price
        uint256 price = sale.isDollar // if isDollar expressed listing
            ? IOracleConsumer(g4alProxy.getOracleConsumer()).getConversionRate(
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
            IERC20(g4alProxy.getGfalToken()).allowance(
                msg.sender,
                address(this)
            ) >= price,
            "GFAL has not been approved for spending."
        );

        // Check NFT type and transfer it accordingly
        if (isERC721) {
            IERC721Enumerable(contractAddress).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId
            );
        } else {
            IERC1155(contractAddress).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                sale.amount,
                ""
            );
        }

        // Transferring NFT, sending funds to seller, and sending fees to marketplaceRoyalties
        IERC20(g4alProxy.getGfalToken()).safeTransferFrom(
            msg.sender,
            seller,
            amountAfterRoyalties
        );
        IERC20(g4alProxy.getGfalToken()).safeTransferFrom(
            msg.sender,
            g4alProxy.getRoyaltiesCollector(),
            royaltiesAmount
        );

        // Increasing marketplace volume
        volume += price;

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
     *@param tokenId The ID of the NFT token being sold
     */
    function removeToken(address contractAddress, uint256 tokenId) external {
        if (
            whitelistNFTs[contractAddress].tokenStandard == TokenStandard.ERC721
        ) {
            require(
                tokensForSale721[contractAddress][tokenId].seller == msg.sender,
                "Token does not belong to user or not existing 721."
            );

            delete tokensForSale721[contractAddress][tokenId];
            IERC721Enumerable(contractAddress).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId
            );
        } else {
            require(
                tokensForSale1155[contractAddress][tokenId][msg.sender]
                    .seller == msg.sender,
                "Token does not belong to user or not existing 1155."
            );

            // Amount to transfer back when removing
            uint256 amount = tokensForSale1155[contractAddress][tokenId][
                msg.sender
            ].amount;

            delete tokensForSale1155[contractAddress][tokenId][msg.sender];
            IERC1155(contractAddress).safeTransferFrom(
                address(this),
                msg.sender,
                tokenId,
                amount,
                ""
            );
        }

        emit RemoveToken(contractAddress, tokenId, msg.sender);
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

    // Owner functions
    /**
     *@dev Function to set the contract status.
     *@param _isActive Boolean value to set the contract status. (True -> Contract activated, False -> Contract not active)
     * Requirements: The caller must be the contract owner.
     */
    function updateContractStatus(bool _isActive) external onlyAdmin {
        isActive = _isActive;
        emit ContractStatusUpdated(_isActive);
    }

    /**
     *@dev Function to add or remove NFTs contracts from the whitelist. It will allow or refuse the selling option.
     *@param collectionAddress NFT collection address.
     *@param tokenStandard ERC Standar of the NFTscontract. (ERC721 or ERC1155)
     *@param allowed Boolean value to allow the NFT contract to be minted. (True -> Contract allowed, False -> Contract not allowed)
     * Requirements: The caller must be the contract owner.
     */
    function updateCollection(
        address collectionAddress,
        TokenStandard tokenStandard,
        bool allowed
    ) external onlyAdmin {
        whitelistNFTs[collectionAddress] = Whitelist(allowed, tokenStandard);
    }

    /**
     *@dev Function set a new Royalties basis points
     *@param _royaltiesInBasisPoints Royalties amount to set.
     * Note: The amount given as parameter wil be divided between 10.000 as Solidity does not allow decimals. Example: 1.000 / 10.000 = 0.1
     * Requirements: The caller must be the contract owner.
     */
    function updateRoyaltiesInBasisPoints(
        uint256 _royaltiesInBasisPoints
    ) external onlyAdmin {
        uint256 oldRoyalties = royaltiesInBasisPoints;
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
        emit RoyaltiesInBasisPointsUpdated(
            oldRoyalties,
            royaltiesInBasisPoints
        );
    }
}
