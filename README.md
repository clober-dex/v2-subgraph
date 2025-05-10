# Clober V2 Subgraph

## Development

1. Install dependencies
   `yarn install`

2. Build a v2 subgraph
   `yarn build --network <network>`

Note: Deployments will fail if there are uncommitted changes in the subgraph. Please commit your changes before deploying.

## TODO
- Store events for Make, Take, Claim, Cancel, Mint, and Burn in the schema
- Add an entity to track and sort LP balances per user
- Merge schema from [clober-analytics-subgraph](https://github.com/clober-dex/clober-analytics-subgraph)  
  _(Note: that repo does not store accurate TVL snapshots)_

### References

Much of the implementation was inspired by [Uniswap v3 Subgraph](https://github.com/Uniswap/v3-subgraph).