## How to Add a New Network to Clober V2 Subgraph

To add a new network to the Clober V2 Subgraph, follow these steps:
1. create a new directory in the `config/networks` folder with the name of the network (e.g., `arbitrum`, `optimism`, etc.). 
   The chain name follows the format [goldsky supported chain names](https://docs.goldsky.com/chains/supported-networks)
2. create `chain.ts` and `config.json` files in the new directory.
   - `chain.ts` should export an object with the following properties:
     - `SKIP_TAKE_AND_SWAP`: A boolean indicating whether to skip the Take and Swap events (default is `false`). we recommend setting this to `true` if your subgraph cost is high.
     - `SKIP_TX_ANALYTICS`: A boolean indicating whether to skip transaction analytics (default is `false`). we recommend setting this to `true` if your subgraph cost is high.
     - `SKIP_USER_ANALYTICS`: A boolean indicating whether to skip user analytics (default is `false`). we recommend setting this to `true` if your subgraph cost is high.
     - `LIQUIDITY_VAULT`: A string representing the address of the liquidity vault contract for the network. Address strings should be in lowercase.
     - `NATIVE_TOKEN_DEFINITION`: A currency definition object for the native token of the network, which should include:
       - `address`: The address of the native token contract (e.g., "0x0000000000000000000000000000000000000000" for Ethereum). Address strings should be in lowercase.
       - `name`: The name of the token (e.g., "Ether").
       - `symbol`: The symbol of the token (e.g., "ETH").
       - `decimals`: The number of decimals for the token (e.g., 18).
     - `NATIVE_TOKEN_BOOK_ID`: A string representing the **bid book ID** for the native token and stablecoin pair on the network. 
       This is used for the native token and stablecoin pair, such as "ETH-USDC" for Ethereum.
     - `STABLE_COINS`: An array of address strings representing the stablecoin contracts on the network. Address strings should be in lowercase.
     - `MINIMUM_USD_LOCKED`: A number representing the minimum USD value of locked liquidity for the network. This is used to filter out networks with low liquidity.
     - `REFERENCE_TOKEN`: A string representing the address of the reference token contract for the network. Address strings should be in lowercase.
     - `STATIC_TOKEN_DEFINITIONS`: An array of currency definition objects for static tokens on the network. This helps in fetching token data when the chain does not support the historical `eth_call` method. Each object should include:
       - `address`: The address of the token contract (e.g., "0x0000000000000000000000000000000000000000" for Ethereum). Address strings should be in lowercase.
       - `name`: The name of the token (e.g., "Wrapped Ether").
       - `symbol`: The symbol of the token (e.g., "WETH").
       - `decimals`: The number of decimals for the token (e.g., 18).
   - `config.json` should contain any additional configuration needed for the network.
     - `network`: The name of the network (e.g., "arbitrum", "optimism", etc.). It should match the directory name.
     - `hasRouterGateway`: A boolean indicating whether the network has a router gateway (default is `false`). If this is set to `true`, the subgraph will include the router gateway events.