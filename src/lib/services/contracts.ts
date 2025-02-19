import { ACCOUNT_SALT } from './../config/index';
import { ethers } from 'ethers';
import { ENTRYPOINT_ADDRESS, ACCOUNT_FACTORY_ADDRESS } from '../config/index';
import { EntryPointABI, SmartAccountABI, AccountFactoryABI } from '../abi';

export const getSmartAccount = (address: string, signer: ethers.Signer) => {
    return new ethers.Contract(
        address,
        SmartAccountABI,
        signer
    );
};

export const getEntryPoint = (signer: ethers.Signer) => {
    return new ethers.Contract(
        ENTRYPOINT_ADDRESS,
        EntryPointABI,
        signer
    );
};

export const getAccountFactory = (signer: ethers.Signer) => {
    return new ethers.Contract(
        ACCOUNT_FACTORY_ADDRESS,
        AccountFactoryABI,
        signer
    );
};

export const getExistingAccount = async (signer: ethers.Signer) => {
    const factory = getAccountFactory(signer);
    const address = await signer.getAddress();
    
    try {
        const accountAddress = await factory.getAddress(address, ACCOUNT_SALT);
        const code = await signer.provider?.getCode(accountAddress);
        
        if (code && code.length > 2) {
            return accountAddress;
        }
        return null;
    } catch (error) {
        console.error('Error checking existing account:', error);
        return null;
    }
};

export const createAccount = async (signer: ethers.Signer) => {
    const factory = getAccountFactory(signer);
    const address = await signer.getAddress();
    
    try {
        const tx = await factory.createAccount(address, ACCOUNT_SALT);
        const receipt = await tx.wait();
        
        const event = receipt.events?.find((e: { event: string }) => e.event === 'AccountCreated');
        return event?.args?.account;
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
};

export const getBalance = async (address: string, provider: ethers.providers.Provider) => {
    try {
        const balance = await provider.getBalance(address);
        return ethers.utils.formatEther(balance);
    } catch (error) {
        console.error('Error getting balance:', error);
        return '0';
    }
};

export const sendEthToAAWallet = async (
    signer: ethers.Signer,
    aaWalletAddress: string,
    amount: string
) => {
    try {
        if (!signer.provider) {
            throw new Error('Provider not available');
        }

        const tx = await signer.sendTransaction({
            to: aaWalletAddress,
            value: ethers.utils.parseEther(amount)
        });
        await tx.wait();
        return tx;
    } catch (error) {
        console.error('Error sending ETH to AA wallet:', error);
        throw error;
    }
}; 