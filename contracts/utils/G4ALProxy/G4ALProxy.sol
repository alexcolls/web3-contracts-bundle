// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract G4ALProxy is Ownable {
    address private gfalToken; // Address of GFAL Token
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
     *      Fee Collector and the Royalties Collector to the contract deployer.
     * @param _gfalToken The address of GFAL Token.
     */
    constructor(address _gfalToken, address _admin) {
        feeCollector = msg.sender;
        royaltiesCollector = msg.sender;
        gfalToken = _gfalToken;
        admin = _admin;
    }

    /**
     * @dev Updates the address of admin.
     * @param _newAdmin The new address of admin.
     */
    function updateAdmin(address _newAdmin) external onlyOwner {
        require(_newAdmin != address(0), "Not valid address");
        address _oldAdmin = admin;
        admin = _newAdmin;

        emit AdminUpdated(_oldAdmin, _newAdmin);
    }

    /**
     * @dev Updates the address of GFAL Token.
     * @param _newToken The new address of GFAL Token.
     */
    function updateGfalToken(address _newToken) external onlyOwner {
        require(_newToken != address(0), "Not valid address");
        address _oldGfal = gfalToken;
        gfalToken = _newToken;

        emit GfalTokenUpdated(_oldGfal, _newToken);
    }

    /**
     * @dev Updates the address of Oracle Consumer.
     * @param _newOracle The new address of Oracle Consumer.
     */
    function updateOracleConsumer(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Not valid address");
        address _oldOracle = oracleConsumer;
        oracleConsumer = _newOracle;

        emit OracleConsumerUpdated(_oldOracle, _newOracle);
    }

    /**
     * @dev Updates the address of Fee Collector.
     * @param _newFeeCollector The new address of Fee Collector.
     */
    function updateFeeCollector(address _newFeeCollector) external onlyOwner {
        require(_newFeeCollector != address(0), "Not valid address");

        address _oldCollector = feeCollector;
        feeCollector = _newFeeCollector;

        emit FeeCollectorUpdated(_oldCollector, _newFeeCollector);
    }

    /**
     * @dev Updates the address of Royalties Collector.
     * @param _newCollector The new address of Royalties Collector.
     */
    function updateRoyaltiesCollector(
        address _newCollector
    ) external onlyOwner {
        require(_newCollector != address(0), "Not valid address");

        address _oldCollector = royaltiesCollector;
        royaltiesCollector = _newCollector;

        emit RoyaltyCollectorUpdated(_oldCollector, _newCollector);
    }

    /**
     * @dev Updates the address of MarketPlace.
     * @param _newMarketPlace The new address of MarketPlace.
     */
    function updateMarketPlace(address _newMarketPlace) external onlyOwner {
        require(_newMarketPlace != address(0), "Not valid address");

        address _oldMarketPlace = marketPlace;
        marketPlace = _newMarketPlace;

        emit MarketPlaceUpdated(_oldMarketPlace, _newMarketPlace);
    }

    // Getters
    function getGfalToken() external view returns (address) {
        return gfalToken;
    }

    function getAdmin() external view returns (address) {
        return admin;
    }

    function getMarketPlace() external view returns (address) {
        return marketPlace;
    }

    function getOracleConsumer() external view returns (address) {
        return oracleConsumer;
    }

    function getFeeCollector() external view returns (address) {
        return feeCollector;
    }

    function getRoyaltiesCollector() external view returns (address) {
        return royaltiesCollector;
    }
}
