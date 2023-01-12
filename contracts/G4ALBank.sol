// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";
// Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
//console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

contract G4ALBank is AccessControl, ReentrancyGuard {
    using SafeMath for uint256;

    bytes32 public constant SPENDER_ROLE = keccak256("SPENDER_ROLE");

    address public ggtToken;
    mapping(address => bool) public games; // games are intended as game developer addresses
    mapping(address => mapping(address => uint256)) public balances; // nested mapping as: userAddress => (gameAddress => balanceAmount)

    event Deposit(uint amount, uint when, address who, address game);
    event Withdrawal(uint amount, uint when, address who, address game);
    event Spent(uint amount, uint when, address who, address game);

    constructor(address _ggtToken) {
        ggtToken = _ggtToken;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SPENDER_ROLE, msg.sender);
    }

    // External

    function deposit(uint256 _amount, address _game) external nonReentrant {
        require(hasRole(SPENDER_ROLE, _game), "Game doesn't exists");

        // Approve and transferFrom the user to this contract
        IERC20(ggtToken).approve(address(this), _amount);
        IERC20(ggtToken).transferFrom(msg.sender, address(this), _amount);

        // Approve spending for BankConsumer. This allows bank consumers to move this amount when GameServer wants.
        IERC20(ggtToken).approve(_game, _amount);

        balances[msg.sender][_game] = balances[msg.sender][_game].add(_amount);

        emit Deposit(_amount, block.timestamp, msg.sender, _game);
    }

    function withdraw(uint256 _amount, address _game) external nonReentrant {
        require(balances[msg.sender][_game] >= _amount, "Insufficient funds");

        balances[msg.sender][_game] = balances[msg.sender][_game].sub(_amount);

        IERC20(ggtToken).transferFrom(address(this), msg.sender, _amount);

        emit Withdrawal(_amount, block.timestamp, msg.sender, _game);
    }

    function spend(uint _amount, address _user) external onlyRole(SPENDER_ROLE) nonReentrant {
        require(getUserBalanceByGame(_user, msg.sender) >= _amount, "Insufficient funds");
        IERC20(ggtToken).transferFrom(address(this), msg.sender, _amount);

        balances[_user][msg.sender] = balances[_user][msg.sender].sub(_amount);

        emit Spent(_amount, block.timestamp, _user, msg.sender);
    }

    // Getters

    function getContractBalance() public view returns (uint) {
        return IERC20(ggtToken).balanceOf(address(this));
    }

    function getUserBalanceByGame(address _user, address _game) public view returns (uint) {
        return balances[_user][_game];
    }

    // Owner

    function addGame(address _game) external onlyRole(DEFAULT_ADMIN_ROLE) {
        games[_game] = true;
    }

    function removeGame(address _game) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(games[_game] == true, "Game not existing in mapping");

        games[_game] = false;
    }

    // TODO: function to rug the balance in case of need (no please)


}
