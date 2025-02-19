import { ethers } from 'ethers';
import { createAccount, getExistingAccount, getBalance } from './contracts';
import { createUserOperation, submitUserOperation } from './userOperation';
import { usePaymasterStore } from '../store';

export interface WalletBalances {
    eoaBalance: string;
    aaBalance: string;
}

export const updateBalances = async (
    signer: ethers.Signer,
    accountAddress?: string
): Promise<WalletBalances> => {
    if (!signer.provider) {
        throw new Error('Provider not available');
    }
    
    const eoaAddress = await signer.getAddress();
    const eoaBalance = await getBalance(eoaAddress, signer.provider);
    let aaBalance = '0';

    if (accountAddress) {
        aaBalance = await getBalance(accountAddress, signer.provider);
    }

    return { eoaBalance, aaBalance };
};

export const checkAndCreateAccount = async (signer: ethers.Signer) => {
    try {
        // First check if account exists
        const existingAccount = await getExistingAccount(signer);
        if (existingAccount) {
            return { accountAddress: existingAccount, isExisting: true };
        }

        // If not, create new account
        const accountAddress = await createAccount(signer);
        return { accountAddress, isExisting: false };
    } catch (error) {
        console.error('Error in checkAndCreateAccount:', error);
        throw error;
    }
};

export const sendSingleTransaction = async (
    signer: ethers.Signer,
    accountAddress: string,
    recipient: string,
    amount: string
) => {
    if (!signer) throw new Error('Please connect your wallet first');

    const { usePaymaster } = usePaymasterStore.getState();

    const userOp = await createUserOperation(signer, accountAddress, {
        target: recipient,
        value: amount,
        data: '0x',
        usePaymaster
    });

    return await submitUserOperation(userOp);
};

export const sendBatchTransactions = async (
    signer: ethers.Signer,
    accountAddress: string,
    recipients: string[],
    amounts: string[]
) => {
    if (!signer) throw new Error('Please connect your wallet first');

    const { usePaymaster } = usePaymasterStore.getState();

    const userOp = await createUserOperation(signer, accountAddress, {
        isBatch: true,
        targets: recipients,
        values: amounts,
        datas: ['0x'],
        usePaymaster
    });

    return await submitUserOperation(userOp);
}; 