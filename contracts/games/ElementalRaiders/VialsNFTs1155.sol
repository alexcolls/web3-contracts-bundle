pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract VialsNFTs1155 is ERC1155 {
    constructor(string memory _baseUri) ERC1155(_baseUri) {}
}
