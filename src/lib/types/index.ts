import { ethers } from 'ethers';

export interface UserOperationParams {
    target?: string;
    value?: string;
    data?: string;
    targets?: string[];
    values?: string[];
    datas?: string[];
    isBatch?: boolean;
    usePaymaster?: boolean;
}

export type UserOperation = {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    accountGasLimits: string;
    preVerificationGas: string;
    gasFees: string;
    paymasterAndData: string;
    signature: string;
}

export interface WalletState {
    signer: ethers.Signer | null;
    provider: ethers.providers.Web3Provider | null;
    address: string;
    error: string;
}

export interface ContractServices {
    smartAccount: ethers.Contract;
    entryPoint: ethers.Contract;
    accountFactory: ethers.Contract;
} 