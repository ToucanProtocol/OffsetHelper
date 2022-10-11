# Offset Helper

This contract has the purpose to simplify the carbon offsetting process.

What it does in more exact terms is it abstracts the process of retiring TCO2, which normally looks like so:

- user exchanges USDC for BCT/NCT tokens at one of the DEXs (Uniswap, Sushiswap, etc. depending on network)
- user interacts with the BCT/NCT token contract to redeem the tokens for TCO2
- user interacts with the TCO2 token contract to retire the TCO2

With the OffsetHelper contract, the user only needs to interact with the OffsetHelper contract, which will take care of the rest in a single transaction.

## Deployments

| Contract     | Polygon                                                                                                                  | Mumbai                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| OffsetHelper | [0xFAFcCd01C395e4542BEed819De61f02f5562fAEa](https://polygonscan.com/address/0xFAFcCd01C395e4542BEed819De61f02f5562fAEa) | [0x30dC279166DCFB69F52C91d6A3380dCa75D0fCa7](https://mumbai.polygonscan.com/address/0x30dC279166DCFB69F52C91d6A3380dCa75D0fCa7) |

## OffsetHelper

The `OffsetHelper` contract implements helper functions that simplify the carbon offsetting (retirement) process.

See [./docs/OffsetHelper.md](./docs/OffsetHelper.md) for detailed documentation.

### Development

## Preqrequisites

1. Install the required packages:
   ```
   yarn
   ```
2. Copy `.env.example` to `.env` and modify values of the required environment variables:
   1. `POLYGON_URL`/`MUMBAI_URL` to specify custom RPC endpoints for Polygon Mainnet, respectively, the Mumbai Testnet.
   2. `PRIVATE_KEY` and `POLYGONSCAN_KEY` in order to deploy contract and publish source code on [polygonscan](https://polygonscan.com).

## Commands

Use the following commands to compile, test and deploy the contracts:

```
yarn compile
yarn test      # test using a polygon fork
yarn coverage  # test using a polygon fork with coverage report
yarn deploy
```

Documentation can be auto-generated from the contract's [natspec](https://docs.soliditylang.org/en/latest/natspec-format.html) in [./docs/](./docs/) using

```
yarn doc
```

Deploy the contract locally with:

```
yarn hardhat --network hardhat deployOffsetHelper --verify false
```
