import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const useWallet = () => {
    const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
    const [address, setAddress] = useState<string>('');

    const connectWallet = async () => {
        try {
            if (typeof window.ethereum !== 'undefined') {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const newSigner = provider.getSigner();
                setSigner(newSigner);
                const newAddress = await newSigner.getAddress();
                setAddress(newAddress);
            } else {
                throw new Error('MetaMask is not installed');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            setSigner(undefined);
            setAddress('');
        }
    };

    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                try {
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        const newSigner = provider.getSigner();
                        setSigner(newSigner);
                        const newAddress = await newSigner.getAddress();
                        setAddress(newAddress);
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                    setSigner(undefined);
                    setAddress('');
                }
            }
        };

        checkConnection();

        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', () => {
                checkConnection();
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (typeof window.ethereum !== 'undefined') {
                window.ethereum.removeListener('accountsChanged', checkConnection);
            }
        };
    }, []);

    return { signer, connectWallet, address };
}; 