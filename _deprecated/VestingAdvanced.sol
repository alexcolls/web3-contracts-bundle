// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract VestingAdvanced is Ownable {
    using SafeERC20 for IERC20;

    address public vestingToken;
    mapping(address => uint256) public collectors;
    address[] public collectorsList; // This keep track of the addresses keys of "collectors" mapping, in order to iterate it for _getVestingAmount(x) calculation
    uint256 public unlockTime; // it must be future, imagine that -> 13rd March 11h am UTC -> 1678705200

    Vesting[] public vestingSchedule;
    mapping(address => uint256) public nextVestingPeriods;
    mapping(address => uint256) public blacklistingPeriod;

    struct Vesting {
        uint256 when; // timestamp of when the vesting item is able to be claimed
        uint256 amount; // amount of tokens to withdraw, in Wei
    }

    event Withdrawal(address who, uint256 when, uint256 amount);

    constructor(address _vestingToken, address[] memory _collectorsAddresses, uint256[] memory _collectorsTiers, uint256 _unlockTime) {
        require(_vestingToken != address(0), "Vesting token should be a valid address");
        for (uint256 i = 0; i < _collectorsAddresses.length; i++) {
            require(_collectorsAddresses[i] != address(0), "Vesting collector address should be a valid address");
            require(_collectorsTiers[i] != 0, "Vesting collector tier should be a valid tier");

            collectors[_collectorsAddresses[i]] = _collectorsTiers[i];
            collectorsList.push(_collectorsAddresses[i]);
        }
        require(block.timestamp < _unlockTime, "Unlock time should be in the future");
        // Unlock variables initialization
        vestingToken = _vestingToken;
        unlockTime = _unlockTime;
    }

    function withdraw() public {
        require(collectors[msg.sender] != 0, "Sender must be whitelisted");
        require(blacklistingPeriod[msg.sender] == 0 || blacklistingPeriod[msg.sender] > nextVestingPeriods[msg.sender], "Sender must be not blacklisted");
        require(block.timestamp >= unlockTime, "Vesting schedule should be after unlockTime");
        require(nextVestingPeriods[msg.sender] < vestingSchedule.length, "All vesting periods have been claimed");
        uint256 claimableAmount;

        // Foreach vestingSchedule is existing in the array
        for (uint256 i = nextVestingPeriods[msg.sender]; i < vestingSchedule.length; i++) {
            // If the vesting schedule is not vested and is available to vest by timestamp && is not blacklisted for this period and beyond
            //if (vestingSchedule[i].when <= block.timestamp && (blacklistingPeriod[msg.sender] == 0 || blacklistingPeriod[msg.sender] > i)) {
            if (vestingSchedule[i].when <= block.timestamp) {
                // Increment the claimable amount
                claimableAmount += _getVestingAmount(vestingSchedule[i].amount, i);
                // Set the array index of last vested in order to avoid useless iterations next time
                nextVestingPeriods[msg.sender] = i + 1;
                // Emit the event for each one of them
                emit Withdrawal(msg.sender, block.timestamp, vestingSchedule[i].amount);
            }
        }

        require(claimableAmount > 0, "You cannot vest zero amount");

        // Transfer the amount from the contract to the vestingCollector
        IERC20(vestingToken).safeTransfer(msg.sender, claimableAmount);
    }

    function _getVestingAmount(uint256 amount, uint256 vestingPeriod) private view returns (uint256) {
        uint256 collectorsTierSum;

        for (uint256 i = 0; i < collectorsList.length; i++) {
            if (blacklistingPeriod[collectorsList[i]] == 0 || blacklistingPeriod[collectorsList[i]] > vestingPeriod) {
                collectorsTierSum += collectors[collectorsList[i]];
            }
        }

        uint256 relativeAmount = (amount / collectorsTierSum) * collectors[msg.sender];

        return relativeAmount;
    }

    function setVestingSchedule(uint256[] memory when, uint256[] memory amount) public onlyOwner {
        require(block.timestamp < unlockTime, "Setting vesting schedule should be before unlockTime");
        require(vestingSchedule.length == 0, "Setting vesting schedule not permitted after first setup");
        require(when.length == amount.length, "When.length length must be the same as Amount.length");

        for (uint256 i = 0; i < when.length; i++) {
            Vesting memory currentVesting = Vesting(
                when[i],
                amount[i]
            );
            vestingSchedule.push(currentVesting);
        }
    }

    function setVesterAddresses(address[] memory _collectors, uint256[] memory _tiers) public {
        require(_collectors.length == _tiers.length, "Arrays length must be the same");

        for (uint256 i = 0; i < _collectors.length; i++) {
            require(_collectors[i] != address(0), "Vesting collector address should be a valid address");
            require(_tiers[i] != 0, "Vesting collector tier should be a valid tier");

            collectors[_collectors[i]] = _tiers[i];
            collectorsList.push(_collectors[i]);
        }
    }

    function blacklistVesterAddress(address collector) public onlyOwner {
        blacklistingPeriod[collector] = nextVestingPeriods[msg.sender] + 1;
    }
}
