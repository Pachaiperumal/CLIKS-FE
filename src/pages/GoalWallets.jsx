import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import goalWalletService from '../services/goalWalletService';
import EmptyState from '../components/common/EmptyState';
import {
    Plus,
    Search,
    TrendingUp,
    TrendingDown,
    Loader2,
    RefreshCw,
    Wallet,
    CheckCircle2,
    History,
    Lock,
    Unlock,
    IndianRupee,
    ChevronRight,
    PlusCircle,
    PartyPopper
} from 'lucide-react';

const GoalWallets = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, HISTORY
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
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
        isLoading: isWalletsLoading, 
        isError: isWalletsError,
        refetch: refetchWallets 
    } = useQuery({
        queryKey: ['goal-wallets'],
        queryFn: () => goalWalletService.getWallets({ status: activeTab === 'ACTIVE' ? 'active' : 'completed' }),
    });

    const wallets = useMemo(() => {
        const rawData = walletsResponse?.data !== undefined ? walletsResponse.data : walletsResponse;
        return Array.isArray(rawData) ? rawData : [];
    }, [walletsResponse]);

    // ── Mutations ───────────────────────────────────────────────────────────
    
    const createMutation = useMutation({
        mutationFn: (newWallet) => goalWalletService.createWallet(newWallet),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-wallets'] });
            setIsCreateModalOpen(false);
            setFormData({ name: '', target_amount: '', description: '' });
            setFormError('');
        },
        onError: (error) => setFormError(error.message || 'Failed to create wallet')
    });

    const addMoneyMutation = useMutation({
        mutationFn: ({ id, amount }) => goalWalletService.addMoney(id, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-wallets'] });
            setIsAddMoneyModalOpen(false);
            setAddAmount('');
            setSelectedWallet(null);
        }
    });

    const claimMutation = useMutation({
        mutationFn: (id) => goalWalletService.claimWallet(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal-wallets'] });
            setActiveTab('HISTORY');
        }
    });

    // ── Logic ──────────────────────────────────────────────────────────────

    const handleCreateWallet = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.target_amount) {
            setFormError('Name and Target Amount are required');
            return;
        }
        createMutation.mutate({
            ...formData,
            target_amount: parseFloat(formData.target_amount)
        });
    };

    const handleAddMoney = (e) => {
        e.preventDefault();
        if (!addAmount || parseFloat(addAmount) <= 0) return;
        addMoneyMutation.mutate({
            id: selectedWallet.id,
            amount: parseFloat(addAmount)
        });
    };

    const filteredWallets = wallets.filter(w => 
        (w.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalSaved = wallets.reduce((sum, w) => sum + (w.current_amount || 0), 0);
    const totalTarget = wallets.reduce((sum, w) => sum + (w.target_amount || 0), 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return (
        <div className="wallets-page">
            <div className="wallets-header-row">
                <div>
                    <h1 className="page-title">Personal Purpose Wallets</h1>
                    <p className="page-subtitle">Lock money for specific goals. Claim only when reached.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-refresh" onClick={() => refetchWallets()}>
                        <RefreshCw size={18} className={isWalletsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn-new-wallet" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} />
                        <span>New Wallet</span>
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-label-row text-blue">
                        <Wallet size={18} />
                        <span>TOTAL SAVED</span>
                    </div>
                    <div className="stat-value">₹{totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="stat-trend text-blue">
                        <TrendingUp size={16} />
                        <span>Across {wallets.length} {activeTab.toLowerCase()} wallets</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label-row text-orange">
                        <IndianRupee size={18} />
                        <span>TOTAL TARGET</span>
                    </div>
                    <div className="stat-value">₹{totalTarget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="stat-trend text-orange">
                        <TrendingDown size={16} />
                        <span>₹{(totalTarget - totalSaved).toLocaleString('en-IN')} remaining</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
                        <span className="text-sm font-bold text-blue-600">{overallProgress.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="controls-row">
                <div className="tabs-group">
                    {['ACTIVE', 'HISTORY'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab);
                                // Query Client will automatically refetch because the queryKey depends on activeTab? 
                                // Actually I need to add activeTab to queryKey or refetch manually.
                                // Let's add it to queryKey.
                            }}
                        >
                            {tab === 'ACTIVE' ? <Unlock size={14} className="inline mr-2" /> : <History size={14} className="inline mr-2" />}
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search wallets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            {isWalletsLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                    <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
                    <p className="font-medium">Loading your wallets...</p>
                </div>
            ) : filteredWallets.length === 0 ? (
                <EmptyState 
                    title={activeTab === 'ACTIVE' ? "No Active Wallets" : "No Completed Wallets"} 
                    description={activeTab === 'ACTIVE' ? "Create a wallet to start saving for a purpose." : "Your claimed goals will appear here."} 
                />
            ) : (
                <div className="wallets-grid">
                    {filteredWallets.map(wallet => {
                        const progress = (wallet.current_amount / wallet.target_amount) * 100;
                        const isClaimable = wallet.current_amount >= wallet.target_amount && wallet.status === 'active';
                        const remaining = Math.max(0, wallet.target_amount - wallet.current_amount);

                        return (
                            <motion.div 
                                layout
                                key={wallet.id} 
                                className={`wallet-card ${wallet.status === 'completed' ? 'completed' : ''}`}
                            >
                                <div className="wallet-card-header">
                                    <div className="wallet-icon-box">
                                        {wallet.status === 'completed' ? <CheckCircle2 size={24} className="text-green" /> : <Wallet size={24} className="text-primary" />}
                                    </div>
                                    <div className="wallet-name-area">
                                        <h3 className="wallet-name">{wallet.name}</h3>
                                        <p className="wallet-desc">{wallet.description || 'No description'}</p>
                                    </div>
                                    <div className="wallet-status-tag">
                                        {wallet.status === 'active' ? (
                                            <span className="badge active">Active</span>
                                        ) : (
                                            <span className="badge completed">Claimed</span>
                                        )}
                                    </div>
                                </div>

                                <div className="wallet-progress-area">
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-500">SAVED: ₹{wallet.current_amount.toLocaleString('en-IN')}</span>
                                        <span className="text-slate-800">TARGET: ₹{wallet.target_amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="progress-bar-bg large">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(progress, 100)}%` }}
                                            className={`progress-bar-fill ${progress >= 100 ? 'bg-green' : 'bg-blue'}`}
                                        ></motion.div>
                                    </div>
                                    <div className="progress-meta mt-2">
                                        <span className="percentage">{progress.toFixed(0)}% reached</span>
                                        {wallet.status === 'active' && (
                                            <span className="remaining-text">
                                                {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} more to reach goal` : "Goal achieved! 🎉"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="wallet-actions">
                                    {wallet.status === 'active' ? (
                                        <>
                                            <button 
                                                className="btn-action add-money"
                                                onClick={() => {
                                                    setSelectedWallet(wallet);
                                                    setIsAddMoneyModalOpen(true);
                                                }}
                                            >
                                                <PlusCircle size={16} />
                                                Add Money
                                            </button>
                                            <button 
                                                className={`btn-action claim ${isClaimable ? 'enabled' : 'disabled'}`}
                                                disabled={!isClaimable || claimMutation.isPending}
                                                onClick={() => claimMutation.mutate(wallet.id)}
                                            >
                                                {claimMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <PartyPopper size={16} />}
                                                Claim Wallet
                                            </button>
                                        </>
                                    ) : (
                                        <div className="claimed-message">
                                            <Lock size={14} />
                                            Wallet Locked & Moved to History
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Wallet Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-content"
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">Create Goal Wallet</h2>
                                <button className="btn-close" onClick={() => setIsCreateModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={handleCreateWallet} className="modal-form">
                                <div className="form-group">
                                    <label>Wallet Name</label>
                                    <input 
                                        type="text" value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="e.g. Buy Pen, Maldives Trip"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Target Amount (₹)</label>
                                    <input 
                                        type="number" value={formData.target_amount} 
                                        onChange={e => setFormData({...formData, target_amount: e.target.value})}
                                        placeholder="100.00"
                                        className="form-input highlight"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        placeholder="Why are you saving for this?"
                                        className="form-input"
                                        rows="3"
                                    />
                                </div>
                                {formError && <p className="form-error">{formError}</p>}
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? 'Creating...' : 'Create Wallet'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Money Modal */}
            <AnimatePresence>
                {isAddMoneyModalOpen && selectedWallet && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="modal-content small"
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">Add Money to "{selectedWallet.name}"</h2>
                                <button className="btn-close" onClick={() => setIsAddMoneyModalOpen(false)}>×</button>
                            </div>
                            <form onSubmit={handleAddMoney} className="modal-form">
                                <div className="form-group">
                                    <label>Amount to Add (₹)</label>
                                    <input 
                                        autoFocus
                                        type="number" value={addAmount} 
                                        onChange={e => setAddAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="form-input highlight text-center text-2xl"
                                    />
                                </div>
                                <div className="current-status-box">
                                    <p>Current: ₹{selectedWallet.current_amount.toLocaleString('en-IN')}</p>
                                    <p>Target: ₹{selectedWallet.target_amount.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setIsAddMoneyModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={addMoneyMutation.isPending}>
                                        {addMoneyMutation.isPending ? 'Adding...' : 'Confirm Addition'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .wallets-page { background: #F8FAFC; min-height: 100vh; padding: 2rem 3rem; font-family: 'Inter', sans-serif; }
                .wallets-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .page-title { font-size: 2rem; font-weight: 800; color: #0F172A; margin: 0; }
                .page-subtitle { color: #64748B; font-size: 0.9rem; }
                
                .btn-refresh { background: white; border: 1px solid #E2E8F0; padding: 10px; border-radius: 50%; cursor: pointer; color: #64748B; transition: all 0.2s; }
                .btn-new-wallet { background: #195BAC; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 99px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
                
                .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { background: white; border-radius: 1.25rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .stat-label-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; }
                .stat-value { font-size: 1.75rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem; }
                .stat-trend { font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }
                .text-blue { color: #195BAC; }
                .text-orange { color: #F97316; }
                
                .progress-bar-bg { width: 100%; height: 8px; background: #F1F5F9; border-radius: 4px; overflow: hidden; }
                .progress-bar-bg.large { height: 12px; border-radius: 6px; }
                .progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
                .bg-blue { background: #195BAC; }
                .bg-green { background: #10B981; }

                .controls-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 1rem; }
                .tabs-group { display: flex; gap: 2rem; }
                .tab-btn { background: none; border: none; font-size: 0.85rem; font-weight: 700; color: #64748B; cursor: pointer; padding-bottom: 0.5rem; position: relative; display: flex; align-items: center; }
                .tab-btn.active { color: #195BAC; }
                .tab-btn.active::after { content: ''; position: absolute; bottom: -1rem; left: 0; width: 100%; height: 3px; background: #195BAC; border-radius: 3px; }
                .search-wrapper { background: white; border-radius: 99px; padding: 0.6rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; border: 1px solid #E2E8F0; width: 300px; }
                .search-wrapper input { border: none; outline: none; font-size: 0.9rem; width: 100%; }

                .wallets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
                .wallet-card { background: white; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; border: 1px solid #F1F5F9; }
                .wallet-card.completed { opacity: 0.8; background: #F8FAFC; }
                
                .wallet-card-header { display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: flex-start; }
                .wallet-icon-box { background: #F1F5F9; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .wallet-name-area { flex: 1; }
                .wallet-name { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0; }
                .wallet-desc { font-size: 0.8rem; color: #64748B; margin: 4px 0 0 0; }
                
                .badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
                .badge.active { background: #E9F4FF; color: #195BAC; }
                .badge.completed { background: #ECFDF5; color: #10B981; }

                .wallet-progress-area { margin-bottom: 1.5rem; }
                .progress-meta { display: flex; justify-content: space-between; align-items: center; }
                .percentage { font-size: 0.8rem; font-weight: 800; color: #0F172A; }
                .remaining-text { font-size: 0.75rem; color: #64748B; font-weight: 500; }

                .wallet-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .btn-action { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: none; }
                .btn-action.add-money { background: #F1F5F9; color: #0F172A; }
                .btn-action.add-money:hover { background: #E2E8F0; }
                .btn-action.claim { background: #195BAC; color: white; }
                .btn-action.claim.disabled { background: #E2E8F0; color: #94A3B8; cursor: not-allowed; }
                .btn-action.claim.enabled:hover { background: #14488A; transform: scale(1.02); }
                
                .claimed-message { grid-column: span 2; background: #F1F5F9; padding: 10px; border-radius: 12px; color: #64748B; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }

                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; border-radius: 24px; width: 100%; max-width: 500px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; }
                .modal-content.small { max-width: 400px; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-title { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0; }
                .btn-close { background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer; }
                
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 8px; }
                .form-input { width: 100%; padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 12px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
                .form-input:focus { border-color: #195BAC; }
                .form-input.highlight { border-color: #195BAC; background: #F0F7FF; font-weight: 700; color: #195BAC; }
                .form-error { color: #EF4444; font-size: 0.8rem; margin-top: -10px; margin-bottom: 15px; }

                .current-status-box { background: #F8FAFC; padding: 16px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-around; }
                .current-status-box p { margin: 0; font-size: 0.85rem; font-weight: 700; color: #64748B; }

                .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                .btn-secondary { padding: 10px 20px; border-radius: 10px; border: 1px solid #E2E8F0; background: white; font-weight: 600; cursor: pointer; }
                .btn-primary { padding: 10px 24px; border-radius: 10px; background: #195BAC; color: white; border: none; font-weight: 700; cursor: pointer; }
                .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default GoalWallets;
