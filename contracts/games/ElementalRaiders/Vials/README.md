# ElementalRaidersVials Smart Contract

This smart contract allows users to mint and manage vials for the Elemental Raiders game. Vials can be claimed or purchased using the GFAL token or a card payment. The contract supports whitelisting for minting and keeps track of vial details, including price, supply, and ownership.

## Features

The ElementalRaidersVials smart contract offers the following features:

- **Mint Whitelisted Vials:** Users can mint whitelisted vials by providing a valid vial ID and proof.
- **Mint Vials:** Users can mint vials by purchasing them with the GFAL token or a card payment.
- **Burn Vials:** Owners can burn their vials to remove them from their inventory.
- **Create Vials:** Administrators can create new vials by specifying the price, maximum supply for sale, maximum claimable supply, and hash root.

## Dependencies

The ElementalRaidersVials smart contract relies on the following dependencies:

- IERC20: an interface for interacting with ERC20 tokens.
- SafeERC20: a library for safely handling ERC20 token transfers.
- MerkleProof: a library for verifying Merkle proofs.
- ERC1155URIStorage: an extension for ERC1155 tokens with URI storage.
- IOracleConsumer: an interface for getting exchange rates from an oracle.
- IG4ALProxy: an interface for storing contract addresses.

## Structures

### Vial

- price: The price of the vial in USD.
- maxSupplySale: The maximum supply of vials available for sale.
- totalSold: The total number of vials sold.
- maxClaimableSupply: The maximum number of vials that can be claimed.
- totalClaimed: The total number of vials claimed.
- hashRoot: The Merkle root hash used for whitelisting.

## Events

- MintWhitelisted: Emitted when a whitelisted vial is minted.
- Mint: Emitted when a vial is minted.
- VialCreated: Emitted when a new vial is created.
- vialBurned: Emitted when a vial is burned (destroyed).

## Modifiers

- onlyAdmin: Requires that the caller is the contract's admin.
- isWhitelist: Requires that the caller is whitelisted to mint a specific vial.

## Smart Contract Methods

### mintWhitelisted

Mints a whitelisted vial for a specific user. Requires the user to be whitelisted and the vial ID to be valid.

### mint

Mints a vial for a specific user. Requires the vial ID to be valid and available for sale.
The vial can be purchased by 2 ways:

- Using GFAL token as a payment method. In this case the user calls the `mint` function.
- By Card payment. In this case the mint function will be called by the admin once the user pays through our platform setting the user wallet as the `to` parameter

### burn

Burns a vial, removing it from the owner's inventory.

### createVial

Creates a new vial with the specified details. Requires the caller to be the contract's admin.

### setTokenRoyalty

Sets the new feeNumerator for the royaltyAmount.(ERC2981)

## Getters

- vials: Returns the details of a specific vial, including price, supply, and ownership.

- isMinted: Returns if an address claimed or not a specific vial collection, requiring as parameters the VialId and the public address.

- royaltyInfo: Returns the Royalty receiver and the the royaltyAmount. (ERC2981)

## Solidity Version

0.8.19

## License

This smart contract is released under the MIT License.
