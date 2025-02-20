import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getSmartAccount } from '@/lib/services/contracts';

export interface WalletCardProps {
  label: string;
  address: string;
  balance: string;
  showCopy?: boolean;
  showUsername?: boolean;
  signer?: ethers.Signer;
}

export const WalletCard = ({ 
  label, 
  address, 
  balance, 
  showCopy = true,
  showUsername = true,
  signer
}: WalletCardProps) => {
  const [displayName, setDisplayName] = useState(address);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchName = async () => {
      if (!signer || !showUsername || !address) {
        setDisplayName(address);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const smartAccount = getSmartAccount(address, signer);
        const name = await smartAccount.getName();
        
        if (name && name !== '') {
          setDisplayName(name);
        } else {
          setDisplayName(address);
        }
      } catch (error) {
        setError('Failed to fetch name');
        setDisplayName(address);
      } finally {
        setIsLoading(false);
      }
    };

    fetchName();
  }, [signer, address, showUsername, label]);

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-1">
      <div className="bg-gray-900 rounded-xl p-6 h-full">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-300">Connected</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-100">{parseFloat(balance).toFixed(4)}</span>
            <span className="text-gray-300">ETH</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 text-sm text-gray-300 font-mono truncate" title={displayName}>
              {isLoading ? 'Loading...' : displayName}
              {error && <span className="text-red-400 ml-2 text-xs">({error})</span>}
            </div>
            {showCopy && (
              <button
                onClick={() => navigator.clipboard.writeText(address)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                title="Copy address"
              >
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 