// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OracleConsumer is Ownable {
    using SafeMath for uint256;

    uint256 public lastTokenRateValue = 0;
    uint256 public dollarValue = 1000000000000000000; // 1^-18

    // Getters

    function getRateValue() external returns (uint256) {
        return lastTokenRateValue;
    }

    function getConversionRate(uint256 price) external returns (uint256) {
        return dollarValue.div(lastTokenRateValue).mul(price); // TODO: Check
    }

    // Owner

    function updateRateValue(uint256 _lastTokenRateValue) external onlyOwner {
        // TODO: require something? parsing or validating the value?
        lastTokenRateValue = _lastTokenRateValue;
    }
}
