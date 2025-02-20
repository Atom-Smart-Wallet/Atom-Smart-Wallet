import { ethers } from 'ethers';

interface SingleTransactionFormProps {
  signer?: ethers.Signer;
  onSubmit: (recipient: string, amount: string) => Promise<void>;
  loading: boolean;
}

// ... existing code ... 