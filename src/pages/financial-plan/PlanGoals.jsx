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
    Trophy,
    Target,
    Flag,
    Calendar,
    ChevronRight,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../lib/formatCurrency';

const EMPTY_FORM = { name: '', target: '', current: '', deadline: new Date().toISOString().split('T')[0] };

const PlanGoals = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData]       = useState(EMPTY_FORM);
    const [formError, setFormError]     = useState('');
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

    // Fetch Goals
    const { data: goals = [], isLoading: goalsLoading } = useQuery({
        queryKey: ['plan-goals', activePlanId],
        queryFn: async () => {
            if (!activePlanId) return [];
            const data = await financialPlanService.getPlanGoals(activePlanId);
            return data.map(item => ({
                id: item.id,
                name: item.name || item.title,
                target: parseFloat(item.target_amount || item.target),
                current: parseFloat(item.current_amount || item.current),
                deadline: item.date || item.deadline
            }));
        },
        enabled: !!activePlanId
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (newGoal) => financialPlanService.createPlanGoal(activePlanId, newGoal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-goals', activePlanId] });
            closeModal();
        },
        onError: (err) => {
            setFormError(err.message || 'Failed to add goal.');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => financialPlanService.deletePlanGoal(activePlanId, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-goals', activePlanId] });
        }
    });

    const isLoading = plansLoading || (activePlanId && goalsLoading);

    const openModal = () => {
        setFormData(EMPTY_FORM);
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormError('');
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.target || !formData.current || !formData.deadline) {
            setFormError('All fields are required.');
            return;
        }

        const newGoal = {
            name: formData.name,
            target_amount: parseFloat(formData.target),
            current_amount: parseFloat(formData.current),
            date: formData.deadline,
        };

        createMutation.mutate(newGoal);
    };

    const totalTarget = goals.reduce((sum, item) => sum + item.target, 0);
    const totalCurrent = goals.reduce((sum, item) => sum + item.current, 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    const filteredGoals = goals.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="goals-loader">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="goals-module">
            <style>{`
                .goals-module { font-family: 'Inter', sans-serif; color: #0F172A; }
                .goals-loader { display: flex; justify-content: center; align-items: center; min-height: 400px; }
                .spinner { width: 40px; height: 40px; border: 3px solid #F1F5F9; border-top-color: #F59E0B; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .milestone-hero { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 2.5rem; border-radius: 32px; margin-bottom: 2rem; position: relative; overflow: hidden; }
                .hero-content { position: relative; z-index: 2; }
                .hero-label { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; }
                .hero-value { font-size: 2.5rem; font-weight: 900; margin: 0.5rem 0; letter-spacing: -1.5px; }
                .hero-progress-track { width: 100%; height: 8px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 1.5rem 0 0.5rem; }
                .hero-progress-fill { height: 100%; background: white; border-radius: 10px; transition: width 1s ease-out; }
                .hero-icon-bg { position: absolute; right: -20px; bottom: -20px; opacity: 0.15; transform: rotate(-10deg); }

                .goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
                .goal-card { background: white; border-radius: 28px; border: 1px solid #F1F5F9; padding: 1.75rem; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .goal-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.04); border-color: #F59E0B; }
                
                .goal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .goal-icon-box { width: 48px; height: 48px; border-radius: 16px; background: #FFFBEB; color: #F59E0B; display: flex; align-items: center; justify-content: center; }
                .goal-name { font-weight: 800; font-size: 1.1rem; color: #1E293B; }
                
                .goal-stats { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
                .stat-lbl { font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; }
                .stat-val { font-size: 14px; font-weight: 800; color: #1E293B; }

                .bar-container { height: 10px; background: #F1F5F9; border-radius: 10px; overflow: hidden; margin-bottom: 1rem; }
                .bar-fill { height: 100%; background: #F59E0B; border-radius: 10px; }
                
                .goal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #F1F5F9; }
                .date-box { display: flex; align-items: center; gap: 0.5rem; font-size: 12px; font-weight: 700; color: #94A3B8; }
                
                .add-goal-placeholder { background: #F8FAFC; border: 2px dashed #E2E8F0; border-radius: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #94A3B8; cursor: pointer; min-height: 240px; transition: all 0.2s; }
                .add-goal-placeholder:hover { background: white; border-color: #F59E0B; color: #F59E0B; }
                .plus-circle { width: 50px; height: 50px; border-radius: 50%; background: white; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }

                /* Premium Form Modal */
                .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-container { background: white; width: 420px; padding: 2.5rem; border-radius: 36px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.2); }
                .form-title { font-size: 1.75rem; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 2rem; }
                .input-field { margin-bottom: 1.5rem; }
                .input-field label { display: block; font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.5rem; }
                .input-field input { width: 100%; height: 50px; border-radius: 16px; border: 1px solid #F1F5F9; background: #F8FAFC; padding: 0 1.25rem; font-weight: 700; outline: none; transition: all 0.2s; }
                .input-field input:focus { border-color: #F59E0B; background: white; box-shadow: 0 0 0 4px rgba(245,158,11,0.1); }
                .footer-actions { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-top: 2rem; }
                .btn-cancel { height: 50px; border-radius: 16px; border: none; background: #F1F5F9; font-weight: 700; cursor: pointer; }
                .btn-submit { height: 50px; border-radius: 16px; border: none; background: #0F172A; color: white; font-weight: 800; cursor: pointer; transition: all 0.2s; }
                .btn-submit:hover { background: #F59E0B; }
            `}</style>

            <div className="milestone-hero">
                <div className="hero-content">
                    <span className="hero-label">Combined Objectives</span>
                    <h1 className="hero-value">{formatCurrency(totalCurrent)} / {formatCurrency(totalTarget)}</h1>
                    <div className="hero-progress-track">
                        <div className="hero-progress-fill" style={{ width: `${overallProgress}%` }}></div>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
                        You've reached {overallProgress.toFixed(1)}% of your total financial targets!
                    </p>
                </div>
                <div className="hero-icon-bg"><Trophy size={180} /></div>
            </div>

            <div className="goals-grid">
                {filteredGoals.map(goal => {
                    const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
                    return (
                        <motion.div 
                            key={goal.id} 
                            className="goal-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="goal-head">
                                <div className="flex items-center gap-3">
                                    <div className="goal-icon-box"><Target size={22} /></div>
                                    <span className="goal-name">{goal.name}</span>
                                </div>
                                <Trash2 size={16} className="text-slate-300 cursor-pointer hover:text-red-500" onClick={() => deleteMutation.mutate(goal.id)} />
                            </div>

                            <div className="goal-stats">
                                <div>
                                    <span className="stat-lbl">Saved</span>
                                    <div className="stat-val">{formatCurrency(goal.current)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className="stat-lbl">Target</span>
                                    <div className="stat-val">{formatCurrency(goal.target)}</div>
                                </div>
                            </div>

                            <div className="bar-container">
                                <div className="bar-fill" style={{ width: `${progress}%` }}></div>
                            </div>

                            <div className="goal-footer">
                                <div className="date-box">
                                    <Calendar size={14} />
                                    <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#F59E0B' }}>{progress.toFixed(0)}%</span>
                            </div>
                        </motion.div>
                    );
                })}

                <button className="add-goal-placeholder" onClick={openModal}>
                    <div className="plus-circle"><Plus size={24} /></div>
                    <span style={{ fontWeight: 800 }}>Create New Goal</span>
                </button>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-backdrop" onClick={closeModal}>
                        <motion.div 
                            className="modal-container" 
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                        >
                            <h2 className="form-title">Define Your Goal</h2>
                            <form onSubmit={handleAddGoal}>
                                <div className="input-field">
                                    <label>Goal Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Dream House" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="input-field">
                                    <label>Financial Target</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={formData.target}
                                        onChange={e => setFormData({...formData, target: e.target.value})}
                                    />
                                </div>
                                <div className="input-field">
                                    <label>Initial Deposit</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={formData.current}
                                        onChange={e => setFormData({...formData, current: e.target.value})}
                                    />
                                </div>
                                <div className="input-field">
                                    <label>Target Achievement Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.deadline}
                                        onChange={e => setFormData({...formData, deadline: e.target.value})}
                                    />
                                </div>

                                {formError && <p style={{ color: '#EF4444', fontSize: '12px', fontWeight: 700, margin: '0 0 1rem' }}>{formError}</p>}

                                <div className="footer-actions">
                                    <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn-submit">Set Goal</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlanGoals;
