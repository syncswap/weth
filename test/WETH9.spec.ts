import chai, { expect } from 'chai'
import { BigNumber, Contract } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { expandTo18Decimals, getPermitSignature, getSplittedPermitSignature, MAX_UINT256, ZERO } from './shared/utilities'
import { hexlify } from 'ethers/lib/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deployWETH9 } from './shared/fixtures'

chai.use(solidity)

const hre = require('hardhat');

const TOTAL_SUPPLY = expandTo18Decimals(10000)
const TEST_AMOUNT = expandTo18Decimals(10)
const TEST_AMOUNT2 = expandTo18Decimals(1)
//const CHAIN_ID = 280

describe('WETH9.1', () => {
    let wallet: SignerWithAddress
    let other: SignerWithAddress
    before(async () => {
        const accounts = await hre.ethers.getSigners();
        wallet = accounts[0];
        other = accounts[1];
    })

    let token: Contract
    beforeEach(async () => {
        token = await deployWETH9()
    })

    it('name, symbol, decimals', async () => {
        expect(await token.name()).to.eq('Wrapped Ether')
        expect(await token.symbol()).to.eq('WETH')
        expect(await token.decimals()).to.eq(18)
    });

    it('deposit', async () => {
        expect(await token.totalSupply()).to.eq(ZERO);
        expect(await token.balanceOf(wallet.address)).to.eq(ZERO);

        // zero
        await expect(token.deposit({ value: 0 }))
            .to.emit(token, 'Deposit')
            .withArgs(wallet.address, 0);

        expect(await token.totalSupply()).to.eq(ZERO);
        expect(await token.balanceOf(wallet.address)).to.eq(ZERO);

        // TEST_AMOUNT
        await expect(token.deposit({ value: TEST_AMOUNT }))
            .to.emit(token, 'Deposit')
            .withArgs(wallet.address, TEST_AMOUNT);

        expect(await token.totalSupply()).to.eq(TEST_AMOUNT);
        expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT);

        // TEST_AMOUNT2
        await expect(token.deposit({ value: TEST_AMOUNT2 }))
            .to.emit(token, 'Deposit')
            .withArgs(wallet.address, TEST_AMOUNT2);

        expect(await token.totalSupply()).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2));
        expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2));

        // via fallback
        const transaction = {
            to: token.address,
            value: TEST_AMOUNT,
        };
        await expect(wallet.sendTransaction(transaction))
            .to.emit(token, 'Deposit')
            .withArgs(wallet.address, TEST_AMOUNT);
        
        expect(await token.totalSupply()).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2).add(TEST_AMOUNT));
        expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2).add(TEST_AMOUNT));
    });

    it('deposit:gas', async () => {
        const transaction = await token.deposit({ value: TEST_AMOUNT });
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(44866);
    });

    it('deposit:fallback:gas', async () => {
        const transaction = await wallet.sendTransaction({
            to: token.address,
            value: TEST_AMOUNT,
        });
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(44702);
    });

    it('withdraw', async () => {
        await token.deposit({ value: TEST_AMOUNT });

        await expect(token.withdraw(TEST_AMOUNT2))
            .to.emit(token, 'Withdrawal')
            .withArgs(wallet.address, TEST_AMOUNT2);

        expect(await token.totalSupply()).to.eq(TEST_AMOUNT.sub(TEST_AMOUNT2));
        expect(await token.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.sub(TEST_AMOUNT2));
    });

    it('withdraw:gas', async () => {
        await token.deposit({ value: TEST_AMOUNT });

        const transaction = await token.withdraw(TEST_AMOUNT2);
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(35128);
    });

    it('withdraw:all:gas', async () => {
        await token.deposit({ value: TEST_AMOUNT });

        const transaction = await token.withdraw(TEST_AMOUNT);
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(30328);
    });
})
