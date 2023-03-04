# Wrapped ETH 9.1

The "Wrapped Ether" WETH-9 with additional features through relatively minor changes.

## Deployments
zkSync Era Testnet `0x20b28B1e4665FFf290650586ad76E977EAb90c5D`

[zkSync Era Mainnet](https://explorer.zksync.io/address/0x8Ebe4A94740515945ad826238Fc4D56c6B8b0e60#contract) `0x8Ebe4A94740515945ad826238Fc4D56c6B8b0e60`

## Features
- Supports [ERC-165](https://eips.ethereum.org/EIPS/eip-165) interface detection.
- Supports [ERC-2612](https://eips.ethereum.org/EIPS/eip-2612) signed approvals.
- Supports [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) contract signature verification.
- Prevents from burning or sending WETH tokens to the contract.

## Build
```
yarn
yarn test
yarn build
```
This repo is designed for zkSync 2.0 (testnet). To build artifacts for zkSync, run `yarn build-zk`. To deploy on zkSync, run `yarn deploy`.

## Changelog
- Upgraded Solidity to `0.8`.
- Added `supportsInterface`.
- Added `DOMAIN_SEPARATOR`.
- Added `permit` function.
- Added `permit2` function.
- Added check for `dst` on `transferFrom`.

## Resources
- [WETH9](https://github.com/gnosis/canonical-weth/blob/master/contracts/WETH9.sol)
- [zkSync 2.0 Documentation](https://v2-docs.zksync.io/dev/)
- [zkSync 2.0 Explorer](https://explorer.zksync.io/)
- [zkEVM Compiler Binary](https://github.com/matter-labs/zksolc-bin/)