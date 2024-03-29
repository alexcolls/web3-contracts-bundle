// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "../../../utils/OracleConsumer/IOracleConsumer.sol";
import "../../../utils/G4ALProxy/IG4ALProxy.sol";

/**
 * @title ElementalRaidersSkin
 * @dev This contract represents an ERC721 token for Elemental Raiders Skin game. It uses SafeERC20 to transfer GFAL tokens and OracleConsumer to fetch GFAL price conversion rates.
 * The contract allows the game to safely mint tokens by ensuring that users have approved the required amount of GFAL tokens before minting & allowes the Marketplace SC to manage all NFTs.
 * The contract also allows the game owner to update minting prices and the base URI.
 */
contract ElementalRaidersSkill is ERC721, ERC721Enumerable, ERC721Burnable {
    using SafeERC20 for IERC20;

    uint256 private _tokenIdCounter;

    // Proxy to store variables as addresses from contracts and from wallets
    IG4ALProxy private immutable g4alProxy;

    uint16 private royaltyFraction; // Royalty percentage to send to feeCollector when sold in secondary market, but not our marketplace. (royaltyFraction / 10.000)
    string private baseURI;

    // Prices by rarity. It returns the price in USD
    mapping(uint256 => uint256) public prices;

    event Mint(
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 price
    );

    modifier onlyAdmin() {
        require(msg.sender == g4alProxy.getAdmin(), "Not Admin");
        _;
    }

    /**
     * @dev Initializes the Elemental Raiders Skill contract by setting the G4AL proxy address and the base URI.
     * @param _g4alProxy The G4ALProxy contract address.
     * @param _baseUri The base URI for the token metadata.
     */
    constructor(
        address _g4alProxy,
        string memory _baseUri,
        uint16 _royaltyFraction
    ) ERC721("Elemental Raiders Skill", "ERSKILL") {
        require(_g4alProxy != address(0), "Address cannot be 0");
        g4alProxy = IG4ALProxy(_g4alProxy);
        baseURI = _baseUri;
        royaltyFraction = _royaltyFraction;
    }

    // Abstract high-level flow
    // - In-game user on in-game inventory clicks on Mint
    // - Game clients check if the user already gave the approval to this contract, for the required amount
    // - - Yes: Fine! Maybe the user tried before and something failed, or simply did that via User Portal or even chain block explorer!
    // - - No: The user is prompted to confirm an approval transaction for the required minting amount in GFAL
    // - Ack -> Game client sends the POST req to Game Server to start the mint, which will try move pre-approved amount and fails if the approval has been hijacked
    // - Web3Provider is going to answer the Promise with a success or error in JSON-RPC format.
    // - Further game handling.
    /**
     * @dev Safely mints an ERC721 token for a user if the user has approved the required amount of GFAL tokens.
     * @param to The address to which the minted token should be sent.
     * @param rarity The rarity of the token to be minted.
     * Requirements: The caller must be the contract admin (Set in the Proxy contract).
     * Note: For Company use -> Rarity should be set to 0, as it will be 0 G4AL (ERC-20) for minting and then list in market place
     *      It will allow the marketplace contract to manage all the NFTs. To avoid friction for the user to approve the marketplace.
     */
    function safeMint(address to, uint256 rarity) external onlyAdmin {
        // Allowance flow. Check if it the Market place is already approved to manage NFTs
        address marketPlace = g4alProxy.getMarketPlace();

        if (!isApprovedForAll(to, marketPlace)) {
            _setApprovalForAll(to, marketPlace, true);
        }

        // Get the conversion from USD to GFAL
        uint256 tokenPrice = IOracleConsumer(g4alProxy.getOracleConsumer())
            .getConversionRate(prices[rarity]);
        // Transfer $GFALs from the "to" address to the "collector" one
        // Transferring GFAL from player wallet to feeCollector. Assuming previous allowance has been given.
        IERC20(g4alProxy.getGfalToken()).safeTransferFrom(
            to,
            g4alProxy.getFeeCollector(),
            tokenPrice
        );

        // Mint flow
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);

        emit Mint(address(0), to, tokenId, tokenPrice);
    }

    // Getters
    /** @dev Returns the address of the token owner for the provided array of token ids.
     *  @param tokens An array of token ids.
     * @return An array of token id and address of the token owner.
     */
    function getOwnersByTokens(
        uint256[] memory tokens
    ) external view returns (address[] memory) {
        address[] memory response = new address[](tokens.length);

        for (uint256 i = 0; i < tokens.length; ) {
            response[i] = ERC721(address(this)).ownerOf(tokens[i]);
            unchecked {
                i++;
            }
        }

        return response;
    }

    /** @dev Returns the price in GFAL for the provided array of rarity ids.
     *  @param rarities An array of rarity ids.
     * @return An array of prices of the rarity id (Set in USD).
     */
    function getMintingPricesByRarity(
        uint256[] memory rarities
    ) external view returns (uint256[] memory) {
        uint256[] memory rarityPrices = new uint256[](rarities.length);

        for (uint256 i = 0; i < rarities.length; ) {
            rarityPrices[i] = IOracleConsumer(g4alProxy.getOracleConsumer())
                .getConversionRate(prices[rarities[i]]);

            unchecked {
                i++;
            }
        }

        return rarityPrices;
    }

    // Owner
    /**
     * @dev Updates the base URI for the token metadata.
     * @param _baseUri The new base URI.
     * Requirements: The caller must be the contract admin (Set in the Proxy contract).
     */
    function updateBaseURI(string calldata _baseUri) external onlyAdmin {
        baseURI = _baseUri;
    }

    /**
     * @dev Updates the minting price for a given rarity.
     * @param rarity The rarity for which to update the price.
     * @param price The new price for the given rarity.
     * Requirements: The caller must be the contract owner.
     * Note: Rarity -> should be 0 G4AL for company minting and then list in market place
     */
    function updateMintingPrice(
        uint256 rarity,
        uint256 price
    ) external onlyAdmin {
        prices[rarity] = price; // 50000000000000000000 for 50.00 GFAL (50+18 zeros)
    }

    /**
     * @dev Updates the royalty fraction set for secondary market sale.
     * @param feeNumerator The new royalty fraction to set. 100(feeNumerator) / 10.0000 = 0.01% as fee
     * Note: It will take effect only in secondary market place (Not in our own market place)
     */
    function setTokenRoyalty(uint16 feeNumerator) external onlyAdmin {
        require(feeNumerator < 10001, "Royalty fee will exceed salePrice");
        royaltyFraction = feeNumerator;
    }

    /**
     * @dev Returns the fee collector and the royaltyAmount to transfer.
     * @param salePrice Total sale price.
     * Note: It will take effect only in secondary market place. (Not in our own market place)
     */
    function royaltyInfo(
        uint256,
        uint256 salePrice
    ) external view returns (address, uint256) {
        uint256 royaltyAmount = (salePrice * royaltyFraction) / 10000;

        return (g4alProxy.getFeeCollector(), royaltyAmount);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     * Note: Added interface for ERC2981 (for being Royalties compatible)
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return
            interfaceId == 0x2a55205a || super.supportsInterface(interfaceId);
    }

    // Optional overrides
    /**
     *@dev Returns the base URI for the token metadata.
     *Note: Overrides the internal _baseURI() function of ERC721.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // The following functions are overrides required by Solidity.
    /**
     *@dev Hook that is called before any token transfer.
     * Note: Overrides the internal _beforeTokenTransfer() function of ERC721 and ERC721Enumerable.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
