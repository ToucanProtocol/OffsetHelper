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
    polygon: {
      url:
        process.env.POLYGON_URL || "https://matic-mainnet.chainstacklabs.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.MUMBAI_URL || "https://matic-mumbai.chainstacklabs.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      forking: {
        url:
          process.env.POLYGON_URL ||
          "https://polygon-mainnet.g.alchemy.com/v2/4rzRS2MH5LIunV6cejmLhQelv_Vd82rq",
      },
    },
  },
  mocha: {
    timeout: 150000,
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  docgen: {
    pages: (item: any, file: any) =>
      file.absolutePath.startsWith("contracts/OffsetHelper")
        ? relative("contracts", file.absolutePath).replace(".sol", ".md")
        : undefined,
  },
};

export default config;
