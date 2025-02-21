'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@/lib/hooks/useWallet';
import { checkAndCreateAccount, updateBalances, sendBatchTransactions, sendSingleTransaction } from '@/lib/services/wallet';
import { isUsernameAvailable, getExistingAccount } from '@/lib/services/contracts';
import { WalletCard } from './components/WalletCard';
import { TabButton } from './components/TabButton';
import { SingleTransactionForm } from './components/SingleTransactionForm';
import { DualTransactionForm } from './components/DualTransactionForm';
import { SendEthSection } from './components/SendEthSection';
import ChatComponent from '@/components/chat/ChatComponent';

export default function Home() {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [accountAddress, setAccountAddress] = useState<string>('');
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [eoaBalance, setEoaBalance] = useState<string>('0');
  const [aaBalance, setAaBalance] = useState<string>('0');
  const [txLoading, setTxLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fund' | 'single' | 'batch' | 'chat'>('fund');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
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
      {/* Ana container - mobil için daha kompakt */}
      <div className="max-w-4xl mx-auto px-3 py-3 sm:px-4 md:px-6 lg:px-8">
        {/* Logo ve Başlık - mobil için daha kompakt */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 md:mb-10">
          {/* Logo - mobil için daha küçük */}
          <div className="flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Smart Account Logo" 
              width={96}
              height={96}
              priority
              className="h-8 sm:h-10 md:h-12 w-auto"
            />
          </div>
          {/* Dinamik Başlık - mobil için daha küçük */}
          {hasAccount && (
            <div className="text-right">
              <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-100 truncate max-w-[200px] sm:max-w-none">
                {activeTab === 'fund' && 'Fund Smart Account'}
                {activeTab === 'single' && 'Send Transaction'}
                {activeTab === 'batch' && 'Batch Transactions'}
                {activeTab === 'chat' && 'AI Chat Assistant'}
              </h1>
            </div>
          )}
          {!hasAccount && !address && (
            <div className="text-right">
              <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-100">
                Welcome to Units
              </h1>
            </div>
          )}
          {!hasAccount && address && (
            <div className="text-right">
              <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-100">
                Create Account
              </h1>
            </div>
          )}
        </div>

        {!address ? (
          <div className="flex justify-center pt-4 sm:pt-6 md:pt-8">
            <button
              onClick={connectWallet}
              disabled={loading}
              className={`w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-white font-medium text-sm sm:text-base md:text-lg transition-all duration-200 ${
                loading 
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:transform active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Cüzdan kartları - daha kompakt boyutlar */}
            <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="w-full sm:max-w-[180px] md:max-w-[200px]">
                <WalletCard 
                  label="EOA Wallet" 
                  address={address} 
                  balance={eoaBalance}
                  showUsername={false}
                  signer={signer}
                />
              </div>
              {hasAccount && (
                <div className="w-full sm:max-w-[180px] md:max-w-[200px] sm:ml-auto">
                  <WalletCard 
                    key={accountAddress}
                    label="Smart Account" 
                    address={accountAddress} 
                    balance={aaBalance}
                    showUsername={true}
                    signer={signer}
                  />
                </div>
              )}
            </div>

            {hasAccount ? (
              <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                {/* İşlem formu - mobil için daha kompakt */}
                <div className="bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg p-2.5 sm:p-3 md:p-4">
                  <div className="mt-2 sm:mt-3 md:mt-4">
                    {activeTab === 'fund' && (
                      <SendEthSection
                        signer={signer}
                        accountAddress={accountAddress}
                        onSuccess={refreshBalances}
                      />
                    )}
                    {activeTab === 'single' && (
                      <SingleTransactionForm 
                        signer={signer} 
                        onSubmit={handleSendSingleTransaction} 
                        loading={txLoading}
                      />
                    )}
                    {activeTab === 'batch' && (
                      <DualTransactionForm 
                        signer={signer}
                        onSubmit={handleSendBatchTransactions} 
                        loading={txLoading}
                      />
                    )}
                    {activeTab === 'chat' && (
                      <ChatComponent 
                        signer={signer}
                        accountAddress={accountAddress || ''}
                        onTransactionComplete={refreshBalances}
                      />
                    )}
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-xs sm:text-sm md:text-base text-center">{error}</div>
                )}

                {/* Alt navigasyon - mobil için daha kompakt */}
                <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-1 sm:p-1.5 md:p-2 z-50">
                  <div className="max-w-4xl mx-auto flex justify-around items-center">
                    <TabButton
                      active={activeTab === 'fund'}
                      onClick={() => setActiveTab('fund')}
                      className="flex flex-col items-center p-1 sm:p-1.5 md:p-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mb-0.5 md:mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px] sm:text-xs md:text-sm">Fund</span>
                    </TabButton>
                    <TabButton
                      active={activeTab === 'single'}
                      onClick={() => setActiveTab('single')}
                      className="flex flex-col items-center p-1 sm:p-1.5 md:p-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mb-0.5 md:mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="text-[10px] sm:text-xs md:text-sm">Send</span>
                    </TabButton>
                    <TabButton
                      active={activeTab === 'batch'}
                      onClick={() => setActiveTab('batch')}
                      className="flex flex-col items-center p-1 sm:p-1.5 md:p-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mb-0.5 md:mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                      <span className="text-[10px] sm:text-xs md:text-sm">Batch</span>
                    </TabButton>
                    <TabButton
                      active={activeTab === 'chat'}
                      onClick={() => setActiveTab('chat')}
                      className="flex flex-col items-center p-1 sm:p-1.5 md:p-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mb-0.5 md:mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span className="text-[10px] sm:text-xs md:text-sm">Chat</span>
                    </TabButton>
                  </div>
                </div>
                {/* Alt navigasyon için padding */}
                <div className="h-14 sm:h-16 md:h-20"></div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-100 mb-3 sm:mb-4">
                  Create Smart Account
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="Enter username"
                      className="w-full px-3 sm:px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {checkingUsername && (
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mt-1">Checking username...</p>
                    )}
                    {usernameError && (
                      <p className="text-red-500 text-[10px] sm:text-xs md:text-sm mt-1">{usernameError}</p>
                    )}
                  </div>
                  <button
                    onClick={handleCreateAccount}
                    disabled={loading || !!usernameError}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg text-white font-medium text-sm sm:text-base transition-all duration-200 ${
                      loading || !!usernameError
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  {error && (
                    <p className="text-red-500 text-[10px] sm:text-xs md:text-sm text-center">{error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 