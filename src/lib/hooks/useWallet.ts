import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [address, setAddress] = useState<string>('');
    const [error, setError] = useState<string>('');

    const connectWallet = useCallback(async () => {
        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask');
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            setProvider(provider);
            setSigner(signer);
            setAddress(address);
            setError('');

            return { provider, signer, address };
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
            return null;
        }
    }, []);

    const disconnectWallet = useCallback(() => {
        setSigner(null);
        setProvider(null);
        setAddress('');
        setError('');
    }, []);

    return {
        signer,
        provider,
        address,
        error,
        connectWallet,
        disconnectWallet
    };
}; 