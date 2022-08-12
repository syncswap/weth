import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Contract, ethers, Signature } from 'ethers';
import {
  getAddress,
  keccak256,
  solidityPack,
  splitSignature
} from 'ethers/lib/utils';

const hre = require("hardhat");

const DECIMALS_BASE_18 = BigNumber.from(10).pow(18);

export const MINIMUM_LIQUIDITY = BigNumber.from(1000)
export const MAX_UINT256 = BigNumber.from(2).pow(256).sub(1)
export const ZERO = BigNumber.from(0)
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function expandTo18Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(DECIMALS_BASE_18)
}

export function getCreate2Address(
  factoryAddress: string,
  [tokenA, tokenB]: [string, string],
  bytecode: string
): string {
  const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
  const create2Inputs = [
    '0xff',
    factoryAddress,
    keccak256(solidityPack(['address', 'address'], [token0, token1])),
    keccak256(bytecode)
  ]
  const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`)
}

export async function getPermitSignature(
  wallet: SignerWithAddress,
  token: Contract,
  approve: {
    owner: string
    spender: string
    value: BigNumber
  },
  nonce: BigNumber,
  deadline: BigNumber
): Promise<string> {
  const domain = {
    name: 'Wrapped Ether',
    version: '1',
    chainId: 280,
    verifyingContract: token.address
  };
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  };
  const values = {
    owner: approve.owner,
    spender: approve.spender,
    value: approve.value,
    nonce: nonce,
    deadline: deadline
  };
  return await wallet._signTypedData(domain, types, values);
}

export async function getSplittedPermitSignature(
  wallet: SignerWithAddress,
  token: Contract,
  approve: {
    owner: string
    spender: string
    value: BigNumber
  },
  nonce: BigNumber,
  deadline: BigNumber
): Promise<Signature> {
  return splitSignature(await getPermitSignature(wallet, token, approve, nonce, deadline));
}

export async function mineBlock(timestamp: number): Promise<void> {
  await hre.network.provider.request({
    method: "evm_mine",
    params: [timestamp],
  });
}

export async function getWallet(): Promise<SignerWithAddress> {
  const accounts = await hre.ethers.getSigners()
  return accounts[0];
}

export async function getOther(): Promise<SignerWithAddress> {
  const accounts = await hre.ethers.getSigners()
  return accounts[1];
}