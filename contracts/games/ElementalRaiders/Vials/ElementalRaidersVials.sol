// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../../utils/OracleConsumer.sol";
import "../../utils/G4ALProxy.sol";

// TODO! It is on process, needs to be finished based on the logic implementation we wish to have
contract ElementalRaidersVials is ERC721 {
    using SafeERC20 for IERC20;

    bytes32 public immutable WHITELIST_HASH_ROOT;

    event Mint(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        uint256 price
    );

    modifier isWhitelist(bytes32[] memory proof) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bool success = MerkleProof.verify(proof, WHITELIST_HASH_ROOT, leaf);
        require(
            success,
            "You are not in the whitelist for minting or wrong Proof"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri,
        bytes32 _root
    ) ERC721(_name, _symbol) {
        WHITELIST_HASH_ROOT = _root;
    }

    function mint(
        bytes32[] memory _proof,
        uint256 _amount
    ) public isWhitelist(_proof) {
        _mint(msg.sender, _amount);
    }
}
