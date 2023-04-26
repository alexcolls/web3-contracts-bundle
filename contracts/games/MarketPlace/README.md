# GFAL Marketplace Documentation
This is the documentation for the GFAL Marketplace smart contract.

The GFAL Marketplace is a decentralized platform for buying and selling non-fungible tokens (NFTs) using the GFAL token as a medium of exchange. The marketplace supports both ERC721 and ERC1155 token standards.

## Features
The GFAL Marketplace offers the following features:

- Sell NFTs: users can sell their NFTs by setting a price and amount for each token.
- Buy NFTs: users can purchase NFTs listed on the marketplace.
- Whitelist: only NFTs from whitelisted collections can be sold on the marketplace.
- ERC721 and ERC1155 support: the marketplace supports both token standards.
- Royalties: a percentage of the sales goes to the contract owner as royalties.
- Volume tracking: the total volume of all sales is tracked and can be queried.
- Maintenance mode: the marketplace can be temporarily disabled for maintenance.
- 
## Dependencies
The GFAL Marketplace relies on the following dependencies:

- OpenZeppelin: a library for secure smart contract development.
- OracleConsumer: a utility for getting exchange rates from an oracle.
- G4ALProxy: a utility for storing contract addresses and wallet addresses.

## Structures

### Sale
- price: Price of the NFT in USD or GFAL tokens.
- isDollar: Indicates whether the price is denominated in USD (true) or GFAL tokens (false).
- isForSale: Indicates whether the NFT is currently listed for sale.

### Whitelist
- allowed: Indicates whether the NFT collection is allowed to be traded on the marketplace.
- tokenStandard: Specifies the token standard (ERC721 or ERC1155) of the NFT collection.

## Events
- SellToken: Emitted when a token is listed for sale.
- BuyToken: Emitted when a token is purchased.
- RemoveToken: Emitted when a token is removed from sale listings.

## Modifiers
onlyTradableToken: Requires that the token is in a whitelisted collection and owned by the sender.

## Marketplace Methods

### sellToken
List an NFT for sale by specifying its contract address, token ID, price, and whether the price is denominated in USD or GFAL tokens. Requires the token to be in a whitelisted collection and owned by the sender.

### buyToken
Purchase an NFT by specifying its contract address, token ID, and the seller's address. Requires the buyer to have sufficient GFAL token allowance to cover the purchase price.

### removeToken
Remove an NFT from sale listings by specifying its contract address and token ID. Requires the token to be in a whitelisted collection and owned by the sender.

## Owner Functions

### updateCollection
Whitelist or blacklist an NFT collection by specifying its contract address, token standard (ERC721 or ERC1155), and whether it should be allowed.

### updateGFALToken
Update the GFAL token contract address.

### updateOracleConsumer
Update the OracleConsumer contract address.

### updateRoyaltiesInBasisPoints
Update the royalties percentage as basis points (e.g., 250 for 2.5%).

## Getters

### getSellersList
Returns the list of known sellers in the marketplace.

##License
This smart contract is released under the MIT License.

## Solidity Version
- 0.8.19
