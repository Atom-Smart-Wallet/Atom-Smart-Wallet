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
    <div className="bg-gray-900 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Fund Smart Account</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-100"
              placeholder="0.0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-300">ETH</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          onClick={handleSendEth}
          disabled={loading || !amount}
          className={`w-full py-3 px-4 rounded-xl text-white font-medium text-lg transition-all duration-200 ${
            loading || !amount
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:transform active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            'Send ETH'
          )}
        </button>
      </div>
    </div>
  );
};
