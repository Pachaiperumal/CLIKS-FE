import { apiClient } from '../api/client';

/**
 * Goal Wallet Service (Personal Purpose Wallet)
 */
export const goalWalletService = {
    getWallets: async (params) => await apiClient.get('/goal-wallets', { params }),
    getWalletById: async (id) => await apiClient.get(`/goal-wallets/${id}`),
    createWallet: async (data) => await apiClient.post('/goal-wallets', data),
    addMoney: async (id, amount) => await apiClient.post(`/goal-wallets/${id}/add-money`, { amount }),
    claimWallet: async (id) => await apiClient.post(`/goal-wallets/${id}/claim`),
    deleteWallet: async (id) => await apiClient.delete(`/goal-wallets/${id}`),
};

export default goalWalletService;
