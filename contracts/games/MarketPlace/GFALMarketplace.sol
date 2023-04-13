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

contract GFALMarketplace is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Proxy to store variables as addresses from contracts and from wallets
    G4ALProxy public g4alProxy;

    mapping(address => Whitelist) public whitelistNFTs;

    // Marketplace
    mapping(address => mapping(uint256 => mapping(address => Sale)))
        public tokensForSale; // collectionAddress => (tokenId => (sellerAddress => Sale))
    address[] public sellersList; // to allow iterating in order to get on sale tokens for contractAddress and sellerAddress
    mapping(address => bool) public knownSellers; // to avoid repeated sellersList.push(sellerAddress)
    uint256 public volume; // $GFAL all-time-volume
    uint256 public royaltiesInBasisPoints;

    modifier onlyOwner() {
        require(msg.sender == g4alProxy.owner(), "Not owner");
        _;
    }

    constructor(uint256 _royaltiesInBasisPoints, address _g4alProxy) {
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
        g4alProxy = G4ALProxy(_g4alProxy);
    }

    // Structures
    struct Sale {
        uint256 price;
        bool isDollar;
        bool isForSale;
    }

    struct Whitelist {
        bool allowed;
        TokenStandard tokenStandard;
    }
    enum TokenStandard {
        ERC721,
        ERC1155
    }

    // Events
    event SellToken(
        address collection,
        uint256 tokenId,
        uint256 price,
        bool isDollar,
        address seller
    );
    event BuyToken(
        address collection,
        uint tokenId,
        uint price,
        uint sellerRevenue,
        uint royalties,
        address seller,
        address buyer
    );
    event RemoveToken(address collection, uint256 tokenId, address seller);

    // Modifiers

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

    function sellToken(
        address contractAddress,
        uint256 tokenId,
        uint256 price,
        bool isDollar
    ) public onlyTradableToken(contractAddress, msg.sender, tokenId) {
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

        tokensForSale[contractAddress][tokenId][msg.sender] = Sale(
            price,
            isDollar,
            true
        );

        emit SellToken(contractAddress, tokenId, price, isDollar, msg.sender);
    }

    function buyToken(
        address contractAddress,
        uint256 tokenId,
        address seller
    ) public nonReentrant {
        // TODO: Check token collection is allowed and not blacklisted in the meantime were listed

        Sale memory sale = tokensForSale[contractAddress][tokenId][seller];
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
            // Treating ERC1155 as it is 721 via hardcoded amount of 1
            IERC1155(contractAddress).safeTransferFrom(
                seller,
                msg.sender,
                tokenId,
                1,
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
        tokensForSale[contractAddress][tokenId][seller] = Sale(0, false, false);

        emit BuyToken(
            contractAddress,
            tokenId,
            price,
            amountAfterRoyalties,
            royaltiesAmount,
            seller,
            msg.sender
        );
    }

    function removeToken(
        address contractAddress,
        uint256 tokenId
    ) public onlyTradableToken(contractAddress, msg.sender, tokenId) {
        tokensForSale[contractAddress][tokenId][msg.sender] = Sale(
            0,
            false,
            false
        );
        emit RemoveToken(contractAddress, tokenId, msg.sender);
    }

    // Private marketplace methods

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

    function getSellersList() public view returns (address[] memory) {
        return sellersList;
    }

    function getOnSaleTokenIds(
        address contractAddress,
        address seller,
        uint256 start,
        uint256 end
    )
        public
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
            Sale memory currentSale = tokensForSale[contractAddress][i][seller];
            if (currentSale.isForSale) {
                _tokenIds[counter] = i;
                _sellers[counter] = seller;
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

    function updateCollection(
        address _collectionAddress,
        TokenStandard _tokenStandard,
        bool _allowed
    ) external onlyOwner {
        whitelistNFTs[_collectionAddress] = Whitelist(_allowed, _tokenStandard);
    }

    function updateRoyaltiesInBasisPoints(
        uint256 _royaltiesInBasisPoints
    ) external onlyOwner {
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
    }
}
