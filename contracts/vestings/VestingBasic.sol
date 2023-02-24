// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract VestingBasic is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VESTER_ROLE = keccak256("VESTER_ROLE");

    address public vestingToken;
    address public vestingCollector;
    uint public unlockTime; // it must be future, imagine that -> 13rd March 11h am UTC -> 1678705200

    Vesting[] public vestingSchedule;
    uint public nextVestingPeriod;

    struct Vesting {
        uint when; // timestamp of when the vesting item is able to be claimed
        uint amount; // amount of tokens to withdraw, in Wei
    }

    event Withdrawal(uint when, uint amount);

    constructor(address _vestingToken, address _vestingCollector, uint _unlockTime) {
        require(_vestingToken != address(0), "Vesting token should be a valid address");
        require(_vestingCollector != address(0), "Vesting collector should be a valid address");
        require(block.timestamp < _unlockTime, "Unlock time should be in the future");

        // Unlock variables initialization
        vestingToken = _vestingToken;
        vestingCollector = _vestingCollector;
        unlockTime = _unlockTime;

        // Granting default role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function withdraw() public onlyRole(VESTER_ROLE) {
        require(block.timestamp >= unlockTime, "Vesting schedule should be after unlockTime");
        require(nextVestingPeriod < vestingSchedule.length, "All vesting periods have been claimed");
        uint claimableAmount;

        // Foreach vestingSchedule is existing in the array
        for (uint i = nextVestingPeriod; i < vestingSchedule.length; i++) {
            // If the vesting schedule is not vested and is available to vest by timestamp
            if (vestingSchedule[i].when <= block.timestamp) {
                // Increment the claimable amount
                claimableAmount += vestingSchedule[i].amount;
                // Set the array index of last vested in order to avoid useless iterations next time
                nextVestingPeriod = i + 1;
                // Emit the event for each one of them
                emit Withdrawal(block.timestamp, vestingSchedule[i].amount);
            }
        }

        require(claimableAmount > 0, "You cannot vest zero amount");

        // Transfer the amount from the contract to the vestingCollector
        IERC20(vestingToken).safeTransfer(vestingCollector, claimableAmount);
    }

    function setVestingSchedule(uint[] memory when, uint[] memory amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(block.timestamp < unlockTime, "Setting vesting schedule should be before unlockTime");
        require(vestingSchedule.length == 0, "Setting vesting schedule not permitted after first setup");
        require(when.length == amount.length, "When.length length must be the same as Amount.length");

        for (uint i = 0; i < when.length; i++) {
            Vesting memory currentVesting = Vesting(
                when[i],
                amount[i]
            );
            vestingSchedule.push(currentVesting);
        }
    }
}
