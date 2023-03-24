// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../../utils/OracleConsumer.sol";

contract ElementalRaidersSkill is ERC721, ERC721Enumerable, ERC721Burnable, Ownable {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    address public gfalToken;
    string public tBaseURI;
    address public feeCollector;
    mapping(uint256 => uint256) public prices;
    // Price data feed Oracle contract
    OracleConsumer public oracleConsumer;

    event Mint(address from, address to, uint256 tokenId, uint256 price);

    constructor(address _gfalToken, address _oracleConsumer, string memory _tBaseURI) ERC721("Elemental Raiders Skill", "ERSKILL") {
        feeCollector = msg.sender;
        gfalToken = _gfalToken;
        oracleConsumer = OracleConsumer(_oracleConsumer);
        tBaseURI = _tBaseURI;
    }

    // Abstract high-level flow
    // - In-game user on in-game inventory clicks on Mint
    // - Game clients check if the user already gave the approval to this contract, for the required amount
    // - - Yes: Fine! Maybe the user tried before and something failed, or simply did that via User Portal or even chain block explorer!
    // - - No: The user is prompted to confirm an approval transaction for the required minting amount in GFAL
    // - Ack -> Game client sends the POST req to Game Server to start the mint, which will try move pre-approved amount and fails if the approval has been hijacked
    // - Web3Provider is going to answer the Promise with a success or error in JSON-RPC format.
    // - Further game handling.
    function safeMint(address to, uint256 rarity) public onlyOwner {
        // Transfer $GFALs from the "to" address to the "collector" one
        require(rarity >= 1 && rarity <= 4, "Rarity index out of bound.");
        require(prices[rarity] != 0, "Minting 0 price tokens is not allowed");

        // Transferring GFAL from player wallet to feeCollector. Assuming previous allowance has been given.
        uint256 tokenPrice = OracleConsumer(oracleConsumer).getConversionRate(prices[rarity]);
        IERC20(gfalToken).safeTransferFrom(to, feeCollector, tokenPrice);

        // Mint flow
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        emit Mint(address(0), to, tokenId, tokenPrice);
    }

    // Getters

    function getOwnersByTokens(uint256[] memory tokens) public view returns (address[] memory) {
        address[] memory response = new address[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            response[i] = ERC721(address(this)).ownerOf(tokens[i]);
        }

        return response;
    }

    function getMintingPricesByRarity(uint256[] memory rarities) public view returns (uint256[] memory) {
        uint256[] memory rarityPrices = new uint256[](rarities.length);

        for (uint256 i = 0; i < rarities.length; i++) {
            rarityPrices[i] = OracleConsumer(oracleConsumer).getConversionRate(prices[rarities[i]]);
        }

        return rarityPrices;
    }

    // Owner

    function updateTBaseURI(string memory _tBaseURI) external onlyOwner {
        tBaseURI = _tBaseURI;
    }

    function updateMintingPrice(uint256 rarity, uint256 price) external onlyOwner {
        require(rarity >= 1 && rarity <= 4, "Rarity index out of bound");
        prices[rarity] = price; // 50000000000000000000 for 50.00 GFAL (50+18 zeros)
    }

    function updateOracleConsumer(address _oracleConsumer) external onlyOwner {
        oracleConsumer = OracleConsumer(_oracleConsumer);
    }

    function updateFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }

    // Optional overrides

    function _baseURI() internal view override returns (string memory) {
        return tBaseURI;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}