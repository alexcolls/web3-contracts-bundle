// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "../../../utils/OracleConsumer/IOracleConsumer.sol";
import "../../../utils/G4ALProxy/IG4ALProxy.sol";

// TODO! It is on process, needs to be finished based on the logic implementation we wish to have
// https://docs.google.com/document/d/1Xkdv2X9bm5KvoHknzWSr8PZfBEmsWYLgb3joReZhpBE/edit
contract ElementalRaidersVials is ERC1155URIStorage {
    using SafeERC20 for IERC20;

    IG4ALProxy private immutable g4alProxy;
    uint256 public vialCounter; // counter for the total collections of Vials created

    mapping(uint256 => Vial) public vials; // vialId => Vial details
    mapping(uint256 => mapping(address => bool)) public isMinted; // Tracker for minted Vial ID. (tokenID => wallet => claimed)

    struct Vial {
        uint256 price; // Price must be set in USD
        uint256 maxSupplySale;
        uint256 totalSold;
        uint256 maxClaimableSupply;
        uint256 totalClaimed;
        bytes32 hashRoot;
    }

    event MintWhitelisted(
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 amount
    );
    event Mint(
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 amount,
        uint256 price
    );
    event VialCreated(
        uint256 vialId,
        uint256 price, // Price must be set in USD
        uint256 maxSupplySale,
        uint256 maxClaimableSupply,
        bytes32 hashRoot
    );
    event vialBurned(address indexed owner, uint256 vialId);

    modifier onlyAdmin() {
        require(msg.sender == g4alProxy.getAdmin(), "Not admin");
        _;
    }

    modifier isWhitelist(uint256 vialId, bytes32[] memory proof) {
        require(!isMinted[vialId][msg.sender], "Vial already claimed");
        bool success = MerkleProof.verify(
            proof,
            vials[vialId].hashRoot,
            keccak256(abi.encodePacked(msg.sender))
        );
        require(success, "You are not in the whitelist for minting");
        _;
    }

    constructor(string memory _baseUri, address _g4alProxy) ERC1155(_baseUri) {
        require(_g4alProxy != address(0), "Use a valid address");
        g4alProxy = IG4ALProxy(_g4alProxy);
        _setBaseURI(_baseUri);
    }

    // Users should mint 1 if they are in the whitelist
    function mintWhitelisted(
        address to,
        uint256 vialId,
        bytes32[] memory proof
    ) external isWhitelist(vialId, proof) {
        require(vialCounter > vialId, "Invalid vialId");
        isMinted[vialId][msg.sender] = true;
        vials[vialId].totalClaimed++;
        _mint(msg.sender, vialId, 1, "");
        emit MintWhitelisted(address(0), to, vialId, 1);
    }

    //Users should mint 1 Vial by buying with card or GFAL. If they buy with card we will mint for them
    function mint(address to, uint256 vialId) external {
        require(vialCounter > vialId, "Invalid vialId");
        uint256 vialPrice;
        Vial storage _vial = vials[vialId];
        require(
            _vial.totalSold < _vial.maxSupplySale,
            "vialId maxsupply reached"
        );
        _vial.totalSold++;

        if (msg.sender == g4alProxy.getAdmin()) {
            _mint(to, vialId, 1, "");
        } else {
            // Get the conversion from USD to GFAL
            vialPrice = IOracleConsumer(g4alProxy.getOracleConsumer())
                .getConversionRate(_vial.price);
            // Transferring GFAL from player wallet to feeCollector. Assuming previous allowance has been given.
            IERC20(g4alProxy.getGfalToken()).safeTransferFrom(
                to,
                g4alProxy.getFeeCollector(),
                vialPrice
            );
            _mint(to, vialId, 1, "");
        }
        emit Mint(address(0), to, vialId, 1, vialPrice);
    }

    // function to burn NFT
    function burn(uint256 vialId) external {
        _burn(msg.sender, vialId, 1);
        emit vialBurned(msg.sender, vialId);
    }

    // function to create a new vial
    function createVial(
        uint256 price, // Price must be set in USD
        uint256 maxSupplySale,
        uint256 maxClaimableSupply,
        bytes32 hashRoot
    ) external onlyAdmin {
        uint256 vialId = vialCounter;

        vials[vialId] = Vial(
            price,
            maxSupplySale,
            0,
            maxClaimableSupply,
            0,
            hashRoot
        );
        _setURI(vialId, Strings.toString(vialId));
        vialCounter = vialId + 1;
        emit VialCreated(
            vialId,
            price,
            maxSupplySale,
            maxClaimableSupply,
            hashRoot
        );
    }
}
