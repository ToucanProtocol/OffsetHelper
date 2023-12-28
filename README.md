# Offset Helper

This contract simplifies the carbon offsetting process on Toucan.

More specifically, the Offset Helper abstracts the process of using a stablecoin to acquire and retire TCO2. This process normally looks like:

- user exchanges USDC (a stablecoin) for carbon reference tokens like BCT or NCT using a DEX like Uniswap, Sushiswap, etc. (depending on network)
- user interacts with the BCT/NCT pool token contract to redeem TCO2 tokens from within the pool
- user interacts with the TCO2 token contract to retire the TCO2

You can see this process explained in more depth in our [docs](https://docs.toucan.earth/toucan/introduction/overview). 

With the OffsetHelper contract, the user only needs to interact with the OffsetHelper contract, which will take care of the rest in a single transaction.

## Deployments

For current deployments, see the `./deployments` folder.

## OffsetHelper

The `OffsetHelper` contract implements helper functions that simplify the carbon offsetting (retirement) process.

See [./docs/OffsetHelper.md](./docs/OffsetHelper.md) for detailed documentation.

### Development

## Prerequisites

1. Install the required packages:
   ```
   yarn
   ```
2. Copy `.env.example` to `.env` and modify values of the required environment variables:
   1. `POLYGON_URL`/`MUMBAI_URL` to specify your preferred RPC endpoints for Polygon Mainnet and the Mumbai Testnet.
   2. `PRIVATE_KEY` and `POLYGONSCAN_KEY` in order to deploy contract and publish source code on [polygonscan](https://polygonscan.com).

## Commands

```bash
# install dependencies
yarn install

# test the contract
yarn test

# generate documentation
yarn doc

# deploy the contract
yarn hardhat deploy --network <network>

# verify the contract
yarn hardhat verify:offsetHelper --network mumbai --address <address where Offset Helper was deployed>
```
