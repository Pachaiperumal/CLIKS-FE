import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus,
    Minus,
    Home,
    Zap,
    Briefcase,
    TrendingUp,
    TrendingDown,
    ArrowLeftRight,
    X,
    PieChart,
    Calendar,
    Wallet,
    CreditCard,
    BarChart3,
    Activity,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    accountsService, 
    transactionsService, 
    plannedPaymentsService 
} from '../services';
import '../App.css';
import '../styles/modals.css';
import '../styles/finance-dashboard.css';
import BudgetMixTile from '../components/dashboard/BudgetMixTile';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const INCOME_CATEGORIES  = ['Employment', 'Business', 'Freelance', 'Investment', 'Rental', 'Other'];
const EXPENSE_CATEGORIES = ['Food & Drinks', 'Housing', 'Transport', 'Healthcare', 'Shopping', 'Entertainment', 'Utilities', 'Other'];
const ACCOUNTS           = ['Checking', 'Savings', 'Credit Card', 'Investment'];

const EMPTY_INCOME   = { title: '', category: '', amount: '', date: '', notes: '' };
const EMPTY_EXPENSE  = { title: '', category: '', amount: '', date: '', notes: '' };
const EMPTY_TRANSFER = { from: 'Checking', to: 'Savings', amount: '', date: '', notes: '' };

// Widget catalogue
const WIDGET_CATALOGUE = [
    { type: 'recentActivity',  label: 'Recent Activity',  desc: 'Latest transactions',     Icon: Activity    },
    { type: 'budgetsOverview', label: 'Budgets Overview', desc: 'Spend vs. plan',           Icon: PieChart    },
    { type: 'upcomingBills',   label: 'Upcoming Bills',   desc: 'Bills due soon',           Icon: Calendar    },
    { type: 'totalLiquidity',  label: 'Total Liquidity',  desc: 'Cash on hand',             Icon: Wallet      },
    { type: 'accountsSummary', label: 'Accounts Summary', desc: 'All linked accounts',      Icon: CreditCard  },
    { type: 'spendingChart',   label: 'Spending Chart',   desc: 'Weekly spending bars',     Icon: BarChart3   },
];

// Random accent colors for accounts summary
const ACC_COLORS = ['#195BAC', '#10B981', '#8B5CF6', '#F97316'];

// ─────────────────────────────────────────────
//  Modal animation variant (shared)
// ─────────────────────────────────────────────
const MODAL_ANIM = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
};

// ─────────────────────────────────────────────
//  Small helper widgets rendered dynamically
// ─────────────────────────────────────────────
const SpendingChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const base  = [45, 30, 60, 20, 80, 55, 35];
    const max   = Math.max(...base);
    return (
        <div className="fd-chart-bars">
            {days.map((d, i) => (
                <div key={d} className="fd-bar-col">
                    <div className="fd-bar" style={{ height: `${(base[i] / max) * 70}px` }} />
                    <span className="fd-bar-label">{d}</span>
                </div>
            ))}
        </div>
    );
};

const AccountsSummary = () => {
    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: accountsService.getAccounts
    });

    if (isLoading) return <p className="fd-entry-sub">Loading accounts...</p>;
    if (accounts.length === 0) return <p className="fd-entry-sub">No accounts found.</p>;

    return (
        <div>
            {accounts.slice(0, 4).map((a, i) => (
                <div key={a.id} className="fd-acc-row">
                    <div className="fd-acc-dot" style={{ background: a.color || ACC_COLORS[i % ACC_COLORS.length] }} />
                    <span className="fd-acc-name">{a.name}</span>
                    <span className="fd-acc-bal">
                        {a.currency === 'INR' ? '₹' : '$'}
                        {Number(a.balance).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
};

const UpcomingBillsWidget = () => {
    const { data: bills = [], isLoading: billsLoading } = useQuery({
        queryKey: ['planned-payments'],
        queryFn: plannedPaymentsService.getPlannedPayments
    });

    if (billsLoading) return <p className="fd-entry-sub">Loading bills...</p>;
    
    return (
        <div className="bills-list">
            {bills.length === 0 ? (
                <p className="fd-entry-sub">No upcoming bills found.</p>
            ) : (
                bills.slice(0, 3).map((b) => (
                    <div key={b.id} className="bill-item">
                        <div className="bill-icon bg-blue-100 text-blue-600">
                            {b.category === 'Housing' ? <Home size={18} /> : 
                             b.category === 'Utilities' ? <Zap size={18} /> : 
                             <Calendar size={18} />}
                        </div>
                        <div className="bill-details">
                            <span className="bill-name">{b.name}</span>
                            <span className="bill-date">{new Date(b.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="bill-action">
                            <span className="bill-amount">${Number(b.amount).toLocaleString()}</span>
                            <button className="btn-pay">Pay Now</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
//  Render a dynamic widget by type
// ─────────────────────────────────────────────
const DynamicWidget = ({ widget, records, onRemove }) => {
    const { type, id } = widget;

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: accountsService.getAccounts
    });

    const liquidity = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const getTitle = () => WIDGET_CATALOGUE.find(w => w.type === type)?.label || '';

    const renderContent = () => {
        switch (type) {
            case 'recentActivity': {
                return records.length === 0 ? (
                    <p className="fd-entry-sub">No records yet. Use "+ Record" to add one.</p>
                ) : (
                    records.slice(0, 4).map((r) => (
                        <div key={r.id} className="fd-new-entry">
                            <div className={`fd-entry-icon fd-entry-icon--${r.type}`}>
                                {r.type === 'income'   && <TrendingUp  size={16} />}
                                {r.type === 'expense'  && <TrendingDown size={16} />}
                                {r.type === 'transfer' && <ArrowLeftRight size={16} />}
                            </div>
                            <div className="fd-entry-info">
                                <div className="fd-entry-title">{r.title || `${r.from} → ${r.to}`}</div>
                                <div className="fd-entry-sub">{r.category || `${r.from} → ${r.to}`} • {r.date}</div>
                            </div>
                            <span className={`fd-entry-amount fd-entry-amount--${r.type}`}>
                                {r.type === 'income' ? '+' : r.type === 'expense' ? '-' : ''}
                                ${Number(r.amount).toLocaleString()}
                            </span>
                        </div>
                    ))
                );
            }
            case 'budgetsOverview': {
                return <BudgetMixTile />;
            }
            case 'upcomingBills': {
                return <UpcomingBillsWidget />;
            }
            case 'totalLiquidity': {
                return (
                    <div className="fd-liquidity-widget">
                        <span className="fd-liquidity-label">Total Liquidity</span>
                        <span className="fd-liquidity-amount">${liquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <div className="liquidity-trend">
                            <TrendingUp size={14} />
                            <span>Live · updates with records</span>
                        </div>
                    </div>
                );
            }
            case 'accountsSummary': {
                return <AccountsSummary />;
            }
            case 'spendingChart': {
                return <SpendingChart />;
            }
            default:
                return null;
        }
    };

    if (type === 'totalLiquidity') {
        return (
            <motion.div key={id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="fd-liquidity-widget" style={{ position: 'relative' }}>
                    <button className="fd-widget-remove-btn" style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => onRemove(id)}>
                        <X size={14} />
                    </button>
                    <span className="fd-liquidity-label">Total Liquidity</span>
                    <span className="fd-liquidity-amount" style={{ fontSize: '2rem', fontWeight: 700 }}>
                        ${liquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="liquidity-trend">
                        <TrendingUp size={14} />
                        <span>Live · updates with records</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div key={id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="fd-widget-tile">
                <div className="fd-widget-tile-header">
                    <h3 className="fd-widget-tile-title">{getTitle()}</h3>
                    <button className="fd-widget-remove-btn" onClick={() => onRemove(id)}>
                        <X size={14} />
                    </button>
                </div>
                {renderContent()}
            </div>
        </motion.div>
    );
};

// ─────────────────────────────────────────────
//  Main Finance Dashboard Component
// ─────────────────────────────────────────────
const Finance = () => {
    const [isRecordMenuOpen, setIsRecordMenuOpen] = useState(false);
    const [recordModal, setRecordModal]           = useState(null);
    const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
    const [selectedWidgetType, setSelectedWidgetType] = useState(null);
    const [formError, setFormError]   = useState('');

    const [incomeForm,   setIncomeForm]   = useState(EMPTY_INCOME);
    const [expenseForm,  setExpenseForm]  = useState(EMPTY_EXPENSE);
    const [transferForm, setTransferForm] = useState(EMPTY_TRANSFER);

    const queryClient = useQueryClient();

    const { data: records = [] } = useQuery({
        queryKey: ['transactions'],
        queryFn: transactionsService.getTransactions
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: accountsService.getAccounts
    });

    const { data: bills = [], isLoading: billsLoading } = useQuery({
        queryKey: ['planned-payments'],
        queryFn: plannedPaymentsService.getPlannedPayments
    });

    const addTransactionMutation = useMutation({
        mutationFn: transactionsService.createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            closeModal();
        },
        onError: (err) => {
            setFormError(err.message || 'Failed to add record');
        }
    });

    const [widgets, setWidgets] = useState(() => {
        const saved = localStorage.getItem('fd_widgets');
        return saved ? JSON.parse(saved) : [];
    });

    const recordMenuRef = useRef(null);

    useEffect(() => { localStorage.setItem('fd_widgets', JSON.stringify(widgets)); }, [widgets]);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (recordMenuRef.current && !recordMenuRef.current.contains(e.target)) {
                setIsRecordMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const openRecordModal = (type) => {
        setRecordModal(type);
        setIsRecordMenuOpen(false);
        setFormError('');
        setIncomeForm(EMPTY_INCOME);
        setExpenseForm(EMPTY_EXPENSE);
        setTransferForm(EMPTY_TRANSFER);
    };

    const closeModal = () => { setRecordModal(null); setFormError(''); };

    const addRecord = (newRecord) => {
        addTransactionMutation.mutate(newRecord);
    };

    const handleIncomeSubmit = (e) => {
        e.preventDefault();
        if (!incomeForm.title || !incomeForm.category || !incomeForm.amount || !incomeForm.date) {
            setFormError('Source, category, amount and date are required.'); return;
        }
        addRecord({ id: Date.now(), type: 'income', title: incomeForm.title, category: incomeForm.category, amount: parseFloat(incomeForm.amount), date: incomeForm.date, notes: incomeForm.notes });
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        if (!expenseForm.title || !expenseForm.category || !expenseForm.amount || !expenseForm.date) {
            setFormError('Name, category, amount and date are required.'); return;
        }
        addRecord({ id: Date.now(), type: 'expense', title: expenseForm.title, category: expenseForm.category, amount: parseFloat(expenseForm.amount), date: expenseForm.date, notes: expenseForm.notes });
    };

    const handleTransferSubmit = (e) => {
        e.preventDefault();
        if (!transferForm.amount || !transferForm.date || transferForm.from === transferForm.to) {
            setFormError('Amount, date required and From/To must differ.'); return;
        }
        addRecord({ id: Date.now(), type: 'transfer', from: transferForm.from, to: transferForm.to, amount: parseFloat(transferForm.amount), date: transferForm.date, notes: transferForm.notes });
    };

    const handleAddWidget = () => {
        if (!selectedWidgetType) return;
        const alreadyAdded = widgets.some(w => w.type === selectedWidgetType);
        if (alreadyAdded) { setIsWidgetModalOpen(false); return; }
        setWidgets((prev) => [...prev, { id: Date.now(), type: selectedWidgetType }]);
        setIsWidgetModalOpen(false);
        setSelectedWidgetType(null);
    };

    const removeWidget = (id) => setWidgets((prev) => prev.filter(w => w.id !== id));

    const liquidity = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const recentRecords = records.slice(0, 3);

    return (
        <>
            <div className="dashboard-header">
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => { setSelectedWidgetType(null); setIsWidgetModalOpen(true); }}>
                        <Plus size={16} />
                        <span>Add Widget</span>
                    </button>

                    <div className="fd-record-menu-wrap" ref={recordMenuRef}>
                        <button className="btn-success" onClick={() => setIsRecordMenuOpen(!isRecordMenuOpen)}>
                            <Plus size={16} />
                            <span>Record</span>
                        </button>

                        <AnimatePresence>
                            {isRecordMenuOpen && (
                                <motion.div
                                    className="fd-record-dropdown"
                                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <button className="fd-record-item" onClick={() => openRecordModal('income')}>
                                        <div className="fd-record-icon fd-record-icon--green"><TrendingUp size={16} /></div>
                                        <div className="fd-record-text">
                                            <span className="fd-record-title">Record Income</span>
                                            <span className="fd-record-desc">Salary, freelance…</span>
                                        </div>
                                    </button>
                                    <button className="fd-record-item" onClick={() => openRecordModal('expense')}>
                                        <div className="fd-record-icon fd-record-icon--red"><TrendingDown size={16} /></div>
                                        <div className="fd-record-text">
                                            <span className="fd-record-title">Record Expense</span>
                                            <span className="fd-record-desc">Bills, food, shopping…</span>
                                        </div>
                                    </button>
                                    <button className="fd-record-item" onClick={() => openRecordModal('transfer')}>
                                        <div className="fd-record-icon fd-record-icon--blue"><ArrowLeftRight size={16} /></div>
                                        <div className="fd-record-text">
                                            <span className="fd-record-title">Record Transfer</span>
                                            <span className="fd-record-desc">Between accounts</span>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="books-dashboard-container">
                <div className="bento-grid">
                    <div className="bento-col-left">
                        <div className="bento-tile recent-activity-tile">
                            <div className="tile-header-row">
                                <h2 className="tile-heading">Recent Activity</h2>
                                <div className="header-actions">
                                    <button className="btn-action primary" onClick={() => openRecordModal('income')}>
                                        <Plus size={16} />
                                        <span>Add Income</span>
                                    </button>
                                    <button className="btn-action secondary" onClick={() => openRecordModal('expense')}>
                                        <Minus size={16} className="text-blue-500" />
                                        <span>Expense</span>
                                    </button>
                                </div>
                            </div>

                            <div className="activity-list">
                                {recentRecords.map((r) => (
                                    <div key={r.id} className="activity-item">
                                        <div className={`activity-icon ${
                                            r.type === 'income'   ? 'bg-green-100 text-green-600'  :
                                            r.type === 'transfer' ? 'bg-blue-100 text-blue-600'    :
                                                                    'bg-orange-100 text-orange-600'
                                        }`}>
                                            {r.type === 'income'   && <Briefcase size={20} />}
                                            {r.type === 'expense'  && <Home size={20} />}
                                            {r.type === 'transfer' && <ArrowLeftRight size={20} />}
                                        </div>
                                        <div className="activity-details">
                                            <span className="activity-name">{r.title || `${r.from} → ${r.to}`}</span>
                                            <span className="activity-meta">{r.category || `Transfer ${r.from}→${r.to}`} • {r.date}</span>
                                        </div>
                                        <span className={`activity-amount ${r.type === 'income' ? 'positive' : 'negative'}`}>
                                            {r.type === 'income' ? '+' : r.type === 'expense' ? '-' : ''} ${Number(r.amount).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                {recentRecords.length === 0 && (
                                    <div className="activity-item" style={{ justifyContent: 'center', opacity: 0.6 }}>
                                        <div className="activity-details" style={{ textAlign: 'center' }}>
                                            <span className="activity-name">No recent activity</span>
                                            <span className="activity-meta">Add a record to get started</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bento-tile budgets-tile">
                            <div className="tile-header-row" style={{ marginBottom: '1rem' }}>
                                <h2 className="tile-heading">Budgets</h2>
                            </div>
                            <BudgetMixTile />
                        </div>
                    </div>

                    <div className="bento-col-right">
                        <div className="bento-tile liquidity-card">
                            <span className="liquidity-label">Total Liquidity</span>
                            <h1 className="liquidity-amount">
                                ${liquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h1>
                            <div className="liquidity-trend">
                                <TrendingUp size={16} />
                                <span>Updates with your records</span>
                            </div>
                        </div>

                        <div className="bento-tile bills-tile">
                            <h2 className="tile-heading">Upcoming Bills</h2>
                            <div className="bills-list">
                                {billsLoading ? (
                                    <p className="fd-entry-sub">Loading bills...</p>
                                ) : bills.length === 0 ? (
                                    <p className="fd-entry-sub">No upcoming bills found.</p>
                                ) : (
                                    bills.slice(0, 3).map((b) => (
                                        <div key={b.id} className="bill-item">
                                            <div className="bill-icon bg-blue-100 text-blue-600">
                                                {b.category === 'Housing' ? <Home size={18} /> : 
                                                 b.category === 'Utilities' ? <Zap size={18} /> : 
                                                 <Calendar size={18} />}
                                            </div>
                                            <div className="bill-details">
                                                <span className="bill-name">{b.name}</span>
                                                <span className="bill-date">{new Date(b.due_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="bill-action">
                                                <span className="bill-amount">${Number(b.amount).toLocaleString()}</span>
                                                <button className="btn-pay">Pay Now</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="financial-tip-box">
                                <span className="tip-label">Financial Tip</span>
                                <p className="tip-text">
                                    Keeping track of your upcoming bills helps you avoid late fees and maintain a healthy credit score.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {widgets.length > 0 && (
                        <motion.div
                            className="fd-extra-widgets"
                            style={{ marginTop: '1.5rem' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {widgets.map((w) => (
                                <DynamicWidget key={w.id} widget={w} records={records} onRemove={removeWidget} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isWidgetModalOpen && (
                    <div className="modal-overlay">
                        <motion.div className="modal-card" style={{ maxWidth: '540px' }} {...MODAL_ANIM}>
                            <div className="modal-header">
                                <h2 className="modal-title">Add Widget</h2>
                                <button className="modal-close-btn" onClick={() => setIsWidgetModalOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="modal-label" style={{ marginBottom: '0.75rem' }}>
                                Choose a widget to add to your dashboard
                            </p>

                            <div className="fd-widget-grid">
                                {WIDGET_CATALOGUE.map(({ type, label, desc, Icon }) => {
                                    const alreadyAdded = widgets.some(w => w.type === type);
                                    return (
                                        <button
                                            key={type}
                                            className={`fd-widget-option ${selectedWidgetType === type ? 'selected' : ''} ${alreadyAdded ? 'disabled' : ''}`}
                                            onClick={() => !alreadyAdded && setSelectedWidgetType(type)}
                                            disabled={alreadyAdded}
                                            style={alreadyAdded ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                                        >
                                            <div className="fd-widget-opt-icon"><Icon size={18} /></div>
                                            <div className="fd-widget-opt-name">{label}</div>
                                            <div className="fd-widget-opt-desc">{alreadyAdded ? 'Already added' : desc}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
                                <button className="modal-btn-cancel" onClick={() => setIsWidgetModalOpen(false)}>Cancel</button>
                                <button
                                    className="modal-btn-submit"
                                    onClick={handleAddWidget}
                                    disabled={!selectedWidgetType}
                                    style={!selectedWidgetType ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                >
                                    Add Widget
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {recordModal === 'income' && (
                    <div className="modal-overlay">
                        <motion.div className="modal-card" {...MODAL_ANIM}>
                            <div className="modal-header">
                                <h2 className="modal-title">Record Income</h2>
                                <button className="modal-close-btn" onClick={closeModal}><X size={16} /></button>
                            </div>
                            <form className="modal-form" onSubmit={handleIncomeSubmit}>
                                <div className="modal-field">
                                    <label className="modal-label">Source</label>
                                    <input type="text" className="modal-input" placeholder="e.g. Freelance Payment"
                                        value={incomeForm.title}
                                        onChange={e => setIncomeForm({ ...incomeForm, title: e.target.value })} />
                                </div>
                                <div className="modal-field">
                                    <label className="modal-label">Category</label>
                                    <select className="modal-select" value={incomeForm.category}
                                        onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })}>
                                        <option value="">Select category</option>
                                        {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label className="modal-label">Amount ($)</label>
                                        <input type="number" min="0" className="modal-input" placeholder="0"
                                            value={incomeForm.amount}
                                            onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
                                    </div>
                                    <div className="modal-field">
                                        <label className="modal-label">Date</label>
                                        <input type="date" className="modal-input"
                                            value={incomeForm.date}
                                            onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-field">
                                    <label className="modal-label">Notes (optional)</label>
                                    <textarea className="modal-textarea" placeholder="Any details..."
                                        value={incomeForm.notes}
                                        onChange={e => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
                                </div>
                                {formError && <p className="modal-error">{formError}</p>}
                                <div className="modal-footer">
                                    <button type="button" className="modal-btn-cancel" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="modal-btn-submit">Save Income</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {recordModal === 'expense' && (
                    <div className="modal-overlay">
                        <motion.div className="modal-card" {...MODAL_ANIM}>
                            <div className="modal-header">
                                <h2 className="modal-title">Record Expense</h2>
                                <button className="modal-close-btn" onClick={closeModal}><X size={16} /></button>
                            </div>
                            <form className="modal-form" onSubmit={handleExpenseSubmit}>
                                <div className="modal-field">
                                    <label className="modal-label">Expense Name</label>
                                    <input type="text" className="modal-input" placeholder="e.g. Starbucks Coffee"
                                        value={expenseForm.title}
                                        onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} />
                                </div>
                                <div className="modal-field">
                                    <label className="modal-label">Category</label>
                                    <select className="modal-select" value={expenseForm.category}
                                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                        <option value="">Select category</option>
                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label className="modal-label">Amount ($)</label>
                                        <input type="number" min="0" step="0.01" className="modal-input" placeholder="0.00"
                                            value={expenseForm.amount}
                                            onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                                    </div>
                                    <div className="modal-field">
                                        <label className="modal-label">Date</label>
                                        <input type="date" className="modal-input"
                                            value={expenseForm.date}
                                            onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-field">
                                    <label className="modal-label">Notes (optional)</label>
                                    <textarea className="modal-textarea" placeholder="Any details..."
                                        value={expenseForm.notes}
                                        onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
                                </div>
                                {formError && <p className="modal-error">{formError}</p>}
                                <div className="modal-footer">
                                    <button type="button" className="modal-btn-cancel" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="modal-btn-submit">Save Expense</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {recordModal === 'transfer' && (
                    <div className="modal-overlay">
                        <motion.div className="modal-card" {...MODAL_ANIM}>
                            <div className="modal-header">
                                <h2 className="modal-title">Record Transfer</h2>
                                <button className="modal-close-btn" onClick={closeModal}><X size={16} /></button>
                            </div>
                            <form className="modal-form" onSubmit={handleTransferSubmit}>
                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label className="modal-label">From Account</label>
                                        <select className="modal-select" value={transferForm.from}
                                            onChange={e => setTransferForm({ ...transferForm, from: e.target.value })}>
                                            {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="modal-field">
                                        <label className="modal-label">To Account</label>
                                        <select className="modal-select" value={transferForm.to}
                                            onChange={e => setTransferForm({ ...transferForm, to: e.target.value })}>
                                            {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label className="modal-label">Amount ($)</label>
                                        <input type="number" min="0" step="0.01" className="modal-input" placeholder="0.00"
                                            value={transferForm.amount}
                                            onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} />
                                    </div>
                                    <div className="modal-field">
                                        <label className="modal-label">Date</label>
                                        <input type="date" className="modal-input"
                                            value={transferForm.date}
                                            onChange={e => setTransferForm({ ...transferForm, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-field">
                                    <label className="modal-label">Notes (optional)</label>
                                    <textarea className="modal-textarea" placeholder="Reason for transfer..."
                                        value={transferForm.notes}
                                        onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })} />
                                </div>
                                {formError && <p className="modal-error">{formError}</p>}
                                <div className="modal-footer">
                                    <button type="button" className="modal-btn-cancel" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="modal-btn-submit">Save Transfer</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Finance;
