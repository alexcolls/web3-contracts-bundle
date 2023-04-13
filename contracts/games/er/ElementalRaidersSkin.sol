// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../../utils/OracleConsumer.sol";

contract ElementalRaidersSkin is
    ERC721,
    ERC721Enumerable,
    ERC721Burnable,
    Ownable
{
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    address public gfalToken;
    string public tBaseURI;
    address public feeCollector;
    mapping(uint256 => uint256) public prices;
    mapping(uint256 => Skin) public skinsMap;
    // Price data feed Oracle contract
    OracleConsumer public oracleConsumer;

    struct Skin {
        uint256 maxSupply;
        Counters.Counter totalSupply;
    }

    event Mint(address from, address to, uint256 tokenId, uint256 price);

    constructor(
        address _gfalToken,
        address _oracleConsumer,
        string memory _tBaseURI
    ) ERC721("Elemental Raiders Skin", "ERSKILL") {
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
    function safeMint(address to, uint256 skinId) public onlyOwner {
        require(
            skinsMap[skinId].totalSupply.current() < skinsMap[skinId].maxSupply,
            "Max supply reached"
        );

        uint256 tokenPrice;
        if (prices[skinId] != 0) {
            // Transferring GFAL from player wallet to feeCollector. Assuming previous allowance has been given.
            tokenPrice = OracleConsumer(oracleConsumer).getConversionRate(
                prices[skinId]
            );
            IERC20(gfalToken).safeTransferFrom(to, feeCollector, tokenPrice);
        }

        // Mint flow
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        skinsMap[skinId].totalSupply.increment();
        emit Mint(address(0), to, tokenId, tokenPrice);
    }

    // Getters

    function getOwnersByTokens(
        uint256[] memory tokens
    ) public view returns (address[] memory) {
        address[] memory response = new address[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            response[i] = ERC721(address(this)).ownerOf(tokens[i]);
        }

        return response;
    }

    function getMintingPricesBySkinIds(
        uint256[] memory skinIds
    ) public view returns (uint256[] memory) {
        uint256[] memory pricesSkins = new uint256[](skinIds.length);

        for (uint256 i; i < skinIds.length; i++) {
            pricesSkins[i] = OracleConsumer(oracleConsumer).getConversionRate(
                prices[skinIds[i]]
            );
        }

        return pricesSkins;
    }

    // Owner

    function updateTBaseURI(string memory _tBaseURI) external onlyOwner {
        tBaseURI = _tBaseURI;
    }

    function updateMintingPrices(
        uint256[] calldata skinIds,
        uint256[] calldata skinPrices
    ) external onlyOwner {
        require(skinIds.length == skinPrices.length, "Length mismatch");

        for (uint256 i; i < skinIds.length; i++) {
            prices[skinIds[i]] = skinPrices[i]; // 50000000000000000000 for 50.00 GFAL (50+18 zeros)
        }
    }

    function updateOracleConsumer(address _oracleConsumer) external onlyOwner {
        oracleConsumer = OracleConsumer(_oracleConsumer);
    }

    function updateFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }

    function updateSkinsMap(
        uint256[] calldata skinIds,
        uint256[] calldata maxSupplies
    ) external onlyOwner {
        require(skinIds.length == maxSupplies.length, "Length mismatch");

        for (uint256 i = 0; i < skinIds.length; i++) {
            require(skinsMap[skinIds[i]].maxSupply == 0, "Supply already set");
            skinsMap[skinIds[i]].maxSupply = maxSupplies[i];
        }
    }

    // Optional overrides

    function _baseURI() internal view override returns (string memory) {
        return tBaseURI;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
