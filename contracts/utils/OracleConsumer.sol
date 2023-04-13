// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract OracleConsumer is Ownable {
    uint256 public lastTokenRateValue = 0;
    uint256 public dollarValue = 1000000000000000000; // 1^-18

    event UpdateRate(uint256 value);

    // Getters

    function getConversionRate(uint256 value) public view returns (uint256) {
        return (dollarValue * value) / lastTokenRateValue;
    }

    // Owner

    function updateRateValue(uint256 _lastTokenRateValue) external onlyOwner {
        lastTokenRateValue = _lastTokenRateValue;

        emit UpdateRate(_lastTokenRateValue);
    }
}
