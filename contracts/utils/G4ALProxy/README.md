# G4ALProxy Smart Contract

G4ALProxy is an Solidity smart contract designed to facilitate the integration of multiple ERC20, ERC721, and ERC1155 tokens into a unified ecosystem. It provides an interface for token holders, fee collectors, and royalties collectors to interact with the underlying tokens and their associated marketplaces. The contract allows for the updating of various addresses related to the GFAL Token, such as the address of the Oracle Consumer, Fee Collector, Royalties Collector, Admin and Marketplace.

## Functions

The G4ALProxy contract has the following functions:

## Constructor

**constructor(address \_gfalToken, address \_admin)**

- Initializes the G4ALProxy contract with the given GFAL Token address, admin address as a bundler role and sets the Fee Collector and the Royalties Collector to the contract deployer.
- Parameters:
  **\_gfalToken:** The address of GFAL Token (ERC20).
  **\_admin:** The address of the Admin (Bundler).

## Functions

**updateAdmin**: Allows the owner of the contract to update the admin address.
**updateGfalToken**: Allows the owner of the contract to update the GFAL Token address.
**updateOracleConsumer**: Allows the owner of the contract to update the G4AL price feed address.
**updateFeeCollector**: Allows the owner of the contract to update the fee collector address for minting NFTs.
**updateRoyaltiesCollector**: Allows the owner of the contract to update the royalties collector address for the marketplace.
**updateMarketPlace**: Allows the owner of the contract to update the ERC721 and ERC1155 marketplace address.

**getGfalToken**: Returns the GFAL Token address.
**getAdmin**: Returns the admin address.
**getMarketPlace**: Returns the ERC721 and ERC1155 marketplace address.
**getOracleConsumer**: Returns the G4AL price feed address.
**getFeeCollector**: Returns the fee collector address for minting NFTs.

## Events

The G4ALProxy contract emits the following events:

- GfalTokenUpdated(address oldGfalToken, address newGfalToken)
- OracleConsumerUpdated(address oldOracleConsumer, address newOracleConsumer)
- FeeCollectorUpdated(address oldFeeCollector, address newFeeCollector)
- RoyaltyCollectorUpdated(address oldRoyaltyCollector, address newRoyaltyCollector)
- MarketPlaceUpdated(address oldMarketPlace, address newMarketPlace)
- AdminUpdated(address oldAdmin, address newAdmin)

Note: The G4ALProxy contract requires the use of the OpenZeppelin's Ownable contract.

## Solidity Version

- 0.8.19

## License

This contract is licensed under the MIT license.
