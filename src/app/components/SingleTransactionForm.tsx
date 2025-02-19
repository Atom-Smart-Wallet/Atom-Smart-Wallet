'use client';

import { useState } from 'react';

interface SingleTransactionFormProps {
  onSubmit: (recipient: string, amount: string) => void;
  loading: boolean;
}

export const SingleTransactionForm = ({ onSubmit, loading }: SingleTransactionFormProps) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(recipient, amount);
  };

  return (
    <div className="bg-gray-900 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Send Single Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">To Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm text-gray-100"
              placeholder="0x..."
            />
          </div>
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
        </div>

        <button
          type="submit"
          disabled={loading || !recipient || !amount}
          className={`w-full py-3 px-4 rounded-xl text-white font-medium text-lg transition-all duration-200 ${
            loading || !recipient || !amount
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
            'Send Transaction'
          )}
        </button>
      </form>
    </div>
  );
}; 