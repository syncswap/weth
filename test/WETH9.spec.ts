import chai, { expect } from 'chai'
import { Contract, providers } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { expandTo18Decimals, getPermitSignature, getSplittedPermitSignature, MAX_UINT256, ZERO } from './shared/utilities'
import { defaultAbiCoder, keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deployERC1271Mock, deployWETH } from './shared/fixtures'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'

chai.use(solidity);

const hre: HardhatRuntimeEnvironment & {
    ethers: HardhatEthersHelpers
} = require('hardhat');

const TEST_AMOUNT = expandTo18Decimals(10);
const TEST_AMOUNT2 = expandTo18Decimals(1);
//const CHAIN_ID = 280

describe('WETH9.1', () => {
    let wallet: SignerWithAddress;
    let other: SignerWithAddress;
    let provider: providers.JsonRpcProvider;

    before(async () => {
        const accounts = await hre.ethers.getSigners();
        wallet = accounts[0];
        other = accounts[1];
        provider = hre.ethers.provider;
    })

    let weth: Contract;

    beforeEach(async () => {
        weth = await deployWETH();
    })

    it('name, symbol, decimals', async () => {
        expect(await weth.name()).to.eq('Wrapped Ether');
        expect(await weth.symbol()).to.eq('WETH');
        expect(await weth.decimals()).to.eq(18);
    });

    it('DOMAIN_SEPARATOR', async () => {
        const domainSeparator: string = await weth.DOMAIN_SEPARATOR();
        const chainId: number = provider.network.chainId;
        const expected = keccak256(
            defaultAbiCoder.encode(
                ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
                [
                    keccak256(
                        toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                    ),
                    keccak256(toUtf8Bytes('Wrapped Ether')),
                    keccak256(toUtf8Bytes('1')),
                    chainId,
                    weth.address
                ]
            )
        );
        expect(domainSeparator).to.eq(expected);
    });

    it('deposit', async () => {
        expect(await weth.totalSupply()).to.eq(ZERO);
        expect(await weth.balanceOf(wallet.address)).to.eq(ZERO);

        const balanceBefore = await provider.getBalance(wallet.address);

        // zero
        await expect(weth.deposit({ value: 0 }))
            .to.emit(weth, 'Deposit')
            .withArgs(wallet.address, 0);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore);
        expect(await weth.totalSupply()).to.eq(ZERO);
        expect(await weth.balanceOf(wallet.address)).to.eq(ZERO);

        // TEST_AMOUNT
        await expect(weth.deposit({ value: TEST_AMOUNT }))
            .to.emit(weth, 'Deposit')
            .withArgs(wallet.address, TEST_AMOUNT);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore.sub(TEST_AMOUNT));
        expect(await weth.totalSupply()).to.eq(TEST_AMOUNT);
        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT);

        // TEST_AMOUNT2
        await expect(weth.deposit({ value: TEST_AMOUNT2 }))
            .to.emit(weth, 'Deposit')
            .withArgs(wallet.address, TEST_AMOUNT2);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore.sub(TEST_AMOUNT).sub(TEST_AMOUNT2));
        expect(await weth.totalSupply()).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2));
        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2));

        // via fallback
        const transaction = {
            to: weth.address,
            value: TEST_AMOUNT,
        };
        await expect(wallet.sendTransaction(transaction))
            .to.emit(weth, 'Deposit')
            .withArgs(wallet.address, TEST_AMOUNT);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore.sub(TEST_AMOUNT).sub(TEST_AMOUNT2).sub(TEST_AMOUNT));
        expect(await weth.totalSupply()).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2).add(TEST_AMOUNT));
        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2).add(TEST_AMOUNT));
    });

    /*
    it('depositTo', async () => {
        expect(await weth.totalSupply()).to.eq(ZERO);
        expect(await weth.balanceOf(wallet.address)).to.eq(ZERO);

        const balanceBefore = await provider.getBalance(wallet.address);

        // zero
        await expect(weth.depositTo(other.address, { value: 0 }))
            .to.emit(weth, 'Deposit')
            .withArgs(other.address, 0);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore);
        expect(await weth.totalSupply()).to.eq(ZERO);
        expect(await weth.balanceOf(other.address)).to.eq(ZERO);

        // TEST_AMOUNT
        await expect(weth.depositTo(other.address, { value: TEST_AMOUNT }))
            .to.emit(weth, 'Deposit')
            .withArgs(other.address, TEST_AMOUNT);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore.sub(TEST_AMOUNT));
        expect(await weth.totalSupply()).to.eq(TEST_AMOUNT);
        expect(await weth.balanceOf(other.address)).to.eq(TEST_AMOUNT);

        // TEST_AMOUNT2
        await expect(weth.depositTo(other.address, { value: TEST_AMOUNT2 }))
            .to.emit(weth, 'Deposit')
            .withArgs(other.address, TEST_AMOUNT2);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore.sub(TEST_AMOUNT).sub(TEST_AMOUNT2));
        expect(await weth.totalSupply()).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2));
        expect(await weth.balanceOf(other.address)).to.eq(TEST_AMOUNT.add(TEST_AMOUNT2));
    });
    */

    it('deposit:gas', async () => {
        const transaction = await weth.deposit({ value: TEST_AMOUNT });
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(44929);
    });

    it('deposit:fallback:gas', async () => {
        const transaction = await wallet.sendTransaction({
            to: weth.address,
            value: TEST_AMOUNT,
        });
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(44780);
    });

    it('withdraw', async () => {
        await weth.deposit({ value: TEST_AMOUNT });

        const balanceBefore = await provider.getBalance(wallet.address);

        await expect(weth.withdraw(TEST_AMOUNT.add(1))).to.be.reverted;
        await expect(weth.withdraw(TEST_AMOUNT2))
            .to.emit(weth, 'Withdrawal')
            .withArgs(wallet.address, TEST_AMOUNT2);

        expect(await provider.getBalance(wallet.address)).to.eq(balanceBefore.add(TEST_AMOUNT2));
        expect(await weth.totalSupply()).to.eq(TEST_AMOUNT.sub(TEST_AMOUNT2));
        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.sub(TEST_AMOUNT2));
    });

    it('withdraw:gas', async () => {
        await weth.deposit({ value: TEST_AMOUNT });

        const transaction = await weth.withdraw(TEST_AMOUNT2);
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(35071);
    });

    it('withdraw:all:gas', async () => {
        await weth.deposit({ value: TEST_AMOUNT });

        const transaction = await weth.withdraw(TEST_AMOUNT);
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(30271);
    });

    it('transfer', async () => {
        await weth.deposit({ value: TEST_AMOUNT });

        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT);
        expect(await weth.balanceOf(other.address)).to.eq(0);

        await expect(weth.transfer(other.address, TEST_AMOUNT.add(1))).to.be.reverted;
        await expect(weth.transfer(other.address, TEST_AMOUNT2))
            .to.emit(weth, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT2);

        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.sub(TEST_AMOUNT2));
        expect(await weth.balanceOf(other.address)).to.eq(TEST_AMOUNT2);
    });

    it('transfer:gas', async () => {
        await weth.deposit({ value: TEST_AMOUNT });

        const transaction = await weth.transfer(other.address, TEST_AMOUNT2);
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(51345);
    });

    it('transferFrom', async () => {
        await weth.deposit({ value: TEST_AMOUNT });

        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT);
        expect(await weth.balanceOf(other.address)).to.eq(0);

        await expect(weth.transferFrom(wallet.address, other.address, TEST_AMOUNT2)).to.be.not.reverted;
        await expect(weth.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT2)).to.be.reverted;
        await weth.approve(other.address, TEST_AMOUNT2);

        await expect(weth.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT2.add(1))).to.be.reverted;
        await expect(weth.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT2))
            .to.emit(weth, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT2);

        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.sub(TEST_AMOUNT2).sub(TEST_AMOUNT2));
        expect(await weth.balanceOf(other.address)).to.eq(TEST_AMOUNT2.add(TEST_AMOUNT2));
    });

    it('transferFrom:gas', async () => {
        await weth.deposit({ value: TEST_AMOUNT });
        await weth.approve(other.address, TEST_AMOUNT2);

        let transaction = await weth.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT2);
        let receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(52576);

        // approve max
        await weth.approve(other.address, MAX_UINT256);
        transaction = await weth.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT2);
        receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(37035);
    });

    it('approve', async () => {
        await weth.deposit({ value: TEST_AMOUNT });

        expect(await weth.allowance(wallet.address, other.address)).to.eq(0);
        await expect(
            weth.connect(other).transferFrom(wallet.address, other.address, 10000)
        ).to.be.reverted;

        // approve
        await expect(weth.approve(other.address, 10000))
            .to.emit(weth, 'Approval')
            .withArgs(wallet.address, other.address, 10000);
        expect(await weth.allowance(wallet.address, other.address)).to.eq(10000);

        await expect(
            weth.connect(other).transferFrom(wallet.address, other.address, 10001)
        ).to.be.reverted;

        // spend some
        await weth.connect(other).transferFrom(wallet.address, other.address, 1000);
        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.sub(1000));
        expect(await weth.balanceOf(other.address)).to.eq(1000);

        // spend all
        expect(await weth.allowance(wallet.address, other.address)).to.eq(9000);
        await weth.connect(other).transferFrom(wallet.address, other.address, 9000);
        expect(await weth.balanceOf(wallet.address)).to.eq(TEST_AMOUNT.sub(10000));
        expect(await weth.balanceOf(other.address)).to.eq(10000);

        // approve max
        await expect(weth.approve(other.address, MAX_UINT256))
            .to.emit(weth, 'Approval')
            .withArgs(wallet.address, other.address, MAX_UINT256);
        expect(await weth.allowance(wallet.address, other.address)).to.eq(MAX_UINT256);

        await expect(
            weth.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT2)
        ).to.be.not.reverted;
        expect(await weth.allowance(wallet.address, other.address)).to.eq(MAX_UINT256);
    });

    it('approve:gas', async () => {
        const transaction = await weth.approve(other.address, 10000);
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(46116);
    });

    it('permit', async () => {
        expect(await weth.allowance(wallet.address, other.address)).to.eq(0);

        const nonce = await weth.nonces(wallet.address);
        const deadline = MAX_UINT256;
        const digest = await getSplittedPermitSignature(
            wallet,
            weth,
            { owner: wallet.address, spender: other.address, value: TEST_AMOUNT2 },
            nonce,
            deadline
        );
        const digestInvalid = await getSplittedPermitSignature(
            other,
            weth,
            { owner: other.address, spender: wallet.address, value: TEST_AMOUNT2 },
            nonce,
            deadline
        );

        await expect(weth.permit(
            wallet.address, other.address, TEST_AMOUNT2, deadline, digestInvalid.v, digestInvalid.r, digestInvalid.s
        )).to.be.reverted;

        await expect(weth.permit(
            wallet.address, other.address, TEST_AMOUNT2, deadline, digest.v, digest.r, digest.s
        ))
            .to.emit(weth, 'Approval')
            .withArgs(wallet.address, other.address, TEST_AMOUNT2);

        expect(await weth.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT2);
    });

    it('permit:gas', async () => {
        const nonce = await weth.nonces(wallet.address);
        const deadline = MAX_UINT256;
        const digest = await getSplittedPermitSignature(
            wallet,
            weth,
            { owner: wallet.address, spender: other.address, value: TEST_AMOUNT2 },
            nonce,
            deadline
        );

        const transaction = await weth.permit(
            wallet.address, other.address, TEST_AMOUNT2, deadline, digest.v, digest.r, digest.s
        );
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(74575);
    });

    it('permit2', async () => {
        expect(await weth.allowance(wallet.address, other.address)).to.eq(0);

        const nonce = await weth.nonces(wallet.address);
        const deadline = MAX_UINT256;
        const digest = await getPermitSignature(
            wallet,
            weth,
            { owner: wallet.address, spender: other.address, value: TEST_AMOUNT2 },
            nonce,
            deadline
        );
        const digestInvalid = await getPermitSignature(
            other,
            weth,
            { owner: wallet.address, spender: other.address, value: TEST_AMOUNT2 },
            nonce,
            deadline
        );

        await expect(weth.permit2(
            wallet.address, other.address, TEST_AMOUNT2, deadline, digestInvalid
        )).to.be.reverted;

        await expect(weth.permit2(
            wallet.address, other.address, TEST_AMOUNT2, deadline, digest
        ))
            .to.emit(weth, 'Approval')
            .withArgs(wallet.address, other.address, TEST_AMOUNT2);

        expect(await weth.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT2);
    });

    it('permit2:eip1271', async () => {
        const erc1271Mock = await deployERC1271Mock();
        expect(await weth.allowance(erc1271Mock.address, other.address)).to.eq(0);

        const deadline = MAX_UINT256;
        const digest = defaultAbiCoder.encode(['uint256'], ['1271']);
        const digestInvalid = defaultAbiCoder.encode(['uint256'], ['1721']);

        await expect(weth.permit2(
            erc1271Mock.address, other.address, TEST_AMOUNT2, deadline, digestInvalid
        )).to.be.reverted;

        await expect(weth.permit2(
            erc1271Mock.address, other.address, TEST_AMOUNT2, deadline, digest
        ))
            .to.emit(weth, 'Approval')
            .withArgs(erc1271Mock.address, other.address, TEST_AMOUNT2);

        expect(await weth.allowance(erc1271Mock.address, other.address)).to.eq(TEST_AMOUNT2);
    });

    it('permit2:gas', async () => {
        const nonce = await weth.nonces(wallet.address);
        const deadline = MAX_UINT256;
        const digest = await getPermitSignature(
            wallet,
            weth,
            { owner: wallet.address, spender: other.address, value: TEST_AMOUNT2 },
            nonce,
            deadline
        );

        const transaction = await weth.permit2(
            wallet.address, other.address, TEST_AMOUNT2, deadline, digest
        );
        const receipt = await transaction.wait();
        expect(receipt.gasUsed).to.eq(75391);
    });
})