import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import addresses, { mumbaiAddresses } from "../utils/addresses";

task("verify:offsetHelper", "Verifies the OffsetHelper")
  .addParam("address", "The OffsetHelper address")
  .setAction(
    async (taskArgs: { address: any }, hre: HardhatRuntimeEnvironment) => {
      const { address } = taskArgs;

      const addressesToUse =
        hre.network.name == "mumbai" ? mumbaiAddresses : addresses;

      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [
          Object.keys(addressesToUse),
          Object.values(addressesToUse),
        ],
      });
      console.log(`OffsetHelper verified on ${hre.network.name} to:`, address);
    }
  );

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
};
