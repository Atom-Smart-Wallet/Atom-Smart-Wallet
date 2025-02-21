'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getSmartAccountRegistry } from '@/lib/services/contracts';
import { TransactionConfirmModal } from './TransactionConfirmModal';

interface DualTransactionFormProps {
  onSubmit: (recipients: string[], amounts: string[]) => Promise<void>;
  loading: boolean;
  signer?: ethers.Signer;
}

export const DualTransactionForm = ({ onSubmit, loading, signer }: DualTransactionFormProps) => {
  const [recipient1, setRecipient1] = useState('');
  const [recipient2, setRecipient2] = useState('');
  const [amount1, setAmount1] = useState('');
  const [amount2, setAmount2] = useState('');
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(false);
  const [hasSigner, setHasSigner] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resolvedRecipients, setResolvedRecipients] = useState<string[]>([]);

  useEffect(() => {
    const checkSigner = async () => {
      try {
        if (signer) {
          const address = await signer.getAddress();
          setHasSigner(!!address);
          console.log('Signer status:', { hasSigner: !!address, address });
        } else {
          setHasSigner(false);
          console.log('No signer available');
        }
      } catch (err) {
        console.error('Error checking signer:', err);
        setHasSigner(false);
      }
    };

    checkSigner();
  }, [signer]);

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

  const resolveRecipient = async (recipient: string): Promise<string> => {
    if (!recipient.startsWith('0x')) {
      return await resolveUsername(recipient);
    } else if (!ethers.utils.isAddress(recipient)) {
      throw new Error(`Invalid Ethereum address: ${recipient}`);
    }
    return recipient;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!signer) {
        throw new Error('Please connect your wallet first');
      }

      setResolving(true);
      try {
        // Resolve both recipients in parallel
        const [resolvedAddress1, resolvedAddress2] = await Promise.all([
          resolveRecipient(recipient1),
          resolveRecipient(recipient2)
        ]);

        setResolvedRecipients([resolvedAddress1, resolvedAddress2]);
        setShowConfirm(true);
      } finally {
        setResolving(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleConfirmTransaction = async () => {
    try {
      await onSubmit(resolvedRecipients, [amount1, amount2]);
      // Clear form after successful submission
      setRecipient1('');
      setRecipient2('');
      setAmount1('');
      setAmount2('');
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
              Batch Transactions
            </h2>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* First Transaction */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-4">
                <h3 className="text-sm font-medium text-gray-300">First Transaction</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Recipient Address or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipient1}
                      onChange={(e) => setRecipient1(e.target.value.toLowerCase())}
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
                  <label htmlFor="amount1" className="block text-sm font-medium text-gray-300 mb-1">
                    Amount 1 (UNIT0)
                  </label>
                  <input
                    type="number"
                    id="amount1"
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value)}
                    placeholder="0.0 UNIT0"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Second Transaction */}
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 space-y-4">
                <h3 className="text-sm font-medium text-gray-300">Second Transaction</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Recipient Address or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipient2}
                      onChange={(e) => setRecipient2(e.target.value.toLowerCase())}
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
                  <label htmlFor="amount2" className="block text-sm font-medium text-gray-300 mb-1">
                    Amount 2 (UNIT0)
                  </label>
                  <input
                    type="number"
                    id="amount2"
                    value={amount2}
                    onChange={(e) => setAmount2(e.target.value)}
                    placeholder="0.0 UNIT0"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  />
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
              disabled={loading || resolving || !recipient1 || !recipient2 || !amount1 || !amount2 || !hasSigner}
              className={`w-full relative group ${
                loading || resolving || !recipient1 || !recipient2 || !amount1 || !amount2 || !hasSigner
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              } rounded-xl py-3.5 px-4 text-white font-medium text-base transition-all duration-200 transform hover:translate-y-[-1px] active:translate-y-[1px]`}
            >
              <div className="absolute inset-0 rounded-xl bg-grid-white/[0.05] bg-[size:10px_10px]" />
              <div className="relative flex items-center justify-center">
                {loading || resolving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>{resolving ? 'Resolving Usernames...' : 'Sending Batch...'}</span>
                  </>
                ) : !hasSigner ? (
                  <>
                    <svg className="w-5 h-5 mr-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Connect Wallet</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    <span>Send Batch</span>
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
        recipient={`${recipient1} ve ${recipient2}`}
        amount={`${amount1} + ${amount2}`}
        loading={loading}
      />
    </>
  );
}; 