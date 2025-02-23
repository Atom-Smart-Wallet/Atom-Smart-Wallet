import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import { getSmartAccount } from '@/lib/services/contracts';

export interface WalletCardProps {
  label: string;
  address: string;
  balance: string;
  showCopy?: boolean;
  showUsername?: boolean;
  signer?: ethers.Signer;
}

const copyToClipboard = async (text: string) => {
  try {
    // Modern API'yi dene
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: textarea kullanarak kopyalama
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      document.execCommand('copy');
      textarea.remove();
      return true;
    } catch (err) {
      console.error('Kopyalama başarısız:', err);
      textarea.remove();
      return false;
    }
  } catch (err) {
    console.error('Kopyalama başarısız:', err);
    return false;
  }
};

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
    <div className="relative w-full h-[160px] sm:h-[180px] md:h-[200px] rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
      {/* Background Image */}
      <Image
        src={label === "EOA Wallet" ? "/eoa.png" : "/smartaccount.png"}
        alt={`${label} background`}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
      />
      
      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/90 via-black/60 to-black/20">
        {/* Header Section */}
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-white/90 tracking-wide">{label}</span>
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-black/30 rounded-full px-2 py-1">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-[10px] sm:text-xs text-white/80">Connected</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Balance Display */}
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {parseFloat(balance).toFixed(4)}
            </span>
            <span className="text-sm sm:text-base text-white/90">UNIT0</span>
          </div>

          {/* Address/Username Bar */}
          <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 sm:p-2.5">
            <div className="flex-1 text-[11px] sm:text-sm text-white/90 font-mono truncate" title={displayName}>
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white/90 rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </span>
              ) : (
                displayName
              )}
              {error && <span className="text-red-400 ml-2 text-[10px]">({error})</span>}
            </div>
            {showCopy && (
              <button
                onClick={async () => {
                  const success = await copyToClipboard(address);
                  // Optional: Add toast notification here based on success
                }}
                className="p-1.5 hover:bg-white/10 active:bg-white/20 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                title="Copy address"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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