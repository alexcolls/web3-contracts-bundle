// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract G4ALProxy is Ownable {
    address public gfalToken;
    address public oracleConsumer;
    address public feeCollector;
    address public marketPlace;
    address public skillCollection;
    address public skinCollection;

    event GfalTokenUpdated(address oldGfalToken, address newGfalToken);
    event OracleConsumerUpdated(
        address oldOracleConsumer,
        address newOracleConsumer
    );
    event FeeCollectorUpdated(address oldFeeCollector, address newFeeCollector);
    event MarketPlaceUpdated(address oldMarketPlace, address newMarketPlace);
    event SkillCollectionUpdate(address oldCollection, address newCollection);
    event SkinCollectionUpdate(address oldCollection, address newCollection);

    constructor() {}

    // Setter for new ERC20 Token address
    function updateGfalToken(address _newToken) external onlyOwner {
        require(_newToken != address(0), "Not valid address");
        address _oldGfal = gfalToken;
        gfalToken = _newToken;

        emit GfalTokenUpdated(_oldGfal, _newToken);
    }

    // Setter for new Oracle Consumer address
    function updateOracleConsumer(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Not valid address");
        address _oldOracle = oracleConsumer;
        oracleConsumer = _newOracle;

        emit OracleConsumerUpdated(_oldOracle, _newOracle);
    }

    // Setter for new Fee Collector address
    function updateFeeCollector(address _newFeeCollector) external onlyOwner {
        require(_newFeeCollector != address(0), "Not valid address");

        address _oldCollector = feeCollector;
        feeCollector = _newFeeCollector;

        emit FeeCollectorUpdated(_oldCollector, _newFeeCollector);
    }

    // Setter for new MarketPlace address (For ERC721)
    function updateMarketPlace(address _newMarketPlace) external onlyOwner {
        require(_newMarketPlace != address(0), "Not valid address");

        address _oldMarketPlace = marketPlace;
        marketPlace = _newMarketPlace;

        emit MarketPlaceUpdated(_oldMarketPlace, _newMarketPlace);
    }

    // Setter for new NFT Skill Collection address
    function updateSkillCollection(address _newCollection) external onlyOwner {
        require(_newCollection != address(0), "Not valid address");

        address _oldCollection = skillCollection;
        skillCollection = _newCollection;

        emit SkillCollectionUpdate(_oldCollection, _newCollection);
    }

    // Setter for new NFT Skin Collection address
    function updateSkinCollection(address _newCollection) external onlyOwner {
        require(_newCollection != address(0), "Not valid address");

        address _oldCollection = skinCollection;
        skinCollection = _newCollection;

        emit SkinCollectionUpdate(_oldCollection, _newCollection);
    }
}
