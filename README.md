# Clober V2 Subgraph

## Development

1. Install dependencies
   `yarn install`

2. Build a v2 subgraph
   `yarn build --network <network>`

Note: Deployments will fail if there are uncommitted changes in the subgraph. Please commit your changes before deploying.

## How to add a new network
see the how to add [doc](./config/how_to_add_new_network.md) for instructions

## TODO
- Store events for Make, ~~Take~~, Claim, Cancel, Mint, and Burn in the schema
- Add an entity to track and sort LP balances per user

### References

Much of the implementation was inspired by [Uniswap v3 Subgraph](https://github.com/Uniswap/v3-subgraph).