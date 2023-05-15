// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../G4ALProxy/IG4ALProxy.sol";
import "./IOracleConsumer.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * @title OracleConsumer
 * @dev This contract allows the exchange of USD to GFAL tokens using a conversion rate.
 */
contract OracleConsumer is IOracleConsumer {
    // Address of the G4ALProxy contract
    IG4ALProxy private immutable g4alProxy;

    // The last known value of the GFAL token exchange rate in USD
    uint256 public lastTokenRateValue;
    // The value of 1 USD in wei (18 decimal places)
    uint64 constant dollarValue = 1e18; // 1.000.000.000.000.000.000

    // Event emitted when the exchange rate is updated
    event UpdatedRate(uint256 value);

    /**
     * @dev Modifier to ensure that only the admin set in the proxy contract can execute certain functions.
     */
    modifier onlyAdmin() {
        require(msg.sender == g4alProxy.getAdmin(), "Not Admin");
        _;
    }

    /**
     * @dev Constructor function to set the G4ALProxy contract address.
     * @param _g4alProxy The address of the G4ALProxy contract.
     * @param _newTokenRateValue The new value of the GFAL token exchange rate.
     */
    constructor(address _g4alProxy, uint256 _newTokenRateValue) {
        require(_newTokenRateValue > 0, "RateValue cannot be 0");
        lastTokenRateValue = _newTokenRateValue;
        g4alProxy = IG4ALProxy(_g4alProxy);
    }

    /**
     * @dev Function to get the amount of GFAL tokens for a given USD value.
     * @param value The value in USD to exchange for GFAL tokens.
     * @return The amount of GFAL tokens for the given USD value.
     */
    function getConversionRate(uint256 value) external view returns (uint256) {
        return (dollarValue * value) / lastTokenRateValue;
    }

    // Owner
    /**
     * @dev Function for the owner of the contract to update the last known value of the GFAL token exchange rate.
     * @param newValue The new value of the GFAL token exchange rate.
     */
    function updateRateValue(uint256 newValue) external onlyAdmin {
        require(newValue > 0, "RateValue cannot be 0");
        lastTokenRateValue = newValue;

        // Emit an event to signal that the rate has been updated
        emit UpdatedRate(newValue);
    }
}
