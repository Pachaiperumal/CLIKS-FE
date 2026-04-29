import { apiClient } from '../api/client';

/**
 * Financial Plan Service
 */
export const financialPlanService = {
    // Plans
    getPlans: async () => await apiClient.get('/financial-plans'),
    getPlanById: async (id) => await apiClient.get(`/financial-plans/${id}`),
    createPlan: async (data) => await apiClient.post('/financial-plans', data),
    updatePlan: async (id, data) => await apiClient.put(`/financial-plans/${id}`, data),
    deletePlan: async (id) => await apiClient.delete(`/financial-plans/${id}`),

    // Plan Budgets
    getPlanBudgets: async (planId) => await apiClient.get(`/financial-plans/${planId}/budgets`),
    createPlanBudget: async (planId, data) => await apiClient.post(`/financial-plans/${planId}/budgets`, data),
    updatePlanBudget: async (planId, budgetId, data) => await apiClient.put(`/financial-plans/${planId}/budgets/${budgetId}`, data),
    deletePlanBudget: async (planId, budgetId) => await apiClient.delete(`/financial-plans/${planId}/budgets/${budgetId}`),

    // Plan Income
    getPlanIncome: async (planId) => await apiClient.get(`/financial-plans/${planId}/income`),
    createPlanIncome: async (planId, data) => await apiClient.post(`/financial-plans/${planId}/income`, data),
    updatePlanIncome: async (planId, incomeId, data) => await apiClient.put(`/financial-plans/${planId}/income/${incomeId}`, data),
    deletePlanIncome: async (planId, incomeId) => await apiClient.delete(`/financial-plans/${planId}/income/${incomeId}`),

    // Plan Expenses
    getPlanExpenses: async (planId) => await apiClient.get(`/financial-plans/${planId}/expenses`),
    createPlanExpense: async (planId, data) => await apiClient.post(`/financial-plans/${planId}/expenses`, data),
    updatePlanExpense: async (planId, expenseId, data) => await apiClient.put(`/financial-plans/${planId}/expenses/${expenseId}`, data),
    deletePlanExpense: async (planId, expenseId) => await apiClient.delete(`/financial-plans/${planId}/expenses/${expenseId}`),

    // Plan Goals
    getPlanGoals: async (planId) => await apiClient.get(`/financial-plans/${planId}/goals`),
    createPlanGoal: async (planId, data) => await apiClient.post(`/financial-plans/${planId}/goals`, data),
    updatePlanGoal: async (planId, goalId, data) => await apiClient.put(`/financial-plans/${planId}/goals/${goalId}`, data),
    deletePlanGoal: async (planId, goalId) => await apiClient.delete(`/financial-plans/${planId}/goals/${goalId}`),

    // Plan Reminders
    getPlanReminders: async (planId) => await apiClient.get(`/financial-plans/${planId}/reminders`),
    createPlanReminder: async (planId, data) => await apiClient.post(`/financial-plans/${planId}/reminders`, data),
    updatePlanReminder: async (planId, reminderId, data) => await apiClient.put(`/financial-plans/${planId}/reminders/${reminderId}`, data),
    deletePlanReminder: async (planId, reminderId) => await apiClient.delete(`/financial-plans/${planId}/reminders/${reminderId}`),

    // Analysis & Calendar
    getPlanAnalysis: async (planId) => await apiClient.get(`/financial-plans/${planId}/analysis`),
    getCalendar: async () => await apiClient.get('/financial-plans/calendar'),
};

export default financialPlanService;
