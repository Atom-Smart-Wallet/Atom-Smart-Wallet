'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { sendEthToAAWallet } from '@/lib/services/contracts';
import { ethers } from 'ethers';

interface SendEthSectionProps {
  signer?: ethers.Signer;
  accountAddress: string;
  onSuccess?: () => void;
}

export const SendEthSection = ({ signer: propSigner, accountAddress, onSuccess }: SendEthSectionProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signer: hookSigner, connectWallet } = useWallet();

  const handleSendEth = async () => {
    try {
      setLoading(true);
      setError('');
      
      let currentSigner = propSigner || hookSigner;
      if (!currentSigner || !currentSigner.provider) {
        const result = await connectWallet();
        if (!result?.signer) {
          throw new Error('Failed to connect wallet');
        }
        currentSigner = result.signer;
      }

      if (!currentSigner.provider) {
        throw new Error('No provider available');
      }
      
      await sendEthToAAWallet(currentSigner, accountAddress, amount);
      setAmount('');
      onSuccess?.();
    } catch (err) {
      console.error('Error sending ETH:', err);
      setError(err instanceof Error ? err.message : 'Failed to send ETH. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700/50 backdrop-blur-xl">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      <div className="relative p-5 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
            Fund Smart Account with UNIT0
          </h2>
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount to Fund
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter amount..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-sm font-medium text-gray-400">ETH</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleSendEth}
            disabled={loading || !amount}
            className={`w-full relative group ${
              loading || !amount
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            } rounded-xl py-3.5 px-4 text-white font-medium text-base transition-all duration-200 transform hover:translate-y-[-1px] active:translate-y-[1px]`}
          >
            <div className="absolute inset-0 rounded-xl bg-grid-white/[0.05] bg-[size:10px_10px]" />
            <div className="relative flex items-center justify-center">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Send {amount || '0'} UNIT0</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
