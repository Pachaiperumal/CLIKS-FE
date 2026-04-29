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
    X,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    Calendar,
    ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../lib/formatCurrency';

const EMPTY_FORM = { source: '', category: '', amount: '', date: new Date().toISOString().split('T')[0] };

const PlanIncome = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // 1. Fetch available plans
    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['financial-plans'],
        queryFn: async () => {
            const res = await financialPlanService.getPlans();
            return res.data || res;
        }
    });

    const activePlanId = plans.length > 0 ? plans[0].id : null;

    // Fetch Income Sources
    const { data: incomeSources = [], isLoading: incomeLoading } = useQuery({
        queryKey: ['plan-income', activePlanId],
        queryFn: async () => {
            if (!activePlanId) return [];
            const data = await financialPlanService.getPlanIncome(activePlanId);
            return data.map(item => ({
                id: item.id,
                source: item.source,
                category: item.category,
                amount: parseFloat(item.actual_amount || item.amount || item.expected_amount || 0),
                date: item.date
            }));
        },
        enabled: !!activePlanId
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (newIncome) => financialPlanService.createPlanIncome(activePlanId, newIncome),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-income', activePlanId] });
            queryClient.invalidateQueries({ queryKey: ['plan-analysis', activePlanId] });
            closeModal();
        },
        onError: (err) => {
            setFormError(err.message || 'Failed to add income.');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => financialPlanService.deletePlanIncome(activePlanId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-income', activePlanId] });
            queryClient.invalidateQueries({ queryKey: ['plan-analysis', activePlanId] });
        }
    });

    const isLoading = plansLoading || (activePlanId && incomeLoading);

    const openModal = () => {
        setFormData(EMPTY_FORM);
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormError('');
    };

    const handleAddIncome = (e) => {
        e.preventDefault();
        if (!formData.source || !formData.category || !formData.amount || !formData.date) {
            setFormError('All fields are required.');
            return;
        }

        const newIncome = {
            source: formData.source,
            category: formData.category,
            expected_amount: parseFloat(formData.amount),
            actual_amount: parseFloat(formData.amount),
            date: formData.date,
        };

        createMutation.mutate(newIncome);
    };

    const totalIncome = incomeSources.reduce((sum, item) => sum + item.amount, 0);
    const filteredSources = incomeSources.filter(
        (item) =>
            item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="income-loader">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="income-module">
            <style>{`
                .income-module { font-family: 'Inter', sans-serif; color: #0F172A; }
                .income-loader { display: flex; justify-content: center; align-items: center; min-height: 400px; }
                .spinner { width: 40px; height: 40px; border: 3px solid #F1F5F9; border-top-color: #10B981; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .income-hero { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 2.5rem; border-radius: 32px; margin-bottom: 2rem; position: relative; overflow: hidden; }
                .hero-content { position: relative; z-index: 2; }
                .hero-label { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; }
                .hero-value { font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0; letter-spacing: -1.5px; }
                .hero-sub { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); }
                .hero-icon-bg { position: absolute; right: -20px; bottom: -20px; opacity: 0.1; transform: rotate(-15deg); }

                .stats-bar { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .mini-card { background: white; padding: 1.25rem; border-radius: 20px; border: 1px solid #F1F5F9; display: flex; align-items: center; gap: 1rem; }
                .mini-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #F0FDF4; color: #10B981; }
                .mini-info p { font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin: 0; }
                .mini-info h4 { font-size: 18px; font-weight: 800; margin: 2px 0 0; }

                .action-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; }
                .search-pill { flex: 1; background: white; border-radius: 16px; border: 1px solid #F1F5F9; display: flex; align-items: center; padding: 0 1rem; height: 48px; gap: 0.75rem; }
                .search-pill input { border: none; outline: none; flex: 1; font-weight: 600; font-size: 14px; }
                .add-btn { background: #0F172A; color: white; border: none; height: 48px; padding: 0 1.5rem; border-radius: 16px; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
                .add-btn:hover { background: #059669; transform: translateY(-1px); }

                .income-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .income-tile { background: white; padding: 1.25rem; border-radius: 20px; border: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
                .income-tile:hover { border-color: #10B981; transform: scale(1.01); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                .tile-left { display: flex; align-items: center; gap: 1rem; }
                .tile-icon { width: 44px; height: 44px; border-radius: 14px; background: #F8FAFC; color: #94A3B8; display: flex; align-items: center; justify-content: center; }
                .tile-title { font-weight: 800; color: #1E293B; margin-bottom: 0.25rem; }
                .tile-meta { font-size: 12px; font-weight: 700; color: #94A3B8; display: flex; align-items: center; gap: 0.5rem; }
                .tile-badge { padding: 2px 8px; background: #F1F5F9; border-radius: 6px; font-size: 10px; text-transform: uppercase; }
                
                .tile-right { text-align: right; }
                .tile-amount { font-size: 18px; font-weight: 900; color: #10B981; }
                .tile-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: flex-end; opacity: 0; transition: opacity 0.2s; }
                .income-tile:hover .tile-actions { opacity: 1; }
                .action-icon { padding: 4px; border-radius: 6px; border: 1px solid #F1F5F9; color: #94A3B8; cursor: pointer; }
                .action-icon:hover { background: #F8FAFC; color: #0F172A; }
                .action-icon.delete:hover { background: #FEF2F2; color: #EF4444; }

                /* Premium Form Modal */
                .form-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .glass-form { background: white; width: 400px; padding: 2.5rem; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); }
                .form-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 2rem; }
                .field { margin-bottom: 1.5rem; }
                .field label { display: block; font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.5rem; }
                .field input { width: 100%; height: 48px; border-radius: 14px; border: 1px solid #F1F5F9; background: #F8FAFC; padding: 0 1rem; font-weight: 700; outline: none; transition: all 0.2s; }
                .field input:focus { background: white; border-color: #10B981; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
                .submit-row { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-top: 2rem; }
                .btn-back { background: #F1F5F9; border: none; font-weight: 700; border-radius: 14px; cursor: pointer; }
                .btn-go { background: #10B981; color: white; border: none; font-weight: 800; border-radius: 14px; height: 48px; cursor: pointer; }
            `}</style>

            <div className="income-hero">
                <div className="hero-content">
                    <span className="hero-label">Total Volume</span>
                    <h1 className="hero-value">{formatCurrency(totalIncome)}</h1>
                    <p className="hero-sub">Combined earnings from {incomeSources.length} sources</p>
                </div>
                <div className="hero-icon-bg"><TrendingUp size={160} /></div>
            </div>

            <div className="stats-bar">
                <div className="mini-card">
                    <div className="mini-icon-wrap"><PieChart size={20} /></div>
                    <div className="mini-info">
                        <p>Efficiency</p>
                        <h4>Active</h4>
                    </div>
                </div>
                <div className="mini-card">
                    <div className="mini-icon-wrap"><Calendar size={20} /></div>
                    <div className="mini-info">
                        <p>Frequency</p>
                        <h4>Monthly</h4>
                    </div>
                </div>
            </div>

            <div className="action-header">
                <div className="search-pill">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search sources..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="add-btn" onClick={openModal}>
                    <Plus size={20} />
                    Add Source
                </button>
            </div>

            <div className="income-list">
                {filteredSources.map(item => (
                    <motion.div 
                        key={item.id} 
                        className="income-tile"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="tile-left">
                            <div className="tile-icon">
                                <ArrowUpRight size={22} />
                            </div>
                            <div>
                                <div className="tile-title">{item.source}</div>
                                <div className="tile-meta">
                                    <span className="tile-badge">{item.category}</span>
                                    <span>•</span>
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="tile-right">
                            <div className="tile-amount">{formatCurrency(item.amount)}</div>
                            <div className="tile-actions">
                                <Edit size={14} className="action-icon" />
                                <Trash2 size={14} className="action-icon delete" onClick={() => deleteMutation.mutate(item.id)} />
                            </div>
                        </div>
                    </motion.div>
                ))}
                
                {filteredSources.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #E2E8F0' }}>
                        <p style={{ fontWeight: 800, color: '#94A3B8' }}>No income sources found.</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="form-overlay" onClick={closeModal}>
                        <motion.div 
                            className="glass-form" 
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <h2 className="form-title">New Income Source</h2>
                            <form onSubmit={handleAddIncome}>
                                <div className="field">
                                    <label>Income Source</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Salary" 
                                        value={formData.source}
                                        onChange={e => setFormData({...formData, source: e.target.value})}
                                    />
                                </div>
                                <div className="field">
                                    <label>Category</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Employment" 
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    />
                                </div>
                                <div className="field">
                                    <label>Amount</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: e.target.value})}
                                    />
                                </div>
                                <div className="field">
                                    <label>Received Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                                
                                {formError && <p style={{ color: '#EF4444', fontSize: '12px', fontWeight: 700, margin: '0 0 1rem' }}>{formError}</p>}
                                
                                <div className="submit-row">
                                    <button type="button" className="btn-back" onClick={closeModal}>Back</button>
                                    <button type="submit" className="btn-go">Add Source</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlanIncome;
