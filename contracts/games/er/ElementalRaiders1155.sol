// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "../../utils/OracleConsumer.sol";

contract ElementalRaiders1155 is ERC1155, Ownable, ERC1155Supply {
    using SafeERC20 for IERC20;

    // TODO: Metadata.name
    // TODO: Metadata.symbol

    address public gfalToken;
    address public feeCollector;
    mapping(uint256 => uint256) public prices; // tokenId => priceInWeiGFAL
    mapping(uint256 => uint256) public maxSupplies; // tokenId => maxSupplyPerToken
    mapping(uint256 => bool) public whitelistTokenIds; // tokenId => true/false
    // Price data feed Oracle contract
    OracleConsumer public oracleConsumer;

    event Mint(address from, address to, uint256 id, uint256 amount, uint256 price);
    event MintBatch(address from, address to, uint256[] ids, uint256[] amounts, uint256 price);

    constructor(address _gfalToken, address _oracleConsumer) ERC1155("") {
        feeCollector = msg.sender;
        gfalToken = _gfalToken;
        oracleConsumer = OracleConsumer(_oracleConsumer);
    }

    function mint(address to, uint256 id)
    public
    onlyOwner
    {
        if (maxSupplies[id] != 0) {
            require(totalSupply(id) < maxSupplies[id], "Amount to mint exceeds the maxSupply for the tokenId");
        }
        // If the tokenId has been marked with a price higher than 0
        if (prices[id] != 0) {
            // Converting price from dollars to $GFAL
            IERC20(gfalToken).safeTransferFrom(to, feeCollector, OracleConsumer(oracleConsumer).getConversionRate(prices[id]));
        }
        _mint(to, id, 1, "");

        emit Mint(address(0), to, id, 1, OracleConsumer(oracleConsumer).getConversionRate(prices[id]));
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts)
    public
    onlyOwner
    {
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

        // sumPrice based on prices mapping
        uint256 sumPrice;
        for (uint256 i = 0; i < ids.length; i++) {
            if (maxSupplies[ids[i]] != 0) {
                require((totalSupply(ids[i]) + amounts[i]) <= maxSupplies[ids[i]], "Amount to mint exceeds the maxSupply for the tokenId");
            }
            // Converting price from dollars to $GFAL
            sumPrice += OracleConsumer(oracleConsumer).getConversionRate(prices[ids[i]]);
        }

        // If the sumPrice is not 0, make the safeTransferFrom
        if (sumPrice != 0) {
            IERC20(gfalToken).safeTransferFrom(to, feeCollector, sumPrice);
        }

        // Mint the batch
        _mintBatch(to, ids, amounts, "");

        emit MintBatch(address(0), to, ids, amounts, sumPrice);
    }

    // Owner

    function updateMintingPrice(uint256 tokenId, uint256 price) external onlyOwner {
        prices[tokenId] = price; // 50000000000000000000 for 50.00 GFAL (50+18 zeros)
    }

    function updateMintingMaxSupply(uint256 tokenId, uint256 maxSupply) external onlyOwner {
        maxSupplies[tokenId] = maxSupply;
    }

    function updateOracleConsumer(address _oracleConsumer) external onlyOwner {
        oracleConsumer = OracleConsumer(_oracleConsumer);
    }

    function updateFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }

    // Getters

    function getMintingPricesByTokenIds(uint256[] memory tokenIds) public view returns (uint256[] memory) {
        uint256[] memory idPrices = new uint256[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            idPrices[i] = OracleConsumer(oracleConsumer).getConversionRate(prices[tokenIds[i]]);
        }

        return idPrices;
    }

    // Overrides

    function setURI(string memory newUri) public onlyOwner {
        _setURI(newUri);
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        return string(abi.encodePacked(uri(tokenId), tokenId));
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
    internal
    override(ERC1155, ERC1155Supply)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
