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
| OffsetHelper | [0x9e0ACA6ABd7498d6EFcDcb5E3e736DbB6487458c](https://polygonscan.com/address/0x9e0ACA6ABd7498d6EFcDcb5E3e736DbB6487458c) | [0xDC54484c13d9956199cc14A49d07D58be4794D2A](https://mumbai.polygonscan.com/address/0xDC54484c13d9956199cc14A49d07D58be4794D2A) |

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

Use the following commands to compile and test the Offset Helper:

```
yarn compile
yarn test      # test using a polygon fork
```

Deploy the contract locally with:

```
yarn hardhat --network hardhat deployOffsetHelper --verify false
```

## Deployment

To deploy the Offset Helper first use the command to auto-generate documentation from the contract's [natspec](https://docs.soliditylang.org/en/latest/natspec-format.html) in [./docs/](./docs/) using:

```
yarn doc
```

Then deploy the contract to Polygon Mainnet and Mumbai Testnet with:

```
yarn hardhat --network <network> deployOffsetHelper
```

Make sure to update this readme with the new contract addresses.
