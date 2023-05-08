// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../G4ALProxy/IG4ALProxy.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * @title OracleConsumer
 * @dev This contract allows the exchange of USD to GFAL tokens using a conversion rate.
 */
contract OracleConsumer {
    // Address of the G4ALProxy contract
    IG4ALProxy public g4alProxy;

    // The last known value of the GFAL token exchange rate in USD
    uint256 public lastTokenRateValue = 0;
    // The value of 1 USD in wei (18 decimal places)
    uint256 public dollarValue = 1000000000000000000; // 1^-18

    // Event emitted when the exchange rate is updated
    event UpdateRate(uint256 value);

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
     */
    constructor(address _g4alProxy) {
        g4alProxy = IG4ALProxy(_g4alProxy);
    }

    /**
     * @dev Function to get the amount of GFAL tokens for a given USD value.
     * @param value The value in USD to exchange for GFAL tokens.
     * @return The amount of GFAL tokens for the given USD value.
     */
    function getConversionRate(uint256 value) public view returns (uint256) {
        return (dollarValue * value) / lastTokenRateValue;
    }

    // Owner
    /**
     * @dev Function for the owner of the contract to update the last known value of the GFAL token exchange rate.
     * @param _lastTokenRateValue The new value of the GFAL token exchange rate.
     */
    function updateRateValue(uint256 _lastTokenRateValue) external onlyAdmin {
        lastTokenRateValue = _lastTokenRateValue;

        // Emit an event to signal that the rate has been updated
        emit UpdateRate(_lastTokenRateValue);
    }
}
