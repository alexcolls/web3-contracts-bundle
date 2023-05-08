# Elemental Raiders Skin (ERSKIN)

This smart contract represents an ERC721 token for the Elemental Raiders Skill game. The contract allows the game to mint tokens safely by ensuring that users have approved the required amount of GFAL tokens before minting, and allows the Marketplace smart contract to manage all NFTs.

## Functionality
Bundler safely mints an ERC721 token for a user if the user has approved the required amount of GFAL tokens (Price by rarity).
Allows the admin (set in the proxy contract) to update minting prices and the base URI.
Implements the ERC721, ERC721Enumerable, and ERC721Burnable interfaces.
Allows querying of the owner of a token by token ID or array of token IDs.

## Usage
The contract owner sets the G4AL proxy address and the base URI for the token metadata by calling the constructor.
The game client checks if the user has approved the required amount of GFAL tokens and sends a request to the server to start the minting process.
If the minting is successful, the GFAL tokens are transferred from the user's wallet to the collector's wallet, and the ERC721 token is minted and sent to the user's address.
If the ERC721 token is minted successfully, the user's address is set as the owner of the token and the setApprovalForAll() function is called to allow the Marketplace smart contract to manage the token. This is meanly done to avoid friction for the user.

## Key Features
- SafeERC20 and Counters are used to handle token transfers and manage the number of tokens minted.
- ERC721, ERC721Enumerable, and ERC721Burnable are used to provide standard ERC721 token functionality.
- OracleConsumer is used to fetch GFAL price conversion rates from an external API.
- G4ALProxy is used to store contract addresses.
- The safeMint function safely mints an ERC721 token for a user if the user has approved the required amount of GFAL tokens.
- The getOwnersByTokens function returns the address of the token owner for the provided array of token ids.
- The getMintingPricesByRarity function returns the price for the provided array of rarity ids.

## License
This smart contract is released under the MIT License.

## Solidity Version
- 0.8.19
