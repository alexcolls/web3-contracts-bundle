# G4ALProxy Smart Contract
This is a smart contract written in Solidity that serves as a proxy for the GFAL Token. The contract allows for the updating of various addresses related to the GFAL Token, such as the address of the Oracle Consumer, Fee Collector, Royalties Collector, and Marketplace.

## Functions
The G4ALProxy contract has the following functions:

## Constructor
`constructor(address _gfalToken)`

- Initializes the G4ALProxy contract with the given GFAL Token address and sets the Fee Collector and the Royalties Collector to the contract deployer.
- Parameters:
`_gfalToken: The address of GFAL Token.`

## updateGfalToken
`function updateGfalToken(address _newToken) external onlyOwner`

- Updates the address of GFAL Token.
- Parameters:
`_newToken: The new address of GFAL Token.`

## updateOracleConsumer
`function updateOracleConsumer(address _newOracle) external onlyOwner`

- Updates the address of Oracle Consumer.
- Parameters:
`_newOracle: The new address of Oracle Consumer.`

## updateFeeCollector
`function updateFeeCollector(address _newFeeCollector) external onlyOwner`

- Updates the address of Fee Collector.
- Parameters:
`_newFeeCollector: The new address of Fee Collector.`

## updateRoyaltiesCollector
`function updateRoyaltiesCollector(address _newCollector) external onlyOwner`

- Updates the address of Royalties Collector.
- Parameters:
`_newCollector: The new address of Royalties Collector.`

## updateMarketPlace
`function updateMarketPlace(address _newMarketPlace) external onlyOwner`

- Updates the address of MarketPlace.
- Parameters:
`_newMarketPlace: The new address of MarketPlace.`

## Events
The G4ALProxy contract emits the following events:

- GfalTokenUpdated(address oldGfalToken, address newGfalToken)
- OracleConsumerUpdated(address oldOracleConsumer, address newOracleConsumer)
- FeeCollectorUpdated(address oldFeeCollector, address newFeeCollector)
- RoyaltyCollectorUpdated(address oldRoyaltyCollector, address newRoyaltyCollector)
- MarketPlaceUpdated(address oldMarketPlace, address newMarketPlace)

Note: The G4ALProxy contract requires the use of the OpenZeppelin's Ownable contract.

##License
This smart contract is released under the MIT License.

## Solidity Version
- 0.8.19
