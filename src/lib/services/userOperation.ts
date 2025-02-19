import { ethers } from 'ethers';
import { BUNDLER_URL } from '../config/index';
import type { UserOperation } from '../types/index';
import { getSmartAccount, getEntryPoint } from './contracts';

interface UserOperationParams {
    target?: string;
    value?: string;
    data?: string;
    targets?: string[];
    values?: string[];
    datas?: string[];
    isBatch?: boolean;
    usePaymaster?: boolean;
}

export const createUserOperation = async (
    signer: ethers.Signer,
    accountAddress: string,
    params: UserOperationParams,
    nonceOffset: number = 0
) => {
    const smartAccount = getSmartAccount(accountAddress, signer);
    const entryPoint = getEntryPoint(signer);

    try {
        // Create calldata for the execution
        const callData = params.isBatch && params.targets && params.values ? 
            smartAccount.interface.encodeFunctionData('executeBatch', [
                params.targets,
                params.values.map(value => ethers.utils.parseEther(value)),
                params.targets.map(() => params.datas?.[0] || '0x')
            ]) :
            smartAccount.interface.encodeFunctionData('execute', [
                params.target!,
                ethers.utils.parseEther(params.value!),
                params.data || '0x'
            ]);

        // Request UserOperation creation from bundler
        const response = await fetch(`${BUNDLER_URL}/createUserOperation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender: accountAddress,
                callData,
                usePaymaster: params.usePaymaster,
                nonceOffset
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to create UserOperation: ${errorData.error || response.statusText}`);
        }

        const { userOp } = await response.json();

        // Get the user operation hash
        const userOpHash = await entryPoint.getUserOpHash(userOp);

        // Sign the user operation
        const signature = await signer.signMessage(ethers.utils.arrayify(userOpHash));
        userOp.signature = signature;

        return userOp;
    } catch (error) {
        console.error('Error creating user operation:', error);
        throw error;
    }
};

export const submitUserOperation = async (userOp: UserOperation) => {
    try {
        // Check if bundler is running
        const isBundlerHealthy = await checkBundlerHealth();
        if (!isBundlerHealthy) {
            throw new Error('Bundler server is not running or not healthy. Please ensure the bundler is running.');
        }

        const response = await fetch(`${BUNDLER_URL}/userOperation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userOp),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Bundler error: ${errorData.error || response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting UserOperation:', error);
        throw error;
    }
};

export const submitUserOperationBatch = async (userOps: UserOperation[]) => {
    try {
        // Check if bundler is running
        const isBundlerHealthy = await checkBundlerHealth();
        if (!isBundlerHealthy) {
            throw new Error('Bundler server is not running or not healthy. Please ensure the bundler is running.');
        }

        // Generate a unique batch ID
        const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Submit each operation to the bundler with the same batchId
        for (const userOp of userOps) {
            const response = await fetch(`${BUNDLER_URL}/userOperation?batchId=${batchId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userOp),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Bundler error: ${errorData.error || response.statusText}`);
            }
        }

        // Submit the batch for processing
        const submitResponse = await fetch(`${BUNDLER_URL}/submitBatch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ batchId }),
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            throw new Error(`Failed to submit batch: ${errorData.error || submitResponse.statusText}`);
        }

        return await submitResponse.json();
    } catch (error) {
        console.error('Error submitting UserOperation batch:', error);
        throw error;
    }
};

export const checkBundlerHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${BUNDLER_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
}; 