import { ethers } from 'ethers';

interface BatchTransactionFormProps {
  signer?: ethers.Signer;
  onSubmit: (recipients: string[], amounts: string[]) => Promise<void>;
  loading: boolean;
}

// ... existing code ... 