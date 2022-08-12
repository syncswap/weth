import { BigNumber, Contract } from 'ethers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types';

const ethers: HardhatEthersHelpers = require("hardhat").ethers;

export async function deployWETH9(): Promise<Contract> {
  const contractFactory = await ethers.getContractFactory('WETH9');
  const contract = await contractFactory.deploy();
  await contract.deployed();
  return contract;
}