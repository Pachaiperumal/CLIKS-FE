import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialPlanService } from '../../services';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    DollarSign,
    Target,
    Activity,
    ShieldCheck,
    Zap,
    ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../../lib/formatCurrency';
import { motion } from 'framer-motion';

const PlanAnalysis = () => {
    // 1. Fetch available plans
    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['financial-plans'],
        queryFn: async () => {
            const res = await financialPlanService.getPlans();
            return res.data || res;
        }
    });

    const activePlanId = plans.length > 0 ? plans[0].id : null;

    const { data: analysis, isLoading: analysisLoading } = useQuery({
        queryKey: ['plan-analysis', activePlanId],
        queryFn: async () => {
            if (!activePlanId) return null;
            const data = await financialPlanService.getPlanAnalysis(activePlanId);
            return data;
        },
        enabled: !!activePlanId
    });

    const isLoading = plansLoading || (activePlanId && analysisLoading);

    if (isLoading) {
        return (
            <div className="analysis-loader">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!activePlanId || !analysis) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <Activity size={48} color="#94A3B8" style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontWeight: 900, color: '#1E293B' }}>Insufficient Data</h2>
                <p style={{ color: '#64748B', fontWeight: 600 }}>Create transactions to see your financial pulse.</p>
            </div>
        );
    }

    const savings = analysis.total_actual_income - analysis.total_actual_expenses;
    const savingsRate = analysis.total_actual_income > 0 
        ? (savings / analysis.total_actual_income) * 100 
        : 0;
    
    const budgetAdherence = analysis.total_allocated_budget > 0 
        ? (analysis.total_spent_budget / analysis.total_allocated_budget) * 100 
        : 0;

    return (
        <div className="analysis-module">
            <style>{`
                .analysis-module { font-family: 'Inter', sans-serif; color: #0F172A; }
                .analysis-loader { display: flex; justify-content: center; align-items: center; min-height: 400px; }
                .spinner { width: 40px; height: 40px; border: 3px solid #F1F5F9; border-top-color: #6366F1; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .insights-hero { background: #0F172A; color: white; padding: 2.5rem; border-radius: 32px; margin-bottom: 2.5rem; position: relative; overflow: hidden; }
                .hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 6px 12px; background: rgba(255,255,255,0.1); border-radius: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6366F1; margin-bottom: 1rem; }
                .hero-val { font-size: 3rem; font-weight: 900; letter-spacing: -2px; margin: 0; }
                .hero-desc { font-size: 14px; font-weight: 600; color: #94A3B8; margin-top: 0.5rem; }
                .hero-glow { position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%); }

                .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .kpi-card { background: white; padding: 1.5rem; border-radius: 24px; border: 1px solid #F1F5F9; display: flex; align-items: center; gap: 1.25rem; transition: transform 0.2s; }
                .kpi-card:hover { transform: translateY(-2px); border-color: #6366F1; }
                .kpi-icon { width: 52px; height: 52px; border-radius: 16px; background: #F8FAFC; color: #6366F1; display: flex; align-items: center; justify-content: center; }
                .kpi-label { display: block; font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 0.25rem; }
                .kpi-val { font-size: 20px; font-weight: 900; margin: 0; }

                .charts-split { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
                .viz-card { background: white; padding: 2rem; border-radius: 32px; border: 1px solid #F1F5F9; }
                .viz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .viz-header h3 { font-size: 1.1rem; font-weight: 900; margin: 0; display: flex; align-items: center; gap: 0.75rem; }
                
                .bar-track { height: 180px; display: flex; align-items: flex-end; justify-content: space-around; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #F1F5F9; }
                .bar-group { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; flex: 1; }
                .bar-fill { width: 40px; border-radius: 12px 12px 4px 4px; transition: height 1s ease-out; position: relative; }
                .bar-fill::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 900; color: #1E293B; white-space: nowrap; }
                .bar-label { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; text-align: center; }

                .donut-wrap { position: relative; width: 180px; height: 180px; margin: 0 auto 2rem; }
                .donut-svg { transform: rotate(-90deg); }
                .donut-bg { fill: none; stroke: #F1F5F9; stroke-width: 14; }
                .donut-progress { fill: none; stroke: #6366F1; stroke-width: 14; stroke-linecap: round; transition: stroke-dasharray 1s ease-out; }
                .donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .donut-val { font-size: 24px; font-weight: 900; }
                .donut-lbl { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; }

                .legend { display: flex; flex-direction: column; gap: 0.75rem; }
                .legend-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; color: #64748B; }
                .legend-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366F1; }
            `}</style>

            <motion.div 
                className="insights-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="hero-glow"></div>
                <div className="hero-badge">
                    <ShieldCheck size={14} /> 
                    Financial Integrity Score: 85
                </div>
                <h1 className="hero-val">{savingsRate.toFixed(1)}%</h1>
                <p className="hero-desc">Your current savings rate is {savingsRate > 20 ? 'Optimal' : 'Needs attention'}</p>
            </motion.div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon"><TrendingUp size={24} /></div>
                    <div>
                        <span className="kpi-label">Actual Income</span>
                        <h3 className="kpi-val">{formatCurrency(analysis.total_actual_income)}</h3>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon" style={{ color: '#EF4444' }}><ArrowDownRight size={24} /></div>
                    <div>
                        <span className="kpi-label">Actual Spending</span>
                        <h3 className="kpi-val">{formatCurrency(analysis.total_actual_expenses)}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-split">
                <div className="viz-card">
                    <div className="viz-header">
                        <h3><Activity size={20} color="#6366F1" /> Performance Analysis</h3>
                        <button style={{ border: 'none', background: 'none', color: '#6366F1', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>View Details</button>
                    </div>
                    <div className="bar-track">
                        <div className="bar-group">
                            <div className="bar-fill" data-val={formatCurrency(analysis.total_expected_income)} style={{ height: '100%', background: '#F1F5F9' }}></div>
                            <span className="bar-label">Income<br/>Plan</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar-fill" data-val={formatCurrency(analysis.total_actual_income)} style={{ height: `${(analysis.total_actual_income / analysis.total_expected_income) * 100}%`, background: '#6366F1' }}></div>
                            <span className="bar-label">Income<br/>Actual</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar-fill" data-val={formatCurrency(analysis.total_expected_expenses)} style={{ height: '100%', background: '#FEE2E2' }}></div>
                            <span className="bar-label">Spend<br/>Plan</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar-fill" data-val={formatCurrency(analysis.total_actual_expenses)} style={{ height: `${(analysis.total_actual_expenses / analysis.total_expected_expenses) * 100}%`, background: '#EF4444' }}></div>
                            <span className="bar-label">Spend<br/>Actual</span>
                        </div>
                    </div>
                </div>

                <div className="viz-card">
                    <div className="viz-header">
                        <h3><Zap size={20} color="#6366F1" /> Budget Load</h3>
                    </div>
                    <div className="donut-wrap">
                        <svg className="donut-svg" width="180" height="180">
                            <circle className="donut-bg" cx="90" cy="90" r="75" />
                            <circle 
                                className="donut-progress" 
                                cx="90" cy="90" r="75" 
                                strokeDasharray={`${(budgetAdherence / 100) * 471} 471`}
                            />
                        </svg>
                        <div className="donut-center">
                            <span className="donut-val">{budgetAdherence.toFixed(0)}%</span>
                            <span className="donut-lbl">Utilized</span>
                        </div>
                    </div>
                    <div className="legend">
                        <div className="legend-item">
                            <div className="flex items-center gap-2">
                                <div className="legend-dot"></div>
                                Allocated
                            </div>
                            <span>{formatCurrency(analysis.total_allocated_budget)}</span>
                        </div>
                        <div className="legend-item">
                            <div className="flex items-center gap-2">
                                <div className="legend-dot" style={{ background: '#F1F5F9' }}></div>
                                Spent
                            </div>
                            <span>{formatCurrency(analysis.total_spent_budget)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default PlanAnalysis;
