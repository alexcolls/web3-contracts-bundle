// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "../../../utils/OracleConsumer/IOracleConsumer.sol";
import "../../../utils/G4ALProxy/IG4ALProxy.sol";

/**

@title ElementalRaidersVials
@dev This smart contract implements a collection of vials represented as ERC1155 tokens.
Users can mint vials either by being whitelisted or by purchasing them using a payment method.
The contract also supports burning vials and creating new vials.
*/
contract ElementalRaidersVials is ERC1155URIStorage {
    using SafeERC20 for IERC20;

    struct Vial {
        uint256 price; // Price must be set in USD
        uint256 maxSupplySale;
        uint256 totalSold;
        uint256 maxClaimableSupply;
        uint256 totalClaimed;
        bytes32 hashRoot;
    }

    IG4ALProxy private immutable g4alProxy;
    uint256 public vialCounter; // counter for the total collections of Vials created

    mapping(uint256 => Vial) public vials; // vialId => Vial details
    mapping(uint256 => mapping(address => bool)) public isMinted; // Tracker for minted Vial ID. (tokenID => wallet => claimed)

    /**
     * @dev Modifier to restrict access to only the admin set in the G4ALProxy contract.
     */
    modifier onlyAdmin() {
        require(msg.sender == g4alProxy.getAdmin(), "Not admin");
        _;
    }

    /**
     * @dev Modifier to check if the user is whitelisted for minting the a specific Vial ID.
     * @param vialId The ID of the vial being minted.
     * @param proof The Merkle proof for verifying the user's eligibility.
     */
    modifier isWhitelist(uint256 vialId, bytes32[] calldata proof) {
        require(!isMinted[vialId][msg.sender], "Vial already claimed");
        bool success = MerkleProof.verify(
            proof,
            vials[vialId].hashRoot,
            keccak256(abi.encodePacked(msg.sender))
        );
        require(success, "You are not in the whitelist for minting");
        _;
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

    /**
     * @dev Initializes the ElementalRaidersVials contract.
     * @param _baseUri The base URI for the vial URIs.
     * @param _g4alProxy The address of the G4ALProxy contract.
     */
    constructor(string memory _baseUri, address _g4alProxy) ERC1155(_baseUri) {
        require(_g4alProxy != address(0), "Use a valid address");
        g4alProxy = IG4ALProxy(_g4alProxy);
        _setBaseURI(_baseUri);
    }

    /**
     * @dev Mints a whitelisted vial to the specified recipient.
     * @param to The address of the recipient.
     * @param vialId The ID of the vial to be minted.
     * @param proof The Merkle proof for verifying the user's eligibility.
     * Note: Users should mint 1 if they are in the whitelist.
     */
    function mintWhitelisted(
        address to,
        uint256 vialId,
        bytes32[] calldata proof
    ) external isWhitelist(vialId, proof) {
        require(vialCounter > vialId, "Invalid vialId");
        isMinted[vialId][msg.sender] = true;
        vials[vialId].totalClaimed++;
        _mint(msg.sender, vialId, 1, "");
        emit MintWhitelisted(address(0), to, vialId, 1);
    }

    /**
     * @dev Mints a vial to the specified recipient.
     * @param to The address of the recipient.
     * @param vialId The ID of the vial to be minted.
     * Note: Users should mint 1 Vial by buying with card or GFAL. If they buy with card we will mint for them.
     */
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

    /**
     * @dev Burns a vial owned by the caller.
     * @param vialId The ID of the vial to be burned.
     */
    function burn(uint256 vialId) external {
        _burn(msg.sender, vialId, 1);
        emit vialBurned(msg.sender, vialId);
    }

    /**
     * @dev Creates a new vial collection with the specified parameters.
     * @param price The price of the vial in USD. It will be exchanged to GFAL by the rate set in the OracleConsumer contract.
     * @param maxSupplySale The maximum supply of vials available for sale.
     * @param maxClaimableSupply The maximum supply of vials that can be claimed.
     * @param hashRoot The Merkle root for whitelisted addresses.
     */
    function createVial(
        uint256 price,
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
