# OracleConsumer Smart Contract

The OracleConsumer smart contract allows the exchange of USD to GFAL tokens using a conversion rate. The conversion rate is determined by the last known value of the GFAL token exchange rate in USD. This value can be updated by the owner of the contract using the updateRateValue function.

## Usage

Once the OracleConsumer contract is deployed to a compatible Ethereum network, you can interact with it using a web3 provider, such as Metamask, or a command-line interface, such as Remix.

### Constructor

**constructor(address \_g4alProxy)**

- Initializes the OracleConsumer contract with the given GFAL Token address and sets the Fee Collector and the Royalties Collector to the contract deployer.
- Parameters:
  **\_gfalToken:** The address of GFAL Token (ERC20).

### Functions

**getConversionRate(uint256 value)**
This function takes one parameter, value, which is the value in USD to exchange for GFAL tokens. It returns the amount of GFAL tokens for the given USD value, based on the last known value of the GFAL token exchange rate in USD.

**updateRateValue(uint256 \_lastTokenRateValue)**
This function is used by the owner of the contract to update the last known value of the GFAL token exchange rate. It takes one parameter, \_lastTokenRateValue, which is the new value of the GFAL token exchange rate.

### Events

**UpdateRate(uint256 value)**
This event is emitted when the exchange rate is updated by the owner of the contract. It includes the new value of the GFAL token exchange rate.

## Solidity Version

- 0.8.19

## License

This smart contract is released under the MIT License.
