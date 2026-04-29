import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '../services';
import '../App.css';
import './Transactions.css';
import { useState, useRef, useEffect } from 'react';
import '../styles/modals.css';
import { formatCurrency } from '../lib/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Building2,
    Home,
    Coffee,
    Smartphone,
    Receipt,
    Plus,
    ChevronDown,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Search,
    Filter,
    Calendar,
    Trash2,
    X
} from 'lucide-react';

const CATEGORIES = [
    'Employment', 'Business', 'Investment', 'Freelance', 'Rental',
    'Housing', 'Food', 'Utilities', 'Transport', 'Healthcare',
    'Entertainment', 'Shopping', 'Education', 'Travel', 'Other'
];

const ICON_MAP = {
    Employment: Briefcase,
    Business: Building2,
    Housing: Home,
    Food: Coffee,
    Utilities: Smartphone,
    Default: Receipt,
};

const EMPTY_FORM = { title: '', category: '', amount: '', date: '', notes: '' };

const StatCard = ({ label, value, subtext, icon: Icon, colorClass }) => (
    <div className="stat-card">
        <div className="stat-header">
            <div>
                <p className="stat-label">{label}</p>
                <h3 className="stat-value">{value}</h3>
            </div>
            <div className={`icon-box ${colorClass}`}>
                <Icon size={20} />
            </div>
        </div>
        <p className="stat-footer">{subtext}</p>
    </div>
);

const Transactions = () => {
    const queryClient = useQueryClient();
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef(null);

    // Fetch transactions
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const data = await transactionsService.getTransactions();
            return data.map(tx => ({
                id: tx.id,
                type: tx.type,
                title: tx.title,
                category: tx.category,
                amount: parseFloat(tx.amount),
                date: tx.date || tx.created_at,
                notes: tx.notes,
                pct: Math.floor(Math.random() * 70) + 20
            }));
        }
    });

    // Create Transaction Mutation
    const createMutation = useMutation({
        mutationFn: (newTx) => transactionsService.createTransaction(newTx),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            closeModal();
        },
        onError: (err) => {
            setFormError(err.message || 'Failed to save transaction.');
        }
    });

    // Delete Transaction Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => transactionsService.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openModal = (type) => {
        setModalType(type);
        setFormData(EMPTY_FORM);
        setFormError('');
        setIsAddMenuOpen(false);
    };

    const closeModal = () => {
        setModalType(null);
        setFormError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.category || !formData.amount || !formData.date) {
            setFormError('Source, category, amount and date are required.');
            return;
        }

        const newTransaction = {
            type: modalType === 'income' ? 'Income' : 'Expense',
            title: formData.title,
            category: formData.category,
            amount: parseFloat(formData.amount),
            date: formData.date,
            notes: formData.notes,
        };

        createMutation.mutate(newTransaction);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            deleteMutation.mutate(id);
        }
    };

    const totalIncome  = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const netBalance   = totalIncome - totalExpense;

    const filtered = transactions.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getIcon = (category) => ICON_MAP[category] || ICON_MAP.Default;

    return (
        <div className="transactions-page page-fade-in">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <p className="page-subtitle">Track and manage your financial activity</p>
                </div>

                {/* Dropdown menu */}
                <div className="action-menu-container" ref={menuRef}>
                    <button
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                        className={`btn-primary ${isAddMenuOpen ? 'active' : ''}`}
                    >
                        <Plus size={18} />
                        <span>Record Transaction</span>
                        <ChevronDown size={16} className={`chevron-icon ${isAddMenuOpen ? 'rotate' : ''}`} />
                    </button>

                    {isAddMenuOpen && (
                        <div className="dropdown-menu animate-scale-in">
                            <button className="dropdown-item" onClick={() => openModal('income')}>
                                <div className="icon-box bg-green">
                                    <TrendingUp size={16} />
                                </div>
                                <div className="dropdown-text">
                                    <span className="item-title">Add Income</span>
                                    <span className="item-desc">Salary, Freelance...</span>
                                </div>
                            </button>
                            <button className="dropdown-item" onClick={() => openModal('expense')}>
                                <div className="icon-box bg-red">
                                    <TrendingDown size={16} />
                                </div>
                                <div className="dropdown-text">
                                    <span className="item-title">Add Expense</span>
                                    <span className="item-desc">Bills, Food, Shop...</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard label="Total Income"   value={formatCurrency(totalIncome)}  subtext="Actual • This Month" icon={TrendingUp}   colorClass="stat-green" />
                <StatCard label="Total Expenses" value={formatCurrency(totalExpense)} subtext="Actual • This Month" icon={TrendingDown}  colorClass="stat-red"   />
                <StatCard label="Net Balance"    value={formatCurrency(netBalance)}   subtext="Cash Flow Status"   icon={IndianRupee}  colorClass="stat-blue"  />
            </div>

            {/* Transactions Table */}
            <div className="transactions-container">
                {/* Toolbar */}
                <div className="toolbar-section">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-actions">
                        <button className="btn-secondary">
                            <Filter size={16} />
                            <span>Filter</span>
                        </button>
                        <button className="btn-secondary">
                            <Calendar size={16} />
                            <span>This Month</span>
                        </button>
                    </div>
                </div>

                <div className="transactions-table-container">
                    <div className="table-header-row">
                        <div className="table-title">
                            <Filter size={18} />
                            <span>List of Transactions</span>
                        </div>
                        <span className="see-all-link">See All</span>
                    </div>

                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th className="checkbox-col"></th>
                                <th>APPLICATION</th>
                                <th>TYPE</th>
                                <th>RATE</th>
                                <th style={{ textAlign: 'right' }}>AMOUNT</th>
                                <th style={{ textAlign: 'center' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item) => {
                                const ItemIcon = getIcon(item.category);
                                return (
                                    <tr key={item.id} className="table-row-card">
                                        <td><div className="custom-checkbox" /></td>
                                        <td className="app-col">
                                            <div className="app-info">
                                                <div className="app-icon-box"><ItemIcon size={20} /></div>
                                                <span className="app-name">{item.title}</span>
                                            </div>
                                        </td>
                                        <td className="type-col">{item.category}</td>
                                        <td className="rate-col">
                                            <div className="rate-wrapper">
                                                <div className="progress-track">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${item.pct}%`, background: item.type === 'Income' ? '#4F46E5' : '#10B981' }}
                                                    />
                                                </div>
                                                <span className="rate-text">{item.pct}%</span>
                                            </div>
                                        </td>
                                        <td className="profit-col">
                                            <span style={{ color: item.type === 'Income' ? '#10B981' : '#1e293b' }}>
                                                {item.type === 'Expense' ? '-' : ''}{formatCurrency(item.amount)}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="icon-btn hover-red"
                                                title="Delete"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination-bar">
                    <span className="page-info">Showing {filtered.length} entries</span>
                    <div className="page-controls">
                        <button className="btn-page" disabled>Previous</button>
                        <button className="btn-page">Next</button>
                    </div>
                </div>
            </div>

            {/* ── Add Transaction Modal ── */}
            <AnimatePresence>
                {modalType && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    {modalType === 'income' ? 'Add Income' : 'Add Expense'}
                                </h2>
                                <button className="modal-close-btn" onClick={closeModal}>
                                    <X size={16} />
                                </button>
                            </div>

                            <form className="modal-form" onSubmit={handleSubmit}>
                                <div className="modal-field">
                                    <label className="modal-label">
                                        {modalType === 'income' ? 'Source Name' : 'Expense Name'}
                                    </label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder={modalType === 'income' ? 'e.g. Salary, Freelance' : 'e.g. Rent, Groceries'}
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Category</label>
                                    <select
                                        className="modal-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select a category</option>
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label className="modal-label">Amount (₹)</label>
                                        <input
                                            type="number"
                                            className="modal-input"
                                            placeholder="0"
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-field">
                                        <label className="modal-label">Date</label>
                                        <input
                                            type="date"
                                            className="modal-input"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Notes (optional)</label>
                                    <textarea
                                        className="modal-textarea"
                                        placeholder="Additional details..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                {formError && <p className="modal-error">{formError}</p>}

                                <div className="modal-footer">
                                    <button type="button" className="modal-btn-cancel" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="modal-btn-submit">
                                        {modalType === 'income' ? 'Save Income' : 'Save Expense'}
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

export default Transactions;
