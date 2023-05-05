// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IG4ALProxy {
    function getAdmin() external view returns (address);

    function Owner() external view returns (address);

    function getGfalToken() external view returns (address);

    function getMarketPlace() external view returns (address);

    function getOracleConsumer() external view returns (address);

    function getFeeCollector() external view returns (address);

    function getRoyaltiesCollector() external view returns (address);
}
