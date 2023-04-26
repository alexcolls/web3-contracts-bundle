# Smart Contract Readme: ElementalRaidersSkill
ElementalRaidersSkill is an ERC721 token for the Game Elemental Raiders. This smart contract allows the game to mint tokens safely and efficiently by ensuring that users have approved the required amount of GFAL tokens before minting.

The ElementalRaidersSkill smart contract uses the OpenZeppelin library for ERC20 token transfers and ERC721 token functionality. It also uses the OracleConsumer and G4ALProxy contracts for GFAL price conversion and to store contract addresses.


## Key Features
- SafeERC20 and Counters are used to handle token transfers and manage the number of tokens minted.
- ERC721, ERC721Enumerable, and ERC721Burnable are used to provide standard ERC721 token functionality.
- OracleConsumer is used to fetch GFAL price conversion rates from an external API.
- G4ALProxy is used to store contract addresses.
- The safeMint function safely mints an ERC721 token for a user if the user has approved the required amount of GFAL tokens.
- The getOwnersByTokens function returns the address of the token owner for the provided array of token ids.
- The getMintingPricesByRarity function returns the price for the provided array of rarity ids.

##License
This smart contract is released under the MIT License.

## Solidity Version
- 0.8.19
