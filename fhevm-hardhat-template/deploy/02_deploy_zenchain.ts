import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedZenChainDiary = await deploy("ZenChainDiary", {
    from: deployer,
    log: true,
  });

  console.log(`ZenChainDiary contract: `, deployedZenChainDiary.address);
};

export default func;
func.id = "deploy_zenchain_diary";
func.tags = ["ZenChainDiary"];





