import { create } from 'zustand';

interface PaymasterStore {
    usePaymaster: boolean;
    togglePaymaster: () => void;
}

export const usePaymasterStore = create<PaymasterStore>((set) => ({
    usePaymaster: false,
    togglePaymaster: () => set((state) => ({ usePaymaster: !state.usePaymaster })),
})); 