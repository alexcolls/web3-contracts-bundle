// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameGoldToken is ERC20 {
    constructor() ERC20("Game Gold Token", "GGT") {
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}