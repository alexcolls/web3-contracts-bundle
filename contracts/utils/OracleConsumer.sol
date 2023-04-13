// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./G4ALProxy.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract OracleConsumer {
    G4ALProxy public g4alProxy;

    uint256 public lastTokenRateValue = 0;
    uint256 public dollarValue = 1000000000000000000; // 1^-18

    event UpdateRate(uint256 value);

    modifier onlyOwner() {
        require(msg.sender == g4alProxy.owner(), "Not owner");
        _;
    }

    constructor(address _g4alProxy) {
        g4alProxy = G4ALProxy(_g4alProxy);
    }

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
