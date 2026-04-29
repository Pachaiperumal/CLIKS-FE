import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialPlanService } from '../../services';
import { 
    Plus, 
    DollarSign, 
    TrendingUp, 
    Wallet, 
    Search, 
    Filter, 
    ChevronDown, 
    Edit, 
    Trash2, 
    X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../../components/common';
import './financial-plan.css';

const EMPTY_FORM = { item: '', category: '', estimatedCost: '', plannedMonth: '' };
const PlanExpense = () => {
    const queryClient = useQueryClient();

    // 1. Fetch available plans
    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['financial-plans'],
        queryFn: async () => {
            const res = await financialPlanService.getPlans();
            return res.data || res;
        }
    });

    const activePlanId = plans.length > 0 ? plans[0].id : null;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData]       = useState(EMPTY_FORM);
    const [formError, setFormError]     = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Expenses
    const { data: plannedExpenses = [], isLoading: expensesLoading } = useQuery({
        queryKey: ['plan-expenses', activePlanId],
        queryFn: async () => {
            if (!activePlanId) return [];
            const data = await financialPlanService.getPlanExpenses(activePlanId);
            return data.map(item => ({
                id: item.id,
                item: item.item || item.title,
                category: item.category,
                estimatedCost: parseFloat(item.amount || item.estimated_cost),
                plannedMonth: item.date || item.planned_month
            }));
        },
        enabled: !!activePlanId
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (newExpense) => financialPlanService.createPlanExpense(activePlanId, newExpense),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-expenses', activePlanId] });
            closeModal();
        },
        onError: (err) => {
            setFormError(err.message || 'Failed to add expense.');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => financialPlanService.deletePlanExpense(activePlanId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-expenses', activePlanId] });
        }
    });

    const isLoading = plansLoading || (activePlanId && expensesLoading);


    const openModal = () => {
        setFormData(EMPTY_FORM);
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormError('');
    };

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!formData.item || !formData.category || !formData.estimatedCost || !formData.plannedMonth) {
            setFormError('All fields are required.');
            return;
        }

        const newExpense = {
            item: formData.item,
            category: formData.category,
            amount: parseFloat(formData.estimatedCost),
            date: formData.plannedMonth,
        };

        createMutation.mutate(newExpense);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this planned expense?')) {
            deleteMutation.mutate(id);
        }
    };

    const totalProjected = plannedExpenses.reduce((sum, item) => sum + item.estimatedCost, 0);
    const monthlyAverage =
        plannedExpenses.length > 0 ? totalProjected / plannedExpenses.length : 0;

    const filteredExpenses = plannedExpenses.filter(
        (item) =>
            item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E3F2FD', borderTopColor: '#DC2626', borderRadius: '50%' }} />
            </div>
        );
    }

    return (
        <div className="fp-page">
            <div className="fp-header">
                <div className="fp-header-left">
                    <h1>Expense</h1>
                    <p>Track and prepare for upcoming large expenses</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openModal}>
                    <Plus size={16} />
                    <span>Add Expense</span>
                </button>
            </div>

            <div className="fp-summary-grid">
                <div className="fp-summary-card">
                    <div className="fp-summary-icon fp-icon--red">
                        <DollarSign size={22} />
                    </div>
                    <div className="fp-summary-info">
                        <p>Total Planned</p>
                        <h3>${totalProjected.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="fp-summary-card">
                    <div className="fp-summary-icon fp-icon--orange">
                        <TrendingUp size={22} />
                    </div>
                    <div className="fp-summary-info">
                        <p>Monthly Average</p>
                        <h3>${monthlyAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className="fp-summary-card">
                    <div className="fp-summary-icon fp-icon--indigo">
                        <Wallet size={22} />
                    </div>
                    <div className="fp-summary-info">
                        <p>Upcoming Items</p>
                        <h3>{plannedExpenses.length}</h3>
                    </div>
                </div>
            </div>

            <div className="fp-toolbar">
                <div className="fp-search-wrap">
                    <Search size={15} className="fp-search-icon" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        className="fp-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="fp-toolbar-actions">
                    <button className="fp-filter-btn">
                        <Filter size={14} />
                        Filter
                    </button>
                    <button className="fp-sort-btn">
                        Sort By
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {filteredExpenses.length === 0 ? (
                <EmptyState
                    title="No expenses planned yet"
                    description="Add your first planned expense to start preparing your budget."
                />
            ) : (
                <div className="fp-table-card">
                    <table className="fp-table">
                        <thead>
                            <tr>
                                <th>Expense Name</th>
                                <th>Category</th>
                                <th className="fp-th-right">Amount</th>
                                <th>Date</th>
                                <th className="fp-th-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((expense) => (
                                <tr key={expense.id}>
                                    <td className="fp-td-name">{expense.item}</td>
                                    <td>
                                        <span className="fp-badge">{expense.category}</span>
                                    </td>
                                    <td className="fp-td-amount">${expense.estimatedCost.toLocaleString()}</td>
                                    <td className="fp-td-muted">{expense.plannedMonth}</td>
                                    <td className="fp-td-center">
                                        <div className="fp-row-actions">
                                            <button className="fp-action-btn fp-action-btn--edit" title="Edit">
                                                <Edit size={15} />
                                            </button>
                                            <button
                                                className="fp-action-btn fp-action-btn--delete"
                                                title="Delete"
                                                onClick={() => handleDelete(expense.id)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fp-modal-overlay">
                        <motion.div
                            className="fp-modal"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="fp-modal-header">
                                <h2 className="fp-modal-title">Add Planned Expense</h2>
                                <button className="fp-modal-close" onClick={closeModal}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form className="fp-form" onSubmit={handleAddExpense}>
                                <div className="fp-field">
                                    <label className="fp-label">Expense Name</label>
                                    <input
                                        type="text"
                                        className="fp-input"
                                        placeholder="e.g. New Laptop"
                                        value={formData.item}
                                        onChange={(e) =>
                                            setFormData({ ...formData, item: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="fp-field">
                                    <label className="fp-label">Category</label>
                                    <input
                                        type="text"
                                        className="fp-input"
                                        placeholder="e.g. Electronics"
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="fp-field">
                                    <label className="fp-label">Amount</label>
                                    <input
                                        type="number"
                                        className="fp-input"
                                        placeholder="0.00"
                                        value={formData.estimatedCost}
                                        onChange={(e) =>
                                            setFormData({ ...formData, estimatedCost: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="fp-field">
                                    <label className="fp-label">Date</label>
                                    <input
                                        type="date"
                                        className="fp-input"
                                        value={formData.plannedMonth}
                                        onChange={(e) =>
                                            setFormData({ ...formData, plannedMonth: e.target.value })
                                        }
                                    />
                                </div>

                                {formError && (
                                    <p className="fp-form-error">{formError}</p>
                                )}

                                <div className="fp-modal-footer">
                                    <button
                                        type="button"
                                        className="fp-btn-cancel"
                                        onClick={closeModal}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="fp-btn-submit">
                                        Save Expense
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlanExpense;
