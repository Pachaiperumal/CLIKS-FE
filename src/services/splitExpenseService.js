import { apiClient } from '../api/client';

/**
 * Split Expense Service
 */
export const splitExpenseService = {
    getSplits: async () => await apiClient.get('/split-expenses'),
    getSummary: async () => await apiClient.get('/split-expenses/summary'),
    settleFriend: async (name) => await apiClient.patch('/split-expenses/settle-friend', { name }),
    getSplitById: async (id) => await apiClient.get(`/split-expenses/${id}`),
    createSplit: async (data) => await apiClient.post('/split-expenses', data),
    updateSplit: async (id, data) => await apiClient.put(`/split-expenses/${id}`, data),
    deleteSplit: async (id) => await apiClient.delete(`/split-expenses/${id}`),

    // Participants
    getParticipants: async (splitId) => await apiClient.get(`/split-expenses/${splitId}/participants`),
    addParticipant: async (splitId, data) => await apiClient.post(`/split-expenses/${splitId}/participants`, data),
    updateParticipant: async (splitId, participantId, data) => await apiClient.put(`/split-expenses/${splitId}/participants/${participantId}`, data),
    deleteParticipant: async (splitId, participantId) => await apiClient.delete(`/split-expenses/${splitId}/participants/${participantId}`),
    settleParticipant: async (splitId, participantId) => await apiClient.post(`/split-expenses/${splitId}/participants/${participantId}/settle`),
};

export default splitExpenseService;
