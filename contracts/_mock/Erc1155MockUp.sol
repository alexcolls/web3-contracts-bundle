// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "../utils/OracleConsumer/IOracleConsumer.sol";
import "../utils/G4ALProxy/IG4ALProxy.sol";

// This contract has been created as a MockUp for testing the Marketplace using ERC1155 tokens.
contract Erc1155MockUp is ERC1155Supply {
    using SafeERC20 for IERC20;
    uint256 public mintedNFTs; //Total amount of Different NFTs minted
    IG4ALProxy public g4alProxy;

    // modifier onlyOwner() {
    //     require(msg.sender == g4alProxy.owner(), "Not owner");
    //     _;
    // }

    constructor(address _proxy, string memory _uri) ERC1155(_uri) {
        g4alProxy = IG4ALProxy(_proxy);
    }

    function mint(uint256 _amount) external {
        _mint(msg.sender, mintedNFTs, _amount, "");
        setApprovalForAll(g4alProxy.getMarketPlace(), true);
        mintedNFTs++;
    }
}
