import { BigNumber, Contract } from 'ethers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';

const ethers: HardhatEthersHelpers = require("hardhat").ethers;

export async function deployWETH(): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory('WETH');
  const contract = await contractFactory.deploy();
  await contract.deployed();
  return contract;
}

export async function deployERC1271Mock(): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory('ERC1271Mock');
  const contract = await contractFactory.deploy();
  await contract.deployed();
  return contract;
}