import { apiClient } from '../api/client';

/**
 * People Service
 */
export const peopleService = {
    getPeople: async (params) => await apiClient.get('/people', { params }),
    getPersonById: async (id) => await apiClient.get(`/people/${id}`),
    createPerson: async (data) => await apiClient.post('/people', data),
    updatePerson: async (id, data) => await apiClient.patch(`/people/${id}`, data),
    deletePerson: async (id) => await apiClient.delete(`/people/${id}`),

    // Global aggregated views
    getAllTransactions: async () => await apiClient.get('/people/transactions'),
    getAllReminders: async () => await apiClient.get('/people/reminders'),
    getAllRecords: async () => await apiClient.get('/people/records'),

    // Nested Transactions
    getTransactions: async (personId) => await apiClient.get(`/people/${personId}/transactions`),
    createTransaction: async (personId, data) => await apiClient.post(`/people/${personId}/transactions`, data),
    updateTransaction: async (personId, transactionId, data) => await apiClient.patch(`/people/${personId}/transactions/${transactionId}`, data),
    deleteTransaction: async (personId, transactionId) => await apiClient.delete(`/people/${personId}/transactions/${transactionId}`),

    // Nested Reminders
    getReminders: async (personId) => await apiClient.get(`/people/${personId}/reminders`),
    createReminder: async (personId, data) => await apiClient.post(`/people/${personId}/reminders`, data),
    updateReminder: async (personId, reminderId, data) => await apiClient.patch(`/people/${personId}/reminders/${reminderId}`, data),
    deleteReminder: async (personId, reminderId) => await apiClient.delete(`/people/${personId}/reminders/${reminderId}`),

    // Nested Records
    getRecords: async (personId) => await apiClient.get(`/people/${personId}/records`),
    createRecord: async (personId, data) => await apiClient.post(`/people/${personId}/records`, data),
    updateRecord: async (personId, recordId, data) => await apiClient.patch(`/people/${personId}/records/${recordId}`, data),
    deleteRecord: async (personId, recordId) => await apiClient.delete(`/people/${personId}/records/${recordId}`),
};

export default peopleService;
