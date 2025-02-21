import { create } from 'zustand';

interface PaymasterStore {
    usePaymaster: boolean;
}

export const usePaymasterStore = create<PaymasterStore>(() => ({
    usePaymaster: true
})); 