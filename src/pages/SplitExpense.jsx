import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { splitExpenseService } from '../services/splitExpenseService';
import EmptyState from '../components/common/EmptyState';
import {
    Plus,
    Search,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2,
    RefreshCw,
    Users,
    Receipt,
    Calendar,
    ChevronRight,
    CheckCircle2,
    History,
    Percent,
    Hash,
    PieChart,
    ShoppingCart,
    Wallet,
    X
} from 'lucide-react';

const SplitExpense = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('ALL FRIENDS'); // ALL FRIENDS, RECENT EXPENSES
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [splitType, setSplitType] = useState('equal');
    
    const [formData, setFormData] = useState({ 
        title: '', 
        amount: '', 
        paidBy: 'You', 
        date: new Date().toISOString().split('T')[0],
        participants: [] 
    });
    
    const [items, setItems] = useState([{ id: 1, name: '', amount: '', assignedTo: [] }]);
    const [formError, setFormError] = useState('');

    // ── Queries ─────────────────────────────────────────────────────────────
    
    // Friends Summary
    const { 
        data: summaryResponse, 
        isLoading: isSummaryLoading, 
        isError: isSummaryError,
        refetch: refetchSummary 
    } = useQuery({
        queryKey: ['split-summary'],
        queryFn: () => splitExpenseService.getSummary(),
    });

    // All Expenses List
    const {
        data: expensesResponse,
        isLoading: isExpensesLoading,
        refetch: refetchExpenses
    } = useQuery({
        queryKey: ['split-expenses-list'],
        queryFn: () => splitExpenseService.getSplits(),
        enabled: activeTab === 'RECENT EXPENSES'
    });

    const friends = useMemo(() => {
        const rawData = summaryResponse?.data !== undefined ? summaryResponse.data : summaryResponse;
        return Array.isArray(rawData) ? rawData : [];
    }, [summaryResponse]);

    const expenses = useMemo(() => {
        const rawData = expensesResponse?.data !== undefined ? expensesResponse.data : expensesResponse;
        return Array.isArray(rawData) ? rawData : [];
    }, [expensesResponse]);

    // ── Mutations ───────────────────────────────────────────────────────────
    
    const createMutation = useMutation({
        mutationFn: (newSplit) => splitExpenseService.createSplit(newSplit),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['split-summary'] });
            queryClient.invalidateQueries({ queryKey: ['split-expenses-list'] });
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error) => {
            setFormError(error.message || 'Failed to create split');
        }
    });

    const settleMutation = useMutation({
        mutationFn: (name) => splitExpenseService.settleFriend(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['split-summary'] });
            queryClient.invalidateQueries({ queryKey: ['split-expenses-list'] });
        }
    });

    // ── Logic ──────────────────────────────────────────────────────────────

    const calculateSplits = () => {
        const totalAmount = parseFloat(formData.amount) || 0;
        const participants = formData.participants;
        if (participants.length === 0) return [];

        let results = [];

        if (splitType === 'equal') {
            const count = participants.length + 1;
            const share = totalAmount / count;
            results = participants.map(p => ({ ...p, share_amount: share }));
            results.push({ name: 'You', share_amount: share, isSelf: true });
        } 
        else if (splitType === 'exact') {
            results = participants.map(p => ({ ...p, share_amount: parseFloat(p.value) || 0 }));
            const sumOthers = results.reduce((s, p) => s + p.share_amount, 0);
            results.push({ name: 'You', share_amount: totalAmount - sumOthers, isSelf: true });
        } 
        else if (splitType === 'percentage') {
            results = participants.map(p => ({ ...p, share_amount: (parseFloat(p.value) / 100) * totalAmount }));
            const sumPctOthers = participants.reduce((s, p) => s + (parseFloat(p.value) || 0), 0);
            results.push({ name: 'You', share_amount: ((100 - sumPctOthers) / 100) * totalAmount, isSelf: true });
        } 
        else if (splitType === 'shares') {
            const sumSharesOthers = participants.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0);
            const totalShares = sumSharesOthers + 1;
            results = participants.map(p => ({ ...p, share_amount: ((parseFloat(p.value) || 0) / totalShares) * totalAmount }));
            results.push({ name: 'You', share_amount: (1 / totalShares) * totalAmount, isSelf: true });
        }
        else if (splitType === 'items') {
            const participantMap = {};
            participants.forEach(p => participantMap[p.name] = 0);
            participantMap['You'] = 0;
            
            items.forEach(item => {
                const itemAmt = parseFloat(item.amount) || 0;
                const shareCount = item.assignedTo.length;
                if (shareCount > 0) {
                    const share = itemAmt / shareCount;
                    item.assignedTo.forEach(name => {
                        if (participantMap[name] !== undefined) participantMap[name] += share;
                    });
                }
            });
            results = participants.map(p => ({ ...p, share_amount: participantMap[p.name] || 0 }));
            results.push({ name: 'You', share_amount: participantMap['You'] || 0, isSelf: true });
        }

        return results;
    };

    const handleAddSplit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.amount || !formData.date) {
            setFormError('Basic details (Title, Amount, Date) are required');
            return;
        }

        const calculated = calculateSplits();
        const finalParticipants = calculated.filter(p => !p.isSelf);
        
        if (finalParticipants.length === 0) {
            setFormError('Add at least one participant to split with');
            return;
        }

        const payload = {
            title: formData.title,
            total_amount: parseFloat(formData.amount),
            date: formData.date,
            split_type: splitType,
            paid_by: formData.paidBy,
            participants: finalParticipants.map(p => ({
                name: p.name,
                share_amount: p.share_amount
            }))
        };

        createMutation.mutate(payload);
    };

    const resetForm = () => {
        setFormData({ title: '', amount: '', paidBy: 'You', date: new Date().toISOString().split('T')[0], participants: [] });
        setItems([{ id: 1, name: '', amount: '', assignedTo: [] }]);
        setSplitType('equal');
        setFormError('');
    };

    const addParticipantField = () => {
        setFormData({ ...formData, participants: [...formData.participants, { name: '', value: '' }] });
    };

    const updateParticipant = (index, field, value) => {
        const newParticipants = [...formData.participants];
        newParticipants[index][field] = value;
        setFormData({ ...formData, participants: newParticipants });
    };

    const removeParticipant = (index) => {
        setFormData({ ...formData, participants: formData.participants.filter((_, i) => i !== index) });
    };

    const addItemField = () => {
        setItems([...items, { id: Date.now(), name: '', amount: '', assignedTo: [] }]);
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const toggleItemParticipant = (itemId, personName) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const assigned = item.assignedTo.includes(personName)
                    ? item.assignedTo.filter(n => n !== personName)
                    : [...item.assignedTo, personName];
                return { ...item, assignedTo: assigned };
            }
            return item;
        }));
    };

    const openExpenseDetail = async (expense) => {
        try {
            const detail = await splitExpenseService.getSplitById(expense.id);
            setSelectedExpense(detail.data || detail);
        } catch (err) {
            console.error('Failed to fetch expense details', err);
        }
    };

    const totalOwesYou = friends.reduce((sum, f) => sum + (f.total_owed || 0), 0);
    const totalYouOwe = 0; 

    const filteredFriends = friends.filter(f => 
        (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredExpenses = expenses.filter(e =>
        (e.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const calculatedPreview = useMemo(() => calculateSplits(), [formData, splitType, items]);

    return (
        <div className="split-page">
            <style>{styles}</style>
            <div className="split-header-row">
                <div>
                    <h1 className="page-title">Split Expenses</h1>
                    <p className="page-subtitle">Track by People or by Trip Details</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-refresh" onClick={() => activeTab === 'ALL FRIENDS' ? refetchSummary() : refetchExpenses()}>
                        <RefreshCw size={18} className={(isSummaryLoading || isExpensesLoading) ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn-new-split" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        <span>New Expense</span>
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-label-row text-green">
                        <ArrowDownLeft size={18} />
                        <span>TOTAL RECEIVABLE</span>
                    </div>
                    <div className="stat-value">₹{totalOwesYou.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="stat-trend text-green">
                        <TrendingUp size={16} />
                        <span>Across {friends.length} people</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label-row text-orange">
                        <ArrowUpRight size={18} />
                        <span>TOTAL PAYABLE</span>
                    </div>
                    <div className="stat-value">₹{totalYouOwe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="stat-trend text-orange">
                        <TrendingDown size={16} />
                        <span>No pending debts</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">Recent Activity</span>
                        <span className="text-sm font-bold text-blue-600">{expenses.length} Splits</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(expenses.length * 10, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="controls-row">
                <div className="tabs-group">
                    {['ALL FRIENDS', 'RECENT EXPENSES'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'ALL FRIENDS' ? 'people' : 'expenses'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            {activeTab === 'ALL FRIENDS' ? (
                isSummaryLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
                        <p className="font-medium">Fetching balances...</p>
                    </div>
                ) : filteredFriends.length === 0 ? (
                    <EmptyState title="No Friends Found" description="Start a new split to see people listed here." />
                ) : (
                    <div className="main-grid">
                        {filteredFriends.map(friend => (
                            <div key={friend.name} className="friend-card">
                                <div className="friend-header">
                                    <div className="friend-avatar">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${friend.name}`} alt="avatar" />
                                    </div>
                                    <div className="friend-info">
                                        <div className="friend-name">{friend.name}</div>
                                        <div className="status-badge">{friend.split_count} Active Splits</div>
                                    </div>
                                </div>
                                <div className="friend-balance-area">
                                    <span className="balance-label">Total Owed to You</span>
                                    <div className="balance-amount text-green">
                                        ₹{(friend.total_owed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="friend-actions">
                                    <button className="btn-action primary-light">Remind</button>
                                    <button className="btn-action outline" onClick={() => settleMutation.mutate(friend.name)}>Settle All</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                isExpensesLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
                        <p className="font-medium">Loading history...</p>
                    </div>
                ) : filteredExpenses.length === 0 ? (
                    <EmptyState title="No Recent Activity" description="Save your first expense to see it here." />
                ) : (
                    <div className="main-grid">
                        {filteredExpenses.map(expense => (
                            <div key={expense.id} className="expense-card" onClick={() => openExpenseDetail(expense)}>
                                <div className="expense-icon-box">
                                    <Receipt size={24} className="text-primary" />
                                </div>
                                <div className="expense-main-info">
                                    <div className="expense-title">{expense.title}</div>
                                    <div className="expense-meta">
                                        <Users size={14} /> 
                                        <span>{expense.participant_count} people • Paid by {expense.paid_by}</span>
                                    </div>
                                    <div className="expense-participants-list">
                                        {expense.participant_names}
                                    </div>
                                </div>
                                <div className="expense-amount-side">
                                    <div className="expense-total">₹{expense.total_amount.toLocaleString('en-IN')}</div>
                                    <div className="expense-date">
                                        <Calendar size={12} />
                                        {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>
                                <div className="expense-arrow">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Expense Detail Modal */}
            <AnimatePresence>
                {selectedExpense && (
                    <div className="modal-overlay" onClick={() => setSelectedExpense(null)}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="modal-content detail-modal" onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">Expense Details</h2>
                                <button className="btn-close" onClick={() => setSelectedExpense(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="detail-body">
                                <div className="detail-header-inner mb-6">
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>{selectedExpense.title}</h3>
                                    <p style={{ fontSize: '0.875rem', color: '#64748B' }}>{new Date(selectedExpense.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
                                </div>

                                <div className="detail-summary-row">
                                    <div className="summary-item">
                                        <label>Total Amount</label>
                                        <div className="val">₹{selectedExpense.total_amount.toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="summary-item">
                                        <label>Paid By</label>
                                        <div className="val">{selectedExpense.paid_by}</div>
                                    </div>
                                    <div className="summary-item">
                                        <label>Split Type</label>
                                        <div className="val capitalize">{selectedExpense.split_type}</div>
                                    </div>
                                </div>

                                <div className="detail-participants-section">
                                    <h3>Breakdown</h3>
                                    <div className="participants-list">
                                        {selectedExpense.participants?.map(p => (
                                            <div key={p.id} className="p-detail-row">
                                                <div className="p-avatar">
                                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.name}`} alt="" />
                                                </div>
                                                <div className="p-name-area">
                                                    <div className="p-name">{p.name}</div>
                                                    <div className="p-status">{p.is_settled ? 'Paid' : 'Pending'}</div>
                                                </div>
                                                <div className="p-amount">₹{p.share_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                {p.is_settled ? <CheckCircle2 size={18} className="text-green" /> : <div className="status-dot"></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setSelectedExpense(null)}>Close</button>
                                <button className="btn-primary">Edit Split</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-content large"
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">New Expense</h2>
                                <button className="btn-close" onClick={() => setIsModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAddSplit} className="modal-form">
                                <div className="modal-scroll-area">
                                    <div className="form-section">
                                        <div className="form-row">
                                            <div className="form-group flex-2">
                                                <label>Description</label>
                                                <input 
                                                    type="text" value={formData.title} 
                                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                                    className="form-input" placeholder="e.g. Dinner, Trip"
                                                />
                                            </div>
                                            <div className="form-group flex-1">
                                                <label>Total Amount (₹)</label>
                                                <input 
                                                    type="number" value={formData.amount} 
                                                    onChange={e => setFormData({...formData, amount: e.target.value})}
                                                    className="form-input highlight" placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group flex-1">
                                                <label>Who Paid?</label>
                                                <select 
                                                    value={formData.paidBy} 
                                                    onChange={e => setFormData({...formData, paidBy: e.target.value})}
                                                    className="form-input"
                                                >
                                                    <option value="You">You</option>
                                                    {formData.participants.map(p => p.name && (
                                                        <option key={p.name} value={p.name}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group flex-1">
                                                <label>Date</label>
                                                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <label className="section-label">Split Method</label>
                                        <div className="type-buttons">
                                            {[
                                                { id: 'equal', label: 'Equally', icon: Users },
                                                { id: 'exact', label: 'Exact', icon: Hash },
                                                { id: 'percentage', label: 'Percent', icon: Percent },
                                                { id: 'shares', label: 'Shares', icon: PieChart },
                                                { id: 'items', label: 'Items', icon: ShoppingCart }
                                            ].map(type => (
                                                <button 
                                                    key={type.id} type="button" 
                                                    className={`type-btn ${splitType === type.id ? 'active' : ''}`} 
                                                    onClick={() => setSplitType(type.id)}
                                                >
                                                    <div className="type-icon-wrapper">
                                                        <type.icon size={20} />
                                                    </div>
                                                    <span className="type-label">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <div className="section-header">
                                            <label className="section-label">Split With</label>
                                            <button type="button" onClick={addParticipantField} className="btn-add-person">
                                                <Plus size={14} /> Add Friend
                                            </button>
                                        </div>
                                        <div className="participant-list">
                                            {formData.participants.map((p, index) => (
                                                <div key={index} className="participant-row">
                                                    <div className="p-avatar-small">
                                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.name || 'default'}`} alt="" />
                                                    </div>
                                                    <input 
                                                        type="text" placeholder="Friend's Name" 
                                                        value={p.name} 
                                                        onChange={e => updateParticipant(index, 'name', e.target.value)} 
                                                        className="form-input flex-2" 
                                                    />
                                                    {splitType !== 'equal' && (
                                                        <input 
                                                            type="number" value={p.value} 
                                                            onChange={e => updateParticipant(index, 'value', e.target.value)} 
                                                            className="form-input flex-1" 
                                                            placeholder={splitType === 'percentage' ? '%' : 'Amount'}
                                                        />
                                                    )}
                                                    <button type="button" onClick={() => removeParticipant(index)} className="btn-remove">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.participants.length === 0 && (
                                                <div className="btn-add-p" onClick={addParticipantField} style={{ border: '2px dashed #E2E8F0', borderRadius: '16px', padding: '20px', textAlign: 'center', cursor: 'pointer', color: '#64748B' }}>
                                                    <Plus size={18} style={{ margin: '0 auto 8px' }} />
                                                    <div style={{ fontWeight: 600 }}>Add someone to split with</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {calculatedPreview.length > 0 && formData.amount > 0 && (
                                        <div className="live-preview-section">
                                            <div className="preview-header">Live Preview</div>
                                            {calculatedPreview.map((p, idx) => (
                                                <div key={idx} className={`preview-row ${p.isSelf ? 'is-self' : ''}`}>
                                                    <span>{p.name}</span>
                                                    <div className="preview-dots"></div>
                                                    <span>₹{p.share_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {formError && <div className="form-error-bubble">{formError}</div>}
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? 'Saving...' : 'Save Expense'}
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

const styles = `
    .split-page { background: #F8FAFC; min-height: 100vh; padding: 2rem 3rem; font-family: 'Inter', sans-serif; }
    .split-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title { font-size: 2rem; font-weight: 800; color: #0F172A; margin: 0; }
    .page-subtitle { color: #64748B; font-size: 0.9rem; }
    
    .btn-refresh { background: white; border: 1px solid #E2E8F0; padding: 10px; border-radius: 50%; cursor: pointer; color: #64748B; transition: all 0.2s; }
    .btn-new-split { background: #195BAC; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 99px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(25, 91, 172, 0.3); }
    .btn-new-split:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(25, 91, 172, 0.4); }
    
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
    .stat-card { background: white; border-radius: 1.25rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #F1F5F9; }
    .stat-label-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem; }
    
    .controls-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 1rem; }
    .tabs-group { display: flex; gap: 2rem; }
    .tab-btn { background: none; border: none; font-size: 0.85rem; font-weight: 700; color: #64748B; cursor: pointer; padding-bottom: 0.5rem; position: relative; }
    .tab-btn.active { color: #195BAC; }
    .tab-btn.active::after { content: ''; position: absolute; bottom: -1rem; left: 0; width: 100%; height: 3px; background: #195BAC; border-radius: 3px; }
    .search-wrapper { background: white; border-radius: 99px; padding: 0.6rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; border: 1px solid #E2E8F0; width: 300px; }
    .search-wrapper input { border: none; outline: none; font-size: 0.9rem; width: 100%; }

    .main-grid { display: flex; flex-direction: column; gap: 1rem; }
    .friend-card { display: flex; align-items: center; background: white; border-radius: 1.25rem; padding: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #F1F5F9; }
    .friend-header { display: flex; align-items: center; gap: 1rem; flex: 1; }
    .friend-avatar { width: 48px; height: 48px; border-radius: 12px; overflow: hidden; background: #E9F4FF; border: 1px solid #D0E2FF; }
    .friend-name { font-weight: 800; color: #0F172A; }
    .status-badge { font-size: 0.7rem; font-weight: 700; color: #195BAC; background: #E9F4FF; padding: 2px 8px; border-radius: 4px; }
    .friend-balance-area { flex: 1; text-align: center; }
    .balance-amount { font-size: 1.5rem; font-weight: 800; }
    
    .expense-card { background: white; border-radius: 1.25rem; padding: 1.25rem; display: flex; align-items: center; gap: 1.5rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border: 1px solid #F1F5F9; }
    .expense-card:hover { transform: translateX(8px); border-left: 4px solid #195BAC; background: #F8FAFC; }
    .expense-icon-box { background: #F1F5F9; width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
    .expense-main-info { flex: 1; }
    .expense-title { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin-bottom: 4px; }
    .expense-meta { font-size: 0.8rem; color: #64748B; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .expense-participants-list { font-size: 0.75rem; color: #94A3B8; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
    .expense-amount-side { text-align: right; min-width: 120px; }
    .expense-total { font-size: 1.25rem; font-weight: 900; color: #0F172A; }
    .expense-date { font-size: 0.75rem; color: #64748B; display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-top: 4px; }
    .expense-arrow { color: #CBD5E1; }

    /* Premium Modal Styles */
    .modal-overlay { 
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(15, 23, 42, 0.4); 
        backdrop-filter: blur(12px); 
        display: flex; align-items: center; justify-content: center; 
        z-index: 1000; 
        padding: 20px;
    }
    .modal-content { 
        background: white; border-radius: 32px; width: 100%; 
        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); 
        position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .modal-content.large { max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; }
    .modal-content.detail-modal { max-width: 500px; }

    .modal-header { 
        padding: 24px 32px; background: #F8FAFC; border-bottom: 1px solid #F1F5F9; 
        display: flex; justify-content: space-between; align-items: center; 
    }
    .modal-title { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0; }
    .btn-close { 
        width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; 
        background: white; border: 1px solid #E2E8F0; color: #64748B; cursor: pointer; transition: all 0.2s; 
    }
    .btn-close:hover { background: #F1F5F9; color: #0F172A; transform: rotate(90deg); }

    .modal-scroll-area { padding: 32px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 32px; }
    
    .form-section { display: flex; flex-direction: column; gap: 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; }
    .section-label { font-size: 0.875rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
    
    .form-row { display: flex; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: #334155; }
    .form-input { 
        background: #F8FAFC; border: 2px solid #F1F5F9; border-radius: 14px; 
        padding: 12px 16px; font-size: 1rem; color: #0F172A; transition: all 0.2s; outline: none; 
    }
    .form-input:focus { border-color: #195BAC; background: white; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }
    .form-input.highlight { font-size: 1.25rem; font-weight: 800; color: #195BAC; border-color: #E9F4FF; }
    
    .type-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
    .type-btn { 
        display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px; 
        border-radius: 20px; border: 2px solid #F1F5F9; background: #F8FAFC; cursor: pointer; transition: all 0.2s; color: #64748B;
    }
    .type-btn:hover { border-color: #195BAC; background: #F0F7FF; transform: translateY(-2px); }
    .type-btn.active { border-color: #195BAC; background: #E9F4FF; color: #195BAC; }
    .type-icon-wrapper { 
        width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; 
        background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
    }
    .type-btn.active .type-icon-wrapper { background: #195BAC; color: white; }
    .type-label { font-size: 0.8rem; font-weight: 700; text-transform: capitalize; }

    .participant-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #F8FAFC; border-radius: 16px; border: 2px solid transparent; transition: all 0.2s; }
    .participant-row:focus-within { border-color: #E9F4FF; background: white; }
    .p-avatar-small { width: 36px; height: 36px; border-radius: 10px; background: white; border: 1px solid #E2E8F0; overflow: hidden; }
    .btn-remove { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #94A3B8; cursor: pointer; transition: all 0.2s; }
    .btn-remove:hover { background: #FEE2E2; color: #EF4444; }
    .btn-add-person { 
        display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px; 
        border: 1px solid #E2E8F0; color: #195BAC; font-weight: 700; font-size: 0.85rem; cursor: pointer; background: white; transition: all 0.2s;
    }
    .btn-add-person:hover { background: #F0F7FF; border-color: #195BAC; }

    .live-preview-section { background: #1E293B; border-radius: 24px; padding: 24px; color: white; display: flex; flex-direction: column; gap: 12px; }
    .preview-header { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #94A3B8; letter-spacing: 0.05em; }
    .preview-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
    .preview-row:last-child { border-bottom: none; }
    .preview-dots { flex: 1; border-bottom: 1px dotted rgba(148, 163, 184, 0.3); margin: 0 12px; margin-bottom: 4px; }
    .preview-row span:first-child { font-weight: 600; color: #E2E8F0; }
    .preview-row span:last-child { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #38BDF8; }
    .preview-row.is-self span:first-child { color: white; font-weight: 700; }
    .preview-row.is-self span:last-child { color: #22C55E; }

    .modal-footer { padding: 24px 32px; background: #F8FAFC; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; gap: 12px; }
    .btn-secondary { padding: 12px 24px; border-radius: 14px; font-weight: 600; color: #64748B; background: white; border: 1px solid #E2E8F0; cursor: pointer; transition: all 0.2s; }
    .btn-secondary:hover { background: #F1F5F9; color: #0F172A; }
    .btn-primary { 
        padding: 12px 32px; border-radius: 14px; font-weight: 700; color: white; background: #195BAC; 
        box-shadow: 0 10px 15px -3px rgba(25, 91, 172, 0.3); cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(25, 91, 172, 0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .form-error-bubble { background: #FEE2E2; color: #DC2626; padding: 12px 20px; border-radius: 12px; font-size: 0.9rem; font-weight: 600; text-align: center; margin: 0 32px; border: 1px solid #FECACA; }

    /* Detail Modal specific bits */
    .detail-header-inner { border-bottom: 1px solid #F1F5F9; padding-bottom: 1.5rem; }
    .detail-summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: #F8FAFC; padding: 24px; border-radius: 24px; margin-bottom: 32px; border: 1px solid #F1F5F9; }
    .summary-item label { font-size: 0.7rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
    .summary-item .val { font-size: 1.1rem; font-weight: 800; color: #0F172A; }
    .detail-participants-section h3 { font-size: 1rem; font-weight: 800; margin-bottom: 16px; color: #0F172A; }
    .p-detail-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid #F1F5F9; }
    .p-detail-row:last-child { border-bottom: none; }
    .p-avatar { width: 44px; height: 44px; border-radius: 14px; overflow: hidden; background: #F1F5F9; border: 1px solid #E2E8F0; }
    .p-name-area { flex: 1; }
    .p-name { font-weight: 700; font-size: 1rem; color: #0F172A; }
    .p-status { font-size: 0.75rem; color: #94A3B8; font-weight: 600; }
    .p-amount { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 1rem; color: #0F172A; }
    .status-dot { width: 10px; height: 10px; background: #E2E8F0; border-radius: 50%; }

    .text-green { color: #10B981; }
    .text-orange { color: #F59E0B; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .capitalize { text-transform: capitalize; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-3 { gap: 0.75rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .p-12 { padding: 3rem; }
    .text-slate-500 { color: #64748B; }
    .text-slate-700 { color: #334155; }
    .text-blue-600 { color: #195BAC; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .text-sm { font-size: 0.875rem; }
    .progress-bar-bg { background: #F1F5F9; height: 8px; border-radius: 4px; overflow: hidden; }
    .progress-bar-fill { background: #195BAC; height: 100%; border-radius: 4px; transition: width 0.3s ease; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .btn-action { padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: none; }
    .btn-action.primary-light { background: #E9F4FF; color: #195BAC; }
    .btn-action.primary-light:hover { background: #D0E2FF; }
    .btn-action.outline { background: white; border: 1px solid #E2E8F0; color: #64748B; }
    .btn-action.outline:hover { border-color: #195BAC; color: #195BAC; }
`;

export default SplitExpense;
