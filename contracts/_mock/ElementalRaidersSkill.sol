// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @custom:security-contact security@g4al.com
contract ElementalRaidersSkill is ERC721, ERC721Enumerable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Counters.Counter private _tokenIdCounter;

    address public gameGoldToken;
    string public baseURI;
    address public feeCollector;

    constructor(address _minter, address _collector, address _gameGoldToken, string memory _baseURI) ERC721("ElementalRaidersSkill", "ERSKILL") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _minter);
        feeCollector = _collector;
        gameGoldToken = _gameGoldToken;
    }

    // Abstract high-level flow
    // - In-game user on in-game inventory clicks on Mint
    // - Game clients check if the user already gave the approval to this contract, for the required amount
    // - - Yes: Fine! Maybe the user tried before and something failed, or simply did that via User Portal or even chain block explorer!
    // - - No: The user is prompted to confirm an approval transaction for the required minting amount in GGT
    // - Ack -> Game client sends the POST req to Game Server to start the mint, which will try move pre-approved amount and fails if the approval has been hijacked
    // - Web3Provider is going to answer the Promise with a success or error in JSON-RPC format.
    // - Further game handling.
    function safeMint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        // Transfer $GGTs from the "to" address to the "collector" one
        // TODO: Price is dynamic based on the Skill Rarity (uncom, rare, epic, legen), choose if pass as arg amount or directly the rarity ENUM, both to validate server-side
        IERC20(gameGoldToken).transferFrom(to, feeCollector, amount);

        // Mint flow
        // TODO: Should this token id mirrors the Firebase one? if exists?
        // TODO: How would we relate post-minted tokenSkills with pre-minted off-chainSkills?
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    // Owner

    function updateBaseURI(string memory _baseURI) external onlyRole(MINTER_ROLE) {
        baseURI = _baseURI;
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