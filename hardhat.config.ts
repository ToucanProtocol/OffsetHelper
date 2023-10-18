import * as dotenv from "dotenv";

import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import { relative } from "path";
import "solidity-coverage";
import "solidity-docgen";
import "./tasks/verifyOffsetHelper";

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // by default take the first account as deployer
    },
  },
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
    },
    celo: {
      url: process.env.RPC_ENDPOINT || "https://rpc.ankr.com/celo",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
    },
    polygon: {
      url: process.env.RPC_ENDPOINT || "https://rpc.ankr.com/polygon",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: "https://rpc.ankr.com/polygon_mumbai",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
    hardhat: {
      forking: {
        url:
          process.env.RPC_ENDPOINT ||
          "https://polygon-mainnet.g.alchemy.com/v2/4rzRS2MH5LIunV6cejmLhQelv_Vd82rq",
      },
    },
  },
  mocha: {
    timeout: 150000,
  },
  etherscan: {
    apiKey: {
      polygon: process.env.BLOCK_EXPLORER_API_KEY || "",
      polygonMumbai: process.env.BLOCK_EXPLORER_API_KEY || "",
      celo: process.env.BLOCK_EXPLORER_API_KEY || "",
      alfajores: process.env.BLOCK_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ],
  },
  docgen: {
    pages: (item: any, file: any) =>
      file.absolutePath.startsWith("contracts/OffsetHelper")
        ? relative("contracts", file.absolutePath).replace(".sol", ".md")
        : undefined,
  },
};

export default config;
