'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getPaymaster } from '@/lib/services/paymaster';
import { getEntryPoint } from '@/lib/services/contracts';
import { usePaymasterStore } from '@/lib/store';
import { useWallet } from '@/lib/hooks/useWallet';
import { PAYMASTER_ADDRESS } from '@/lib/config';

export default function PaymasterInfo() {
    const [deposit, setDeposit] = useState<string>('0');
    const [stake, setStake] = useState<string>('0');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const { usePaymaster, togglePaymaster } = usePaymasterStore();
    const { signer } = useWallet();

    const fetchPaymasterInfo = async () => {
        if (!signer || !signer.provider) {
            setLoading(false);
            return;
        }

        try {
            setError('');

            const paymaster = getPaymaster(signer);
            const entryPoint = getEntryPoint(signer);

            // Get deposit
            const depositBN = await paymaster.getDeposit();
            setDeposit(ethers.utils.formatEther(depositBN));

            // Get stake info using PAYMASTER_ADDRESS directly
            const stakeInfo = await entryPoint.getDepositInfo(PAYMASTER_ADDRESS);
            setStake(ethers.utils.formatEther(stakeInfo.stake));
        } catch (error) {
            console.error('Error fetching paymaster info:', error);
            setError('Failed to fetch paymaster info');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymasterInfo();
        
        const interval = setInterval(fetchPaymasterInfo, 5000);
        
        return () => clearInterval(interval);
    }, [signer]);

    return (
        <div className="bg-gray-900 shadow-lg rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-100">Paymaster Info</h2>
                <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-300">
                        {usePaymaster ? 'Paymaster Enabled' : 'Paymaster Disabled'}
                    </span>
                    <button
                        onClick={togglePaymaster}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                            usePaymaster ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                usePaymaster ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>
            
            {loading ? (
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
            ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-400">Deposit</p>
                        <p className="text-xl font-semibold text-gray-100">{deposit} ETH</p>
                    </div>
                    <div>
                        <p className="text-gray-400">Stake</p>
                        <p className="text-xl font-semibold text-gray-100">{stake} ETH</p>
                    </div>
                </div>
            )}
        </div>
    );
} 