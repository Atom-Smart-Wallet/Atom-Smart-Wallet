'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { checkAndCreateAccount, updateBalances, sendBatchTransactions, sendSingleTransaction } from '@/lib/services/wallet';
import { isUsernameAvailable, getExistingAccount } from '@/lib/services/contracts';
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
  const [username, setUsername] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [checkingUsername, setCheckingUsername] = useState(false);
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
        // Check if user has an existing account
        getExistingAccount(signer)
          .then(async (existingAccount) => {
            if (existingAccount) {
              setAccountAddress(existingAccount);
              setHasAccount(true);
              return updateBalances(signer, existingAccount);
            } else {
              return updateBalances(signer);
            }
          })
          .then(({ eoaBalance: eoa, aaBalance: aa }) => {
            setEoaBalance(eoa);
            if (aa !== '0') {
              setAaBalance(aa);
            }
          })
          .catch(console.error);
      }
    }
  }, [walletAddress, signer, address]);

  useEffect(() => {
    if (signer && accountAddress && hasAccount) {
      // Initial balance update
      refreshBalances();

      // Set up interval for periodic updates
      const interval = setInterval(refreshBalances, 5000);

      // Cleanup interval on unmount or when dependencies change
      return () => clearInterval(interval);
    }
  }, [signer, accountAddress, hasAccount]);

  useEffect(() => {
    const checkUsername = async () => {
      if (!username || !signer) return;
      
      // Validate username format first
      if (!username.match(/^[a-z0-9]+$/)) {
        setUsernameError('Username can only contain lowercase letters and numbers');
        return;
      }

      try {
        setCheckingUsername(true);
        setUsernameError('');
        const available = await isUsernameAvailable(signer, username);
        if (!available) {
          setUsernameError('This username is already taken');
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameError('Error checking username availability');
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, signer]);

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError('');
      if (!signer) throw new Error('Please connect your wallet first');
      if (!username) throw new Error('Please enter a username');
      if (usernameError) throw new Error(usernameError);

      // Validate username format
      if (!username.match(/^[a-z0-9]+$/)) {
        throw new Error('Username can only contain lowercase letters and numbers');
      }

      // Double check availability before creating
      const available = await isUsernameAvailable(signer, username);
      if (!available) {
        throw new Error('This username is already taken');
      }

      const { accountAddress: newAccountAddress } = await checkAndCreateAccount(signer, username);
      setAccountAddress(newAccountAddress);
      setHasAccount(true);

      const { eoaBalance: eoa, aaBalance: aa } = await updateBalances(signer, newAccountAddress);
      setEoaBalance(eoa);
      setAaBalance(aa);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
              <WalletCard 
                label="EOA Wallet" 
                address={address} 
                balance={eoaBalance}
                showUsername={false}
                signer={signer}
              />
              {hasAccount && (
                <WalletCard 
                  key={accountAddress}
                  label="Smart Account" 
                  address={accountAddress} 
                  balance={aaBalance}
                  showUsername={true}
                  signer={signer}
                />
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
                      <SingleTransactionForm 
                        onSubmit={handleSendSingleTransaction} 
                        loading={txLoading}
                        signer={signer}
                      />
                    )}
                    {activeTab === 'batch' && (
                      <DualTransactionForm onSubmit={handleSendBatchTransactions} loading={txLoading} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 space-y-4">
                <div className="w-full max-w-md">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="Enter username (e.g. alice123)"
                      className={`w-full px-4 py-2 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-100 ${
                        usernameError ? 'border-red-500' : 'border-gray-700'
                      }`}
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {usernameError ? (
                    <p className="mt-1 text-sm text-red-400">{usernameError}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">
                      Your username will be registered as {username ? `${username}.units` : 'username.units'}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCreateAccount}
                  disabled={loading || !username || !!usernameError || checkingUsername}
                  className={`px-8 py-4 rounded-xl text-white font-medium text-lg transition-all duration-200 ${
                    loading || !username || !!usernameError || checkingUsername
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