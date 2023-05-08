// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IG4ALProxy.sol";

contract G4ALProxy is IG4ALProxy, Ownable {
    address private gfalToken; // Address of GFAL Token (ERC20)
    address private oracleConsumer; // Address of G4AL price feed. Needs to be set once deployed
    address private feeCollector; // Address of Fee Collector from minting NFTs
    address private royaltiesCollector; // Address of Royalties Collector from Marketplace
    address private marketPlace; // Address of ERC721 and ERC1155 Marketplace. Needs to be set once deployed
    address private admin; // Address of Admin to call and have previlegies over the contracts

    event GfalTokenUpdated(address oldGfalToken, address newGfalToken);
    event OracleConsumerUpdated(
        address oldOracleConsumer,
        address newOracleConsumer
    );
    event FeeCollectorUpdated(address oldFeeCollector, address newFeeCollector);
    event RoyaltyCollectorUpdated(
        address oldRoyaltyCollector,
        address newRoyaltyCollector
    );
    event MarketPlaceUpdated(address oldMarketPlace, address newMarketPlace);
    event AdminUpdated(address oldAdmin, address newAdmin);

    /**
     * @dev Initializes the G4ALProxy contract with the given GFAL Token address and sets the
     *      Fee Collector, the Royalties Collector and the admin address to the contract deployer.
     * @param _gfalToken The address of GFAL Token.
     */
    constructor(address _gfalToken, address _admin) {
        require(
            _gfalToken != address(0) && _admin != address(0),
            "Address cannot be 0"
        );
        feeCollector = msg.sender;
        royaltiesCollector = msg.sender;
        gfalToken = _gfalToken;
        admin = _admin;
    }

    /**
     * @dev Updates the address of admin.
     * @param newAdmin The new address of admin.
     */
    function updateAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Not valid address");
        address _oldAdmin = admin;
        admin = newAdmin;

        emit AdminUpdated(_oldAdmin, newAdmin);
    }

    /**
     * @dev Updates the address of GFAL Token.
     * @param newToken The new address of GFAL Token.
     */
    function updateGfalToken(address newToken) external onlyOwner {
        require(newToken != address(0), "Not valid address");
        address _oldGfal = gfalToken;
        gfalToken = newToken;

        emit GfalTokenUpdated(_oldGfal, newToken);
    }

    /**
     * @dev Updates the address of Oracle Consumer.
     * @param newOracle The new address of Oracle Consumer.
     */
    function updateOracleConsumer(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Not valid address");
        address _oldOracle = oracleConsumer;
        oracleConsumer = newOracle;

        emit OracleConsumerUpdated(_oldOracle, newOracle);
    }

    /**
     * @dev Updates the address of Fee Collector.
     * @param newFeeCollector The new address of Fee Collector.
     */
    function updateFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Not valid address");

        address _oldCollector = feeCollector;
        feeCollector = newFeeCollector;

        emit FeeCollectorUpdated(_oldCollector, newFeeCollector);
    }

    /**
     * @dev Updates the address of Royalties Collector.
     * @param newCollector The new address of Royalties Collector.
     */
    function updateRoyaltiesCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Not valid address");

        address _oldCollector = royaltiesCollector;
        royaltiesCollector = newCollector;

        emit RoyaltyCollectorUpdated(_oldCollector, newCollector);
    }

    /**
     * @dev Updates the address of MarketPlace.
     * @param newMarketPlace The new address of MarketPlace.
     */
    function updateMarketPlace(address newMarketPlace) external onlyOwner {
        require(newMarketPlace != address(0), "Not valid address");

        address _oldMarketPlace = marketPlace;
        marketPlace = newMarketPlace;

        emit MarketPlaceUpdated(_oldMarketPlace, newMarketPlace);
    }

    // Getters
    /**
     * @dev Getter for the GfalToken (ERC20) address set.
     * @return GfalToken address set.
     */
    function getGfalToken() external view returns (address) {
        return gfalToken;
    }

    /**
     * @dev Getter for the admin address set.
     * @return admin address set.
     */
    function getAdmin() external view returns (address) {
        return admin;
    }

    /**
     * @dev Getter for the marketPlace (ERC721 & ERC1155) address set.
     * @return marketPlace address set.
     */
    function getMarketPlace() external view returns (address) {
        return marketPlace;
    }

    /**
     * @dev Getter for the oracle consumer address set.
     * @return oracle consumer address set.
     */
    function getOracleConsumer() external view returns (address) {
        return oracleConsumer;
    }

    /**
     * @dev Getter for the fee collector address set.
     * @return fee collector address set.
     */
    function getFeeCollector() external view returns (address) {
        return feeCollector;
    }

    /**
     * @dev Getter for the royalties collector address set.
     * @return royalties collector address set.
     */
    function getRoyaltiesCollector() external view returns (address) {
        return royaltiesCollector;
    }
}
