import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import paths from "../utils/paths";
import { poolAddresses } from "../utils/addresses";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const pathsToUse =
    paths[hre.network.name === "hardhat" ? "alfajores" : hre.network.name];
  const poolAddressesToUse =
    poolAddresses[
      hre.network.name === "hardhat" ? "alfajores" : hre.network.name
    ];

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (!deployer) {
    throw new Error("Missing deployer address");
  }

  await deploy("OffsetHelper", {
    from: deployer,
    args: [
      Object.values(poolAddressesToUse),
      Object.keys(pathsToUse),
      Object.values(pathsToUse),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  // await deploy("Swapper", {
  //   from: deployer,
  //   args: [
  //     Object.values(pathsToUse),
  //     "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
  //   ],
  //   log: true,
  //   autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  // });
};
export default func;
