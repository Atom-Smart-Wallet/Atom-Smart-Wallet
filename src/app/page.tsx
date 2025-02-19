'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { checkAndCreateAccount, updateBalances, sendBatchTransactions, sendSingleTransaction } from '@/lib/services/wallet';
import PaymasterInfo from './components/PaymasterInfo';
import { WalletCard } from './components/WalletCard';
import { TabButton } from './components/TabButton';
import { SingleTransactionForm } from './components/SingleTransactionForm';
import { DualTransactionForm } from './components/DualTransactionForm';
import { SendEthSection } from './components/SendEthSection';

export default function Home() {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [accountAddress, setAccountAddress] = useState<string>('');
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [eoaBalance, setEoaBalance] = useState<string>('0');
  const [aaBalance, setAaBalance] = useState<string>('0');
  const [txLoading, setTxLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fund' | 'single' | 'batch'>('fund');
  const { signer, connectWallet, address: walletAddress } = useWallet();

  const refreshBalances = async () => {
    if (signer && accountAddress) {
      try {
        const { eoaBalance: eoa, aaBalance: aa } = await updateBalances(signer, accountAddress);
        setEoaBalance(eoa);
        setAaBalance(aa);
      } catch (error) {
        console.error('Error updating balances:', error);
      }
    }
  };

  useEffect(() => {
    if (walletAddress && !address) {
      setAddress(walletAddress);
      if (signer) {
        checkAndCreateAccount(signer)
          .then(({ accountAddress, isExisting }) => {
            setAccountAddress(accountAddress);
            setHasAccount(isExisting);
            return updateBalances(signer, accountAddress);
          })
          .then(({ eoaBalance: eoa, aaBalance: aa }) => {
            setEoaBalance(eoa);
            setAaBalance(aa);
          })
          .catch(console.error);
      }
    }
  }, [walletAddress, signer, address]);

  useEffect(() => {
    if (signer && accountAddress) {
      // Initial balance update
      refreshBalances();

      // Set up interval for periodic updates
      const interval = setInterval(refreshBalances, 5000);

      // Cleanup interval on unmount or when dependencies change
      return () => clearInterval(interval);
    }
  }, [signer, accountAddress]);

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError('');
      if (!signer) throw new Error('Please connect your wallet first');

      const { accountAddress: newAccountAddress } = await checkAndCreateAccount(signer);
      setAccountAddress(newAccountAddress);
      setHasAccount(true);

      const { eoaBalance: eoa, aaBalance: aa } = await updateBalances(signer, newAccountAddress);
      setEoaBalance(eoa);
      setAaBalance(aa);
    } catch (err) {
      setError('Failed to create account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBatchTransactions = async (recipients: string[], amounts: string[]) => {
    try {
      setTxLoading(true);
      setError('');
      if (!signer) throw new Error('Please connect your wallet first');

      const receipt = await sendBatchTransactions(signer, accountAddress, recipients, amounts);
      console.log('Batch transaction sent:', receipt);

      const { eoaBalance: eoa, aaBalance: aa } = await updateBalances(signer, accountAddress);
      setEoaBalance(eoa);
      setAaBalance(aa);
    } catch (err) {
      setError('Failed to send transactions');
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleSendSingleTransaction = async (recipient: string, amount: string) => {
    try {
      setTxLoading(true);
      setError('');
      if (!signer) throw new Error('Please connect your wallet first');

      const receipt = await sendSingleTransaction(signer, accountAddress, recipient, amount);
      console.log('Transaction sent:', receipt);

      const { eoaBalance: eoa, aaBalance: aa } = await updateBalances(signer, accountAddress);
      setEoaBalance(eoa);
      setAaBalance(aa);
    } catch (err) {
      setError('Failed to send transaction');
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-100">
            Smart Account Wallet
          </h1>
          <p className="text-gray-400">Powered by Account Abstraction</p>
        </div>
        
        {!address ? (
          <div className="flex justify-center pt-10">
            <button
              onClick={connectWallet}
              disabled={loading}
              className={`px-8 py-4 rounded-xl text-white font-medium text-lg transition-all duration-200 ${
                loading 
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:transform active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <WalletCard label="EOA Wallet" address={address} balance={eoaBalance} />
              {hasAccount && (
                <WalletCard label="Smart Account" address={accountAddress} balance={aaBalance} />
              )}
            </div>

            {hasAccount ? (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-2xl shadow-lg p-4">
                  <div className="flex space-x-4 mb-6">
                    <TabButton
                      active={activeTab === 'fund'}
                      onClick={() => setActiveTab('fund')}
                    >
                      Fund Account
                    </TabButton>
                    <TabButton
                      active={activeTab === 'single'}
                      onClick={() => setActiveTab('single')}
                    >
                      Single Transaction
                    </TabButton>
                    <TabButton
                      active={activeTab === 'batch'}
                      onClick={() => setActiveTab('batch')}
                    >
                      Batch Transactions
                    </TabButton>
                  </div>
                  
                  <div className="mt-4">
                    {activeTab === 'fund' && (
                      <SendEthSection aaWalletAddress={accountAddress} />
                    )}
                    {activeTab === 'single' && (
                      <SingleTransactionForm onSubmit={handleSendSingleTransaction} loading={txLoading} />
                    )}
                    {activeTab === 'batch' && (
                      <DualTransactionForm onSubmit={handleSendBatchTransactions} loading={txLoading} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-10">
                <button
                  onClick={handleCreateAccount}
                  disabled={loading}
                  className={`px-8 py-4 rounded-xl text-white font-medium text-lg transition-all duration-200 ${
                    loading 
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:transform active:scale-[0.99]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Smart Account'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-gray-800 border border-red-500 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <PaymasterInfo />
      </div>
    </div>
  );
} 