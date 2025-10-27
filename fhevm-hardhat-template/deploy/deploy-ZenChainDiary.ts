import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedZenChainDiary = await deploy("ZenChainDiary", {
    from: deployer,
    log: true,
    args: [],
  });

  console.log(`ZenChainDiary contract deployed at: ${deployedZenChainDiary.address}`);
};

export default func;
func.id = "deploy_zenChainDiary";
func.tags = ["ZenChainDiary"];

