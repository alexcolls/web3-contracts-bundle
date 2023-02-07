// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./_mock/OracleConsumer.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";
// Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
// console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

contract G4ALMarketplace is Ownable, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    // Price data feed Oracle contract
    OracleConsumer public oracleConsumer;
    
    // Tokens
    address public ggtToken;
    mapping (address => bool) public whitelistNFTs;

    // Marketplace
    mapping (address => mapping(uint256 => Sale)) public tokensForSale;
    uint256 public volume; // in $GGT all-time-long
    uint256 public royaltiesInBasisPoints;
    address public feeCollector;

    constructor(address _oracleConsumer, address _ggtToken, address _feeCollector, uint256 _royaltiesInBasisPoints) {
        oracleConsumer = OracleConsumer(_oracleConsumer);
        ggtToken = _ggtToken;
        feeCollector = _feeCollector;
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
    }

    // Structures
    struct Sale {
        address contractAddress;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isDollar;
        bool isForSale;
    }

    // Events
    event SellToken(address collection, uint256 tokenId, uint256 price, bool isDollar, address seller);
    event RemoveToken(address collection, uint256 tokenId, address seller);
    event BuyToken(address collection, uint tokenId, uint price, uint sellerRevenue, uint royalties, address seller, address buyer);

    // Modifiers

    modifier onlyTradableToken (address contractAddress, address from, uint256 tokenId) {
        require(whitelistNFTs[contractAddress] == true, "You can sell only tokens about whitelisted collections.");
        require(IERC721Enumerable(contractAddress).ownerOf(tokenId) == from, "Token does not belong to user or not existing.");
        _;
    }

    // -- Marketplace Methods

    // TODO: require token is already approved, anyway this could change in the future. consider this.
    function sellToken(address contractAddress, uint256 tokenId, uint256 price, bool isDollar) public onlyTradableToken(contractAddress, msg.sender, tokenId) {
        require(price != 0, "Cannot put zero as a price");
        require(IERC721Enumerable(contractAddress).getApproved(tokenId) == address(this), "NFT has not been approved for spending.");

        tokensForSale[contractAddress][tokenId] = Sale(contractAddress, tokenId, msg.sender, price, isDollar, true);
        emit SellToken(contractAddress, tokenId, price, isDollar, msg.sender);
    }

    // TODO: try to exploit removed NFT approval during listing. Or missing ERC20 approval. Would revert the whole function or do something weird like has been reentered?
    function buyToken(address contractAddress, uint256 tokenId) nonReentrant public {
        require(tokensForSale[contractAddress][tokenId].isForSale, "Token is not for sale.");

        // Calculating royalties and wanted price
        uint256 price = tokensForSale[contractAddress][tokenId].isDollar == true // if isDollar expressed listing
            ? OracleConsumer(oracleConsumer).getConversionRate(tokensForSale[contractAddress][tokenId].price) // convert from USD to GGT
            : tokensForSale[contractAddress][tokenId].price; // otherwise already in GGT
        (uint256 amountAfterRoyalties, uint256 royaltiesAmount) = _calculateMarketplaceRoyalties(price);

        // Transferring NFT, sending funds to seller, and sending fees to marketplaceRoyalties
        IERC721Enumerable(contractAddress).safeTransferFrom(tokensForSale[contractAddress][tokenId].seller, msg.sender, tokenId);
        IERC20(ggtToken).transferFrom(msg.sender, tokensForSale[contractAddress][tokenId].seller, amountAfterRoyalties);
        IERC20(ggtToken).transferFrom(msg.sender, feeCollector, royaltiesAmount);

        // Increasing marketplace volume
        volume += price;

        // setting it in memory to emit event afterward
        address  seller = tokensForSale[contractAddress][tokenId].seller;

        // Setting token as not for sell
        tokensForSale[contractAddress][tokenId] = Sale(contractAddress, tokenId, address(0), 0, false, false);

        emit BuyToken(contractAddress, tokenId, price, amountAfterRoyalties, royaltiesAmount, seller, msg.sender);
    }

    function removeToken(address contractAddress, uint256 tokenId) public onlyTradableToken(contractAddress, msg.sender, tokenId) {
        tokensForSale[contractAddress][tokenId] = Sale(contractAddress, tokenId, address(0), 0, false, false);
        emit RemoveToken(contractAddress, tokenId, msg.sender);
    }

    // Private marketplace methods

    function _calculateMarketplaceRoyalties(uint256 amount) internal view returns (uint256 amountAfterRoyalties, uint256 royaltiesAmount) {
        royaltiesAmount = amount.mul(royaltiesInBasisPoints).div(10000);
        amountAfterRoyalties = amount.sub(royaltiesAmount);
    }

    // Getters

    function getOnSaleTokenIds(address contractAddress, uint256 start, uint256 end) public view returns (uint256[] memory tokenIds, address[] memory sellers, uint256[] memory prices, bool[] memory isDollars) {
        require(end > start, "End must be higher than start");
        uint256 totalSupply = IERC721Enumerable(contractAddress).totalSupply();
        if (end > totalSupply) {
            end = totalSupply;
        }
        uint256[] memory _onSaleTokenIds = new uint[](end - start);
        address[] memory _sellers = new address[](end - start);
        uint256[] memory _prices = new uint256[](end - start);
        bool[] memory _isDollars = new bool[](end - start);
        uint256 counter = 0;
        for (uint256 i = start; i <= end; i++) {
            if (tokensForSale[contractAddress][i].isForSale) {
                _onSaleTokenIds[counter] = i;
                _sellers[counter] = tokensForSale[contractAddress][i].seller;
                _prices[counter] = tokensForSale[contractAddress][i].price;
                _isDollars[counter] = tokensForSale[contractAddress][i].isDollar;
                counter++;
            }
        }
        return (_onSaleTokenIds, _sellers, _prices, _isDollars);
    }

    // Overwriting this methods for Pause/Unpause the contract

    // TODO: Choose if pausable contract is needed. If yes, implement whenNotPaused() modifier on desired pausable functions.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        require(ggtToken != address(0x0));
        require(address(oracleConsumer) != address(0x0));
        _unpause();
    }

    // Owner functions

    function addCollection(address _collection) external onlyOwner {
        whitelistNFTs[_collection] = true;
    }

    function removeCollection(address _collection) external onlyOwner {
        require(whitelistNFTs[_collection] == true, "Collection not existing in mapping");

        whitelistNFTs[_collection] = false;
    }

    function updateGgtToken(address _ggtToken) external onlyOwner {
        ggtToken = _ggtToken;
    }

    function updateOracleConsumer(address _oracleConsumer) external onlyOwner {
        oracleConsumer = OracleConsumer(_oracleConsumer);
    }

    function updateRoyaltiesInBasisPoints(uint256 _royaltiesInBasisPoints) external onlyOwner {
        royaltiesInBasisPoints = _royaltiesInBasisPoints;
    }
}
