import { ACCOUNT_SALT } from './../config/index';
import { ethers } from 'ethers';
import { ENTRYPOINT_ADDRESS, ACCOUNT_FACTORY_ADDRESS } from '../config/index';
import { EntryPointABI, SmartAccountABI, AccountFactoryABI, SmartAccountRegistryABI } from '../abi';

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

export const getSmartAccountRegistry = async (signer: ethers.Signer) => {
    const factory = getAccountFactory(signer);
    const registryAddress = await factory.nameRegistry();
    return new ethers.Contract(
        registryAddress,
        SmartAccountRegistryABI,
        signer
    );
};

export const resolveAccountToUsername = async (signer: ethers.Signer, accountAddress: string) => {
    try {
        console.log('Getting smart account instance for:', accountAddress);
        const smartAccount = getSmartAccount(accountAddress, signer);
        
        console.log('Calling getName() on smart account...');
        const username = await smartAccount.getName();
        console.log('Raw username result:', username);

        if (!username || username === '') {
            console.log('No username found, returning address');
            return accountAddress;
        }

        console.log('Username found:', username);
        return username;
    } catch (error) {
        console.error('Error resolving username:', error);
        return accountAddress;
    }
};

export const isUsernameAvailable = async (signer: ethers.Signer, username: string) => {
    try {
        // Add .units suffix if not present
        if (!username.endsWith('.units')) {
            username = `${username}.units`;
        }

        const registry = await getSmartAccountRegistry(signer);
        const isAvailable = await registry.isNameAvailable(username);
        return isAvailable;
    } catch (error) {
        console.error('Error checking username availability:', error);
        throw error;
    }
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

export const createAccountWithName = async (signer: ethers.Signer, username: string) => {
    const factory = getAccountFactory(signer);
    const address = await signer.getAddress();
    
    try {
        // Add .units suffix if not present
        if (!username.endsWith('.units')) {
            username = `${username}.units`;
        }

        console.log('Creating account with username:', username);
        const tx = await factory.createAccountWithName(address, ACCOUNT_SALT, username);
        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);
        
        // Find both AccountCreated and NameRegistered events
        const accountEvent = receipt.events?.find((e: { event: string }) => e.event === 'AccountCreated');
        const nameEvent = receipt.events?.find((e: { event: string }) => e.event === 'NameRegistered');
        
        console.log('Account created event:', accountEvent);
        console.log('Name registered event:', nameEvent);

        if (!accountEvent) {
            throw new Error('AccountCreated event not found in transaction receipt');
        }

        // Verify name registration
        if (!nameEvent) {
            console.warn('NameRegistered event not found, verifying name registration...');
            const registry = await getSmartAccountRegistry(signer);
            const registeredName = await registry.resolveAddress(accountEvent.args?.account);
            console.log('Verified registered name:', registeredName);
            if (!registeredName) {
                console.error('Name registration failed');
            }
        }

        return accountEvent.args?.account;
    } catch (error) {
        console.error('Error creating account with name:', error);
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
        console.log('sendEthToAAWallet called with:', { aaWalletAddress, amount });
        
        if (!signer.provider) {
            throw new Error('Provider not available');
        }

        // Validate amount
        console.log('Parsing amount to wei:', amount);
        const amountInWei = ethers.utils.parseEther(amount);
        console.log('Amount in wei:', amountInWei.toString());
        
        if (amountInWei.lte(0)) {
            throw new Error('Amount must be greater than 0');
        }

        // Check EOA balance
        const eoaAddress = await signer.getAddress();
        console.log('EOA address:', eoaAddress);
        
        const balance = await signer.provider.getBalance(eoaAddress);
        console.log('EOA balance:', ethers.utils.formatEther(balance), 'ETH');
        
        if (balance.lt(amountInWei)) {
            throw new Error('Insufficient balance in EOA wallet');
        }

        // Send transaction
        console.log('Sending transaction...');
        const tx = await signer.sendTransaction({
            to: aaWalletAddress,
            value: amountInWei
        });
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);
        
        if (receipt.status === 0) {
            throw new Error('Transaction failed');
        }

        return tx;
    } catch (error) {
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            throw new Error(`ETH gönderme işlemi başarısız: ${error.message}`);
        } else {
            console.error('Unknown error type:', typeof error);
            throw new Error('ETH gönderme işlemi başarısız: Bilinmeyen hata');
        }
    }
}; 