import { ethers } from 'ethers';
import { PAYMASTER_ADDRESS, ENTRYPOINT_ADDRESS } from '../config/index';
import { MinimalPaymasterABI, EntryPointABI } from '../abi';
import { UserOperation } from '../types/index';

export const getPaymaster = (signer: ethers.Signer) => {
    return new ethers.Contract(
        PAYMASTER_ADDRESS,
        MinimalPaymasterABI,
        signer
    );
};

export const createPaymasterData = async (
    verificationGasLimit: number = 1e6,
    postOpGasLimit: number = 1e6
): Promise<string> => {
    try {
        return ethers.utils.hexConcat([
            PAYMASTER_ADDRESS,
            ethers.utils.hexZeroPad(ethers.utils.hexlify(verificationGasLimit), 16),
            ethers.utils.hexZeroPad(ethers.utils.hexlify(postOpGasLimit), 16),
            ethers.constants.HashZero
        ]);
    } catch (error) {
        console.error('Error creating paymaster data:', error);
        throw error;
    }
};

export const validatePaymasterBalance = async (
    signer: ethers.Signer,
    userOp: UserOperation
): Promise<boolean> => {
    try {
        const entryPoint = new ethers.Contract(
            ENTRYPOINT_ADDRESS,
            EntryPointABI,
            signer
        );

        // Parse all gas components from UserOperation
        const accountGasLimits = ethers.utils.arrayify(userOp.accountGasLimits);
        const verificationGasLimit = ethers.BigNumber.from(accountGasLimits.slice(0, 16));
        const callGasLimit = ethers.BigNumber.from(accountGasLimits.slice(16, 32));
        
        const paymasterData = userOp.paymasterAndData !== '0x' 
            ? ethers.utils.arrayify(userOp.paymasterAndData)
            : new Uint8Array();

        const paymasterVerificationGasLimit = paymasterData.length >= 36
            ? ethers.BigNumber.from(paymasterData.slice(20, 36)) 
            : ethers.BigNumber.from(0);

        const paymasterPostOpGasLimit = paymasterData.length >= 52
            ? ethers.BigNumber.from(paymasterData.slice(36, 52))
            : ethers.BigNumber.from(0);

        const gasFees = ethers.utils.arrayify(userOp.gasFees);
        const maxFeePerGas = ethers.BigNumber.from(gasFees.slice(0, 16));
        
        const preVerificationGas = ethers.BigNumber.from(userOp.preVerificationGas);

        // Calculate total gas with 25% buffer (matches test patterns)
        const totalGas = preVerificationGas
            .add(verificationGasLimit)
            .add(callGasLimit)
            .add(paymasterVerificationGasLimit)
            .add(paymasterPostOpGasLimit)
            .mul(125)
            .div(100);

        const maxCost = totalGas.mul(maxFeePerGas);
        const balance = await entryPoint.balanceOf(PAYMASTER_ADDRESS);
        
        return balance.gte(maxCost);
    } catch (error) {
        console.error('Paymaster balance validation failed:', error);
        return false;
    }
}; 