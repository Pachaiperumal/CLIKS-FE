import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalWalletService } from '../services/goalWalletService';
import EmptyState from '../components/common/EmptyState';
import {
    Wallet,
    Target,
    TrendingUp,
    Plus,
    Coins,
    CheckCircle2,
    History,
    Lock,
    ArrowUpRight,
    ChevronRight,
    X,
    Loader2,
    Check,
    Trash2
} from 'lucide-react';

const Segregation = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [addAmount, setAddAmount] = useState('');
    
    const [formData, setFormData] = useState({ 
        name: '', 
        target_amount: '', 
        description: '' 
    });
    
    const [formError, setFormError] = useState('');

    // ── Queries ─────────────────────────────────────────────────────────────
    
    const { 
        data: walletsResponse, 
        isLoading, 
        isError,
        refetch 
    } = useQuery({
        queryKey: ['goal-wallets'],
        queryFn: () => goalWalletService.getWallets(),
    });
    
    const { 
        data: walletDetailsResponse, 
        isLoading: isLoadingDetails 
    } = useQuery({
        queryKey: ['goal-wallet', selectedId],
        queryFn: () => goalWalletService.getWalletById(selectedId),
        enabled: !!selectedId && isHistoryModalOpen
    });

    const walletDetails = useMemo(() => {
        return walletDetailsResponse?.data || walletDetailsResponse;
    }, [walletDetailsResponse]);

    const wallets = useMemo(() => {
        const rawData = walletsResponse?.data !== undefined ? walletsResponse.data : walletsResponse;
        return Array.isArray(rawData) ? rawData : [];
    }, [walletsResponse]);

    // ── Mutations ───────────────────────────────────────────────────────────
    
    const createMutation = useMutation({
        mutationFn: (data) => goalWalletService.createWallet(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-wallets'] });
            setIsCreateModalOpen(false);
            setFormData({ name: '', target_amount: '', description: '' });
        },
        onError: (err) => setFormError(err.response?.data?.error?.message || 'Failed to create wallet')
    });

    const addMoneyMutation = useMutation({
        mutationFn: ({ id, amount }) => goalWalletService.addMoney(id, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-wallets'] });
            setIsAddMoneyModalOpen(false);
            setAddAmount('');
            setSelectedWallet(null);
        },
        onError: (err) => setFormError(err.response?.data?.error?.message || 'Failed to add money')
    });

    const claimMutation = useMutation({
        mutationFn: (id) => goalWalletService.claimWallet(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-wallets'] });
        },
        onError: (err) => alert(err.response?.data?.error?.message || 'Failed to claim wallet')
    });
    
    const deleteMutation = useMutation({
        mutationFn: (id) => goalWalletService.deleteWallet(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-wallets'] });
        },
        onError: (err) => alert(err.response?.data?.error?.message || 'Failed to delete wallet')
    });

    // ── Logic ──────────────────────────────────────────────────────────────

    const activeWallets = wallets.filter(w => w.status === 'active');
    const completedWallets = wallets.filter(w => w.status === 'completed');

    const totalSaved = wallets.reduce((sum, w) => sum + Number(w.current_amount || 0), 0);
    const totalTarget = activeWallets.reduce((sum, w) => sum + Number(w.target_amount || 0), 0);

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.target_amount) {
            setFormError('Name and Target Amount are required');
            return;
        }
        createMutation.mutate({
            name: formData.name,
            target_amount: parseFloat(formData.target_amount),
            description: formData.description
        });
    };

    const handleAddMoneySubmit = (e) => {
        e.preventDefault();
        const amt = parseFloat(addAmount);
        if (!amt || amt <= 0) {
            setFormError('Please enter a valid amount');
            return;
        }
        addMoneyMutation.mutate({ id: selectedWallet.id, amount: amt });
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader2 size={40} className="animate-spin text-primary mb-4" />
            <p className="text-muted font-medium">Loading your Goal Wallets...</p>
        </div>
    );

    return (
        <div className="segregation-page">
            <style>{styles}</style>
            
            <div className="page-header">
                <div className="header-text">
                    <h1 className="title">Personal Goal Wallets</h1>
                    <p className="subtitle">Save for specific purposes, track progress, and claim when ready.</p>
                </div>
                <button className="btn-create" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} />
                    <span>Create Wallet</span>
                </button>
            </div>

            {/* Top Stats Overview */}
            <div className="stats-row">
                <div className="stat-card primary">
                    <div className="stat-icon"><Wallet size={24} /></div>
                    <div className="stat-content">
                        <span className="label">Total Saved</span>
                        <h2 className="value">₹{totalSaved.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="stat-bg-icon"><TrendingUp size={80} /></div>
                </div>
                <div className="stat-card secondary">
                    <div className="stat-icon"><Target size={24} /></div>
                    <div className="stat-content">
                        <span className="label">Active Targets</span>
                        <h2 className="value">₹{totalTarget.toLocaleString('en-IN')}</h2>
                    </div>
                </div>
                <div className="stat-card neutral">
                    <div className="stat-icon"><History size={24} /></div>
                    <div className="stat-content">
                        <span className="label">Completed Goals</span>
                        <h2 className="value">{completedWallets.length}</h2>
                    </div>
                </div>
            </div>

            {/* Active Wallets Grid */}
            <section className="wallet-section">
                <h3 className="section-title">Active Goals</h3>
                {activeWallets.length === 0 ? (
                    <EmptyState 
                        title="No Active Wallets" 
                        description="Start saving for a goal by creating your first wallet." 
                    />
                ) : (
                    <div className="wallets-grid">
                        {activeWallets.map(wallet => (
                            <WalletCard 
                                key={wallet.id} 
                                wallet={wallet} 
                                onAddMoney={() => {
                                    setSelectedWallet(wallet);
                                    setIsAddMoneyModalOpen(true);
                                }}
                                onClaim={() => claimMutation.mutate(wallet.id)}
                                onDelete={() => deleteMutation.mutate(wallet.id)}
                                onViewHistory={() => {
                                    setSelectedId(wallet.id);
                                    setIsHistoryModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* History Section */}
            {completedWallets.length > 0 && (
                <section className="wallet-section history">
                    <h3 className="section-title">History (Completed)</h3>
                    <div className="wallets-grid">
                        {completedWallets.map(wallet => (
                            <WalletCard 
                                key={wallet.id} 
                                wallet={wallet} 
                                isHistory 
                                onDelete={() => deleteMutation.mutate(wallet.id)}
                                onViewHistory={() => {
                                    setSelectedId(wallet.id);
                                    setIsHistoryModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Modals */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <Modal 
                        title="Create New Goal Wallet" 
                        onClose={() => setIsCreateModalOpen(false)}
                    >
                        <form onSubmit={handleCreateSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Wallet Name</label>
                                <input 
                                    type="text" value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Buy New Phone"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Amount (₹)</label>
                                <input 
                                    type="number" value={formData.target_amount} 
                                    onChange={e => setFormData({...formData, target_amount: e.target.value})}
                                    placeholder="10000"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Why are you saving for this?"
                                    className="form-input"
                                />
                            </div>
                            {formError && <p className="error-msg">{formError}</p>}
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Creating...' : 'Create Wallet'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {isAddMoneyModalOpen && (
                    <Modal 
                        title={`Add Money to ${selectedWallet?.name}`} 
                        onClose={() => setIsAddMoneyModalOpen(false)}
                    >
                        <form onSubmit={handleAddMoneySubmit} className="modal-form">
                            <div className="form-group">
                                <label>Amount to Add (₹)</label>
                                <input 
                                    type="number" value={addAmount} 
                                    onChange={e => setAddAmount(e.target.value)}
                                    placeholder="500"
                                    className="form-input large-text"
                                    autoFocus
                                />
                            </div>
                            {formError && <p className="error-msg">{formError}</p>}
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsAddMoneyModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-submit" disabled={addMoneyMutation.isPending}>
                                    {addMoneyMutation.isPending ? 'Adding...' : 'Add Money'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {isHistoryModalOpen && (
                    <Modal 
                        title={`History: ${walletDetails?.name || 'Loading...'}`} 
                        onClose={() => {
                            setIsHistoryModalOpen(false);
                            setSelectedId(null);
                        }}
                    >
                        <div className="history-modal-content">
                            {isLoadingDetails ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : walletDetails?.transactions?.length > 0 ? (
                                <div className="transaction-list">
                                    {walletDetails.transactions.map(t => (
                                        <div key={t.id} className="transaction-item">
                                            <div className="t-info">
                                                <div className="t-icon"><ArrowUpRight size={14} /></div>
                                                <div className="t-text">
                                                    <span className="t-type">Money Added</span>
                                                    <span className="t-date">{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            <div className="t-amount">+₹{Number(t.amount).toLocaleString('en-IN')}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted p-8">No transactions found for this goal.</p>
                            )}
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

const WalletCard = ({ wallet, onAddMoney, onClaim, onDelete, onViewHistory, isHistory }) => {
    const progress = Math.min((Number(wallet.current_amount || 0) / Number(wallet.target_amount || 1)) * 100, 100);
    const isTargetReached = Number(wallet.current_amount || 0) >= Number(wallet.target_amount || 0);
    const remaining = Math.max(Number(wallet.target_amount || 0) - Number(wallet.current_amount || 0), 0);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`wallet-card ${isHistory ? 'completed' : ''} ${isTargetReached && !isHistory ? 'reached' : ''}`}
        >
            <div className="card-header">
                <div className="icon-badge">
                    {isHistory ? <CheckCircle2 size={20} /> : <Coins size={20} />}
                </div>
                <div className="title-area">
                    <h4 className="wallet-name">{wallet.name}</h4>
                    <p className="wallet-desc">{wallet.description || 'No description'}</p>
                </div>
                {isHistory && <div className="status-label">Completed</div>}
                <button 
                    className="btn-delete-card"
                    title="Delete Goal"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
                            onDelete();
                        }
                    }}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="card-progress-area">
                <div className="progress-labels">
                    <span className="current">₹{Number(wallet.current_amount || 0).toLocaleString('en-IN')}</span>
                    <span className="target">Target: ₹{Number(wallet.target_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="progress-bar-container">
                    <motion.div 
                        className="progress-bar-fill" 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
                <div className="progress-footer">
                    <span className="pct">{progress.toFixed(0)}% reached</span>
                    {!isHistory && !isTargetReached && (
                        <span className="rem">₹{remaining.toLocaleString('en-IN')} more to go</span>
                    )}
                    {isTargetReached && !isHistory && (
                        <span className="goal-reached">Goal achieved! 🎉</span>
                    )}
                </div>
            </div>

            {!isHistory && (
                <div className="card-actions">
                    <button className="btn-add" onClick={onAddMoney}>
                        <Plus size={16} /> Add Money
                    </button>
                    <button 
                        className={`btn-claim ${isTargetReached ? 'active' : 'disabled'}`}
                        disabled={!isTargetReached}
                        onClick={onClaim}
                    >
                        {isTargetReached ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                        Claim
                    </button>
                </div>
            )}

            {!isHistory && (
                <button className="btn-view-history" onClick={onViewHistory}>
                    <History size={14} />
                    View History
                </button>
            )}
        </motion.div>
    );
};

const Modal = ({ title, onClose, children }) => (
    <div className="modal-overlay" onClick={onClose}>
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-content" 
            onClick={e => e.stopPropagation()}
        >
            <div className="modal-header">
                <h3>{title}</h3>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            {children}
        </motion.div>
    </div>
);

const styles = `
    .segregation-page {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 3rem;
    }

    .title { font-size: 2.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.5rem; }
    .subtitle { color: var(--text-muted); font-size: 1.1rem; }

    .btn-create {
        background: var(--primary);
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        box-shadow: 0 10px 15px -3px rgba(25, 91, 172, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-create:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(25, 91, 172, 0.4);
    }

    .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 4rem;
    }

    .stat-card {
        background: white;
        padding: 1.8rem;
        border-radius: 24px;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(218, 228, 240, 0.5);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .stat-card.primary .stat-icon { background: #E9F4FF; color: var(--primary); }
    .stat-card.secondary .stat-icon { background: #F0F9FF; color: #0EA5E9; }
    .stat-card.neutral .stat-icon { background: #F8FAFC; color: #64748B; }

    .stat-content .label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-content .value { font-size: 1.8rem; font-weight: 800; color: var(--text-main); }

    .stat-bg-icon {
        position: absolute;
        right: -10px;
        bottom: -10px;
        opacity: 0.03;
        transform: rotate(-10deg);
    }

    .wallet-section { margin-bottom: 4rem; }
    .section-title { font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
    .section-title::after { content: ''; flex: 1; height: 1px; background: rgba(218, 228, 240, 0.8); }

    .wallets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 2rem;
    }

    .wallet-card {
        background: white;
        border-radius: 28px;
        padding: 2rem;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .wallet-card:hover { transform: translateY(-5px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); }

    .wallet-card.reached { border-color: #22C55E; background: #F0FDF4; }
    .wallet-card.completed { opacity: 0.8; filter: grayscale(0.5); background: #F8FAFC; border-style: dashed; }

    .card-header { display: flex; gap: 1rem; align-items: flex-start; }
    .icon-badge {
        width: 48px; height: 48px; border-radius: 14px; background: #F1F5F9; color: var(--text-main);
        display: flex; align-items: center; justify-content: center;
    }
    .wallet-card.reached .icon-badge { background: #DCFCE7; color: #16A34A; }
    
    .title-area { flex: 1; }
    .wallet-name { font-size: 1.2rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.2rem; }
    .wallet-desc { font-size: 0.9rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .card-progress-area { display: flex; flex-direction: column; gap: 0.75rem; }
    .progress-labels { display: flex; justify-content: space-between; align-items: baseline; }
    .progress-labels .current { font-size: 1.4rem; font-weight: 800; color: var(--text-main); }
    .progress-labels .target { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

    .progress-bar-container { height: 10px; background: #F1F5F9; border-radius: 5px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: var(--primary); border-radius: 5px; }
    .wallet-card.reached .progress-bar-fill { background: #22C55E; }

    .progress-footer { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; }
    .pct { color: var(--text-muted); }
    .rem { color: var(--primary); }
    .goal-reached { color: #16A34A; }

    .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; }
    .btn-add {
        padding: 0.75rem; border-radius: 12px; background: #E9F4FF; color: var(--primary);
        font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    }
    .btn-add:hover { background: #D0E2FF; }

    .btn-claim {
        padding: 0.75rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem;
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    }
    .btn-claim.active { background: #22C55E; color: white; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3); }
    .btn-claim.active:hover { background: #16A34A; }
    .btn-claim.disabled { background: #F1F5F9; color: #94A3B8; cursor: not-allowed; }
    
    .btn-delete-card {
        padding: 0.5rem;
        border-radius: 8px;
        color: #94A3B8;
        transition: all 0.2s;
        opacity: 0;
    }
    .wallet-card:hover .btn-delete-card { opacity: 1; }
    .btn-delete-card:hover { background: #FEE2E2; color: #EF4444; }

    .btn-view-history {
        width: 100%;
        padding: 0.5rem;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid var(--border-color);
        transition: all 0.2s;
        margin-top: -0.5rem;
    }
    .btn-view-history:hover { background: #F8FAFC; color: var(--primary); border-color: var(--primary); }

    /* History Modal Styles */
    .history-modal-content { max-height: 400px; overflow-y: auto; padding-right: 0.5rem; }
    .transaction-list { display: flex; flex-direction: column; gap: 1rem; }
    .transaction-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #F8FAFC;
        border-radius: 16px;
        border: 1px solid #F1F5F9;
    }
    .t-info { display: flex; gap: 1rem; align-items: center; }
    .t-icon { width: 32px; height: 32px; border-radius: 8px; background: #DCFCE7; color: #16A34A; display: flex; align-items: center; justify-content: center; }
    .t-text { display: flex; flex-direction: column; }
    .t-type { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
    .t-date { font-size: 0.75rem; color: var(--text-muted); }
    .t-amount { font-weight: 800; color: #16A34A; }

    .status-label { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 99px; background: #E2E8F0; color: #475569; text-transform: uppercase; }

    /* Modals */
    .modal-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-content {
        background: white; border-radius: 32px; padding: 2.5rem; width: 100%; max-width: 480px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .modal-header h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .close-btn { color: var(--text-muted); }

    .modal-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
    .form-input {
        padding: 0.9rem 1.2rem; border-radius: 14px; border: 2px solid #F1F5F9; background: #F8FAFC;
        font-size: 1rem; color: var(--text-main); outline: none; transition: all 0.2s;
    }
    .form-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }
    .form-input.large-text { font-size: 1.8rem; font-weight: 800; text-align: center; color: var(--primary); }

    .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .btn-cancel { padding: 0.9rem; border-radius: 14px; background: #F1F5F9; color: #64748B; font-weight: 700; }
    .btn-submit { padding: 0.9rem; border-radius: 14px; background: var(--primary); color: white; font-weight: 700; }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

    .error-msg { color: #EF4444; font-size: 0.85rem; font-weight: 600; text-align: center; }

    /* History section specific styles */
    .wallet-section.history .wallets-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .wallet-section.history .wallet-card { padding: 1.5rem; }
`;

export default Segregation;
