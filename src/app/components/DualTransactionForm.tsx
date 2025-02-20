'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getSmartAccountRegistry } from '@/lib/services/contracts';

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

        await onSubmit(
          [resolvedAddress1, resolvedAddress2],
          [amount1, amount2]
        );

        // Clear form after successful submission
        setRecipient1('');
        setRecipient2('');
        setAmount1('');
        setAmount2('');
      } finally {
        setResolving(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Send Batch Transactions</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              First Recipient (address or username)
            </label>
            <input
              type="text"
              value={recipient1}
              onChange={(e) => setRecipient1(e.target.value.toLowerCase())}
              placeholder="0x... or username"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-100"
              disabled={loading || resolving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              First Amount (ETH)
            </label>
            <input
              type="text"
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
              placeholder="0.1"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-100"
              disabled={loading || resolving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Second Recipient (address or username)
            </label>
            <input
              type="text"
              value={recipient2}
              onChange={(e) => setRecipient2(e.target.value.toLowerCase())}
              placeholder="0x... or username"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-100"
              disabled={loading || resolving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Second Amount (ETH)
            </label>
            <input
              type="text"
              value={amount2}
              onChange={(e) => setAmount2(e.target.value)}
              placeholder="0.1"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-100"
              disabled={loading || resolving}
            />
          </div>
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || resolving || !recipient1 || !recipient2 || !amount1 || !amount2 || !signer}
          className={`w-full py-3 px-4 rounded-xl text-white font-medium text-lg transition-all duration-200 ${
            loading || resolving || !recipient1 || !recipient2 || !amount1 || !amount2 || !signer
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:transform active:scale-[0.99]'
          }`}
        >
          {!signer ? (
            'Please Connect Wallet'
          ) : loading || resolving ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {resolving ? 'Resolving Usernames...' : 'Sending...'}
            </div>
          ) : (
            'Send Transactions'
          )}
        </button>
      </form>
    </div>
  );
}; 