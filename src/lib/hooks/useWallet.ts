import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LocalWallet } from '../services/localWallet';

interface WalletState {
  signer: ethers.Signer | undefined;
  address: string;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    signer: undefined,
    address: '',
    balance: '0',
    isLoading: false,
    error: null
  });

  const updateBalance = async () => {
    if (!state.address || !state.signer?.provider) return;

    try {
      const balance = await state.signer.provider.getBalance(state.address);
      setState(prev => ({
        ...prev,
        balance: ethers.utils.formatEther(balance)
      }));
    } catch (error) {
      console.error('Balance update error:', error);
    }
  };

  const connectWallet = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const localWallet = LocalWallet.getInstance();
      const newSigner = await localWallet.getSigner();
      const newAddress = await localWallet.getAddress();

      // Get initial balance
      const provider = await localWallet.getProvider();
      const balance = await provider.getBalance(newAddress);

      setState({
        signer: newSigner,
        address: newAddress,
        balance: ethers.utils.formatEther(balance),
        isLoading: false,
        error: null
      });

      return { signer: newSigner, address: newAddress };
    } catch (error) {
      console.error('Error connecting local wallet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Wallet bağlantısı başarısız';
      
      setState({
        signer: undefined,
        address: '',
        balance: '0',
        isLoading: false,
        error: errorMessage
      });

      return null;
    }
  };

  const resetWallet = () => {
    const localWallet = LocalWallet.getInstance();
    localWallet.reset();
    setState({
      signer: undefined,
      address: '',
      balance: '0',
      isLoading: false,
      error: null
    });
  };

  // Initial wallet setup
  useEffect(() => {
    const initWallet = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const localWallet = LocalWallet.getInstance();
        const newSigner = await localWallet.getSigner();
        const newAddress = await localWallet.getAddress();

        // Get initial balance
        const provider = await localWallet.getProvider();
        const balance = await provider.getBalance(newAddress);

        setState({
          signer: newSigner,
          address: newAddress,
          balance: ethers.utils.formatEther(balance),
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error initializing local wallet:', error);
        const errorMessage = error instanceof Error ? error.message : 'Wallet başlatılamadı';
        
        setState({
          signer: undefined,
          address: '',
          balance: '0',
          isLoading: false,
          error: errorMessage
        });
      }
    };

    initWallet();
  }, []);

  // Balance update interval
  useEffect(() => {
    if (!state.address || !state.signer) return;

    // Initial balance update
    updateBalance();

    // Set up interval for balance updates
    const interval = setInterval(updateBalance, 5000); // 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [state.address, state.signer]);

  return {
    ...state,
    connectWallet,
    resetWallet,
    updateBalance
  };
}; 