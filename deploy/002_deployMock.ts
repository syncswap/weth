import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployContract, initializeWalletAndDeployer } from "../utils/deploy/helper";

export default async function (hre: HardhatRuntimeEnvironment) {
    console.log(`Running deploy script for the WETH9 mock contract`);

    initializeWalletAndDeployer(hre);

    await deployContract('weth9Mock', 'WETH9Mock', []);
}