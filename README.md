# Wrapped ETH 9.1

The "Wrapped Ether" WETH-9 with additional features through relatively minor changes.

## Features
- Supports [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) signed approvals.
- Supports [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)  contract signature verification.

## Build
```
yarn
yarn test
yarn build
```
This repo is designed for zkSync 2.0 (testnet). To build artifacts for zkSync, run `yarn build-zk`. To deploy on zkSync, run `yarn deploy`.

## Changelog
- Added `DOMAIN_SEPARATOR.`
- Added `permit` function.
- Added `permit2` function.

## Resources
- [WETH9](https://github.com/gnosis/canonical-weth/blob/master/contracts/WETH9.sol)
- [zkSync 2.0 Documentation](https://v2-docs.zksync.io/dev/)
- [zkSync 2.0 Explorer](https://explorer.zksync.io/)
- [zkEVM Compiler Binary](https://github.com/matter-labs/zksolc-bin/)