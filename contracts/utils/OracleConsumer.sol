// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OracleConsumer is Ownable {
    using SafeMath for uint256;

    uint256 public lastTokenRateValue = 0;
    uint256 public dollarValue = 1000000000000000000; // 1^-18

    event UpdateRate(uint256 value);

    // Getters

    function getConversionRate(uint256 value) public view returns (uint256) {
        return dollarValue.div(lastTokenRateValue).mul(value);
    }

    // Owner

    function updateRateValue(uint256 _lastTokenRateValue) external onlyOwner {
        lastTokenRateValue = _lastTokenRateValue;

        emit UpdateRate(_lastTokenRateValue);
    }
}
