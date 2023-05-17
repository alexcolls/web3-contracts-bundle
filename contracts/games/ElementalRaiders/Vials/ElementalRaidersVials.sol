// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../../../utils/OracleConsumer/IOracleConsumer.sol";
import "../../../utils/G4ALProxy/IG4ALProxy.sol";

// TODO! It is on process, needs to be finished based on the logic implementation we wish to have
// https://docs.google.com/document/d/1Xkdv2X9bm5KvoHknzWSr8PZfBEmsWYLgb3joReZhpBE/edit
contract ElementalRaidersVials is ERC1155 {
    using SafeERC20 for IERC20;

    IG4ALProxy private immutable g4alProxy;

    mapping(uint256 => Vial) public vials; // tokenId => Vial details
    mapping(uint256 => mapping(address => bool)) public isMinted; // Tracker for minted Vial ID.
    mapping(uint256 => uint256) public vialsSold; // Tracker for sold Vials.

    struct Vial {
        uint256 price;
        uint256 maxSupplySale;
        uint256 maxTotalSupply;
        bytes32 hashRoot;
        bytes32[] proof;
    }

    event Mint(
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 amount,
        uint256 price
    );

    modifier onlyAdmin() {
        require(msg.sender == g4alProxy.getAdmin(), "Not admin");
        _;
    }

    modifier isWhitelist(uint256 tokenId) {
        require(!isMinted[tokenId][msg.sender], "Vial already Minted");
        Vial memory _vial = vials[tokenId];
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bytes32[] memory proof = _vial.proof;
        bytes32 root = _vial.hashRoot;
        bool success = MerkleProof.verify(proof, root, leaf);
        require(success, "You are not in the whitelist for minting");
        _;
    }

    constructor(string memory _baseUri, address _g4alProxy) ERC1155(_baseUri) {
        g4alProxy = IG4ALProxy(_g4alProxy);
    }

    // TODO! Users should mint 1 if they are in the whitelist or buy with card or GFAL.
    function mintWhitelisted(
        address to,
        uint256 tokenId
    ) external isWhitelist(tokenId) {
        isMinted[tokenId][msg.sender] = true;
        _mint(msg.sender, tokenId, 1, "");
        // emit Mint(address(0), to, tokenId, 1, price);
    }

    function mint(address to, uint256 tokenId) external {
        Vial memory _vial = vials[tokenId];
        require(vialsSold[tokenId] <= _vial.maxSupplySale, "");
    }

    function addRoot() external onlyAdmin {}
}
