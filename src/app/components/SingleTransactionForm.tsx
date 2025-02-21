'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getSmartAccountRegistry } from '@/lib/services/contracts';
import { TransactionConfirmModal } from './TransactionConfirmModal';

interface SingleTransactionFormProps {
  onSubmit: (recipient: string, amount: string) => Promise<void>;
  loading: boolean;
  signer: ethers.Signer | undefined;
}

export const SingleTransactionForm = ({ onSubmit, loading, signer }: SingleTransactionFormProps) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resolvedRecipient, setResolvedRecipient] = useState('');

  const resolveUsername = async (username: string): Promise<string> => {
    if (!signer) {
      throw new Error('Please connect your wallet first');
    }
    
    const registry = await getSmartAccountRegistry(signer);
    const fullUsername = username.endsWith('.units') ? username : `${username}.units`;
    
    try {
      const address = await registry.resolveName(fullUsername);
      
      if (address && address !== ethers.constants.AddressZero) {
        return address;
      }
      
      throw new Error(`Username '${username}' not found`);
    } catch (err) {
      if (err.message.includes('Name expired or not registered')) {
        throw new Error(`Username '${username}' is expired or not registered`);
      } else if (err.message.includes('Invalid name format')) {
        throw new Error(`Invalid username format for '${username}'`);
      }
      throw new Error(`Could not resolve username '${username}'`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!signer) {
        throw new Error('Please connect your wallet first');
      }

      setResolving(true);
      let resolved = recipient;
      
      if (!recipient.startsWith('0x')) {
        resolved = await resolveUsername(recipient);
      } else if (!ethers.utils.isAddress(recipient)) {
        throw new Error('Invalid Ethereum address');
      }

      setResolvedRecipient(resolved);
      setShowConfirm(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setResolving(false);
    }
  };

  const handleConfirmTransaction = async () => {
    try {
      await onSubmit(resolvedRecipient, amount);
      setRecipient('');
      setAmount('');
      setShowConfirm(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700/50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative p-5 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
              Send Transaction
            </h2>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.toLowerCase())}
                  placeholder="0x... or username.units"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading || resolving}
                />
                {resolving && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
                Amount (UNIT0)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0 UNIT0"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading || resolving}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <span className="text-sm font-medium text-gray-400">UNIT0</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || resolving || !recipient || !amount || !signer}
              className={`w-full relative group ${
                loading || resolving || !recipient || !amount || !signer
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              } rounded-xl py-3.5 px-4 text-white font-medium text-base transition-all duration-200 transform hover:translate-y-[-1px] active:translate-y-[1px]`}
            >
              <div className="absolute inset-0 rounded-xl bg-grid-white/[0.05] bg-[size:10px_10px]" />
              <div className="relative flex items-center justify-center">
                {loading || resolving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>{resolving ? 'Resolving Username...' : 'Sending...'}</span>
                  </>
                ) : !signer ? (
                  <>
                    <svg className="w-5 h-5 mr-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Connect Wallet</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Send Transaction</span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>

      <TransactionConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmTransaction}
        recipient={recipient}
        amount={amount}
        loading={loading}
      />
    </>
  );
}; 