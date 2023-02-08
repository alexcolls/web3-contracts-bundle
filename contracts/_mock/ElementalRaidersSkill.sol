// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ElementalRaidersSkill is ERC721, ERC721Enumerable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Counters.Counter private _tokenIdCounter;

    address public gfalToken;
    string public baseURI;
    address public feeCollector;

    mapping(uint256 => uint256) public prices;

    constructor(address _minter, address _collector, address _gfalToken, string memory _baseURI) ERC721("ElementalRaidersSkill", "ERSKILL") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _minter);
        feeCollector = _collector;
        gfalToken = _gfalToken;
        baseURI = _baseURI;
    }

    // Abstract high-level flow
    // - In-game user on in-game inventory clicks on Mint
    // - Game clients check if the user already gave the approval to this contract, for the required amount
    // - - Yes: Fine! Maybe the user tried before and something failed, or simply did that via User Portal or even chain block explorer!
    // - - No: The user is prompted to confirm an approval transaction for the required minting amount in GFAL
    // - Ack -> Game client sends the POST req to Game Server to start the mint, which will try move pre-approved amount and fails if the approval has been hijacked
    // - Web3Provider is going to answer the Promise with a success or error in JSON-RPC format.
    // - Further game handling.
    function safeMint(address to, uint256 rarity) public onlyRole(MINTER_ROLE) {
        // Transfer $GFALs from the "to" address to the "collector" one
        require(rarity >= 1 && rarity <= 4, "Rarity index out of bound.");

        // Transferring GFAL from player wallet to feeCollector. Assuming previous allowance has been given.
        IERC20(gfalToken).transferFrom(to, feeCollector, prices[rarity]);

        // Mint flow
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    // Getters

    function getOwnersByTokens(uint256[] memory tokens) public view returns (address[] memory) {
        address[] memory response = new address[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            response[i] = ERC721(address(this)).ownerOf(tokens[i]);
        }

        return response;
    }

    // Owner

    function updateBaseURI(string memory _baseURI) external onlyRole(MINTER_ROLE) {
        baseURI = _baseURI;
    }

    function updateMintingPrice(uint256 rarity, uint256 price) external onlyRole(MINTER_ROLE) {
        require(rarity >= 1 && rarity <= 4, "Rarity index out of bound.");

        prices[rarity] = price; // 50000000000000000000 for 50.00 GFAL (50+18 zeros)
    }

    // The following functions are overrides required by Solidity.

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}