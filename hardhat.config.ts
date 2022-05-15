import * as dotenv from "dotenv";

import { HardhatUserConfig, subtask, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { tokens } from "./utils/tokens";
import addresses, { mumbaiAddresses } from "./utils/addresses";
import { network } from "hardhat";

dotenv.config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deployOffsetHelper", "Deploys and verifies OffsetHelper").setAction(
  async (taskArgs, hre) => {
    const OffsetHelper = await hre.ethers.getContractFactory("OffsetHelper");

    const addressesToUse =
      hre.network.name == "mumbai" ? mumbaiAddresses : addresses;

    const oh = await OffsetHelper.deploy(tokens, [
      addressesToUse.bct,
      addressesToUse.nct,
      addressesToUse.usdc,
      addressesToUse.weth,
      addressesToUse.wmatic,
    ]);
    await oh.deployed();
    await oh.deployTransaction.wait(5);
    console.log(`OffsetHelper deployed on ${hre.network.name} to:`, oh.address);

    await hre.run("verify:verify", {
      address: oh.address,
      constructorArguments: [
        tokens,
        [
          addressesToUse.bct,
          addressesToUse.nct,
          addressesToUse.usdc,
          addressesToUse.weth,
          addressesToUse.wmatic,
        ],
      ],
    });
    console.log(`OffsetHelper verified on ${hre.network.name} to:`, oh.address);
  }
);

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
        blockNumber: 28171596,
      },
    },
  },
  mocha: {
    timeout: 150000,
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY || "",
  },
};

export default config;
