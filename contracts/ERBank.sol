// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";

contract ERBank is Ownable {
    address public ggtToken;

    event Deposit(uint amount, uint when, address who);
    event Withdrawal(uint amount, uint when, address who);

    // Receive function callback
    receive() external {
        // TODO: Check it is $GGT
    }

    constructor(address _tokenAddress) {
        // TODO: Initialize the token address for $GGT token
    }

    // Deposit method to deposit some tokens
    function deposit(uint256 _amount) public {
        // Deposit some tokens

        // TODO: Require approval

        // TODO: Require transfer success

        balances[msg.sender] = balances[msg.sender].add(msg.value);

        emit Deposit(_amount, block.timestamp, msg.sender);
    }

    function withdraw(uint256 _amount) public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        //console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);
        require(balances[msg.sender] >= _amount, "Insufficient funds");

        // TODO: Update mapping value for partial amount withdrawal

        _owner.transfer(_amount);

        emit Withdrawal(_amount, block.timestamp, msg.sender);
    }
}
