import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialPlanService } from '../../services';
import { 
    Home, 
    Coffee, 
    Car, 
    ShoppingBag, 
    Smartphone, 
    RotateCcw, 
    Save, 
    Plus, 
    DollarSign,
    Target,
    PieChart,
    ChevronRight,
    TrendingUp,
    Zap
} from 'lucide-react';
import { formatCurrency } from '../../lib/formatCurrency';

const ICON_MAP = {
    'Home': Home,
    'Coffee': Coffee,
    'Car': Car,
    'ShoppingBag': ShoppingBag,
    'Smartphone': Smartphone
};

const PlanBudget = () => {
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

    // Fetch Plan Budgets
    const { data: categories = [], isLoading: budgetsLoading } = useQuery({
        queryKey: ['plan-budgets', activePlanId],
        queryFn: async () => {
            if (!activePlanId) return [];
            const data = await financialPlanService.getPlanBudgets(activePlanId);
            return data.map(cat => ({
                id: cat.id,
                name: cat.name,
                allocated: parseFloat(cat.allocated_amount || cat.amount),
                icon: ICON_MAP[cat.icon_name] || Home,
                color: cat.color || 'blue'
            }));
        },
        enabled: !!activePlanId
    });

    const saveMutation = useMutation({
        mutationFn: (data) => financialPlanService.updatePlanBudget(activePlanId, data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-budgets', activePlanId] });
        }
    });

    // Fetch analysis for total income
    const { data: analysis } = useQuery({
        queryKey: ['plan-analysis', activePlanId],
        queryFn: async () => {
            if (!activePlanId) return null;
            const res = await financialPlanService.getPlanAnalysis(activePlanId);
            return res.data || res;
        },
        enabled: !!activePlanId
    });

    const totalIncome = analysis?.total_expected_income || 0;
    const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
    const remaining = totalIncome - totalAllocated;
    const allocationPercent = totalIncome > 0 ? (totalAllocated / totalIncome) * 100 : 0;

    const isLoading = plansLoading || (activePlanId && budgetsLoading);

    if (isLoading) {
        return (
            <div className="module-loader">
                <div className="spinner-wrap">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="budget-module">
            <style>{`
                .budget-module { font-family: 'Inter', sans-serif; color: #0F172A; }
                .module-loader { display: flex; justify-content: center; align-items: center; min-height: 400px; }
                .spinner { width: 40px; height: 40px; border: 3px solid #F1F5F9; border-top-color: #3B82F6; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .top-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .mini-stat-card { background: white; padding: 1.5rem; border-radius: 24px; border: 1px solid #F1F5F9; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
                .mini-label { display: block; font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }
                .mini-value { font-size: 1.75rem; font-weight: 900; letter-spacing: -1px; }
                
                .allocation-overview { background: #0F172A; color: white; padding: 2rem; border-radius: 32px; margin-bottom: 2.5rem; position: relative; overflow: hidden; }
                .overview-content { position: relative; z-index: 2; }
                .overview-label { font-size: 12px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
                .overview-title { font-size: 2rem; font-weight: 900; margin: 0.5rem 0 1.5rem; }
                .progress-track { width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 20px; overflow: hidden; margin-bottom: 1rem; }
                .progress-fill { height: 100%; background: linear-gradient(90deg, #3B82F6, #60A5FA); border-radius: 20px; transition: width 1s ease-out; }
                .overview-meta { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #94A3B8; }
                .meta-value { color: white; }

                .budget-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .category-card { background: white; padding: 1.5rem; border-radius: 28px; border: 1px solid #F1F5F9; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .category-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); border-color: #3B82F6; }
                
                .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .cat-icon-box { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
                .cat-name { font-weight: 800; font-size: 16px; color: #1E293B; }
                
                .input-group { position: relative; }
                .input-group input { width: 100%; padding: 12px 16px 12px 32px; border-radius: 14px; border: 1px solid #F1F5F9; background: #F8FAFC; font-weight: 800; font-size: 16px; outline: none; transition: all 0.2s; }
                .input-group input:focus { border-color: #3B82F6; background: white; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
                .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }

                .add-cat-btn { background: #F8FAFC; border: 2px dashed #E2E8F0; border-radius: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; color: #94A3B8; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; min-height: 180px; }
                .add-cat-btn:hover { background: white; border-color: #3B82F6; color: #3B82F6; }
                .btn-icon-plus { width: 44px; height: 44px; border-radius: 50%; background: white; border: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

                .module-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #F1F5F9; }
                .btn-save { background: #0F172A; color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
                .btn-save:hover { background: #2563EB; transform: translateY(-1px); }
            `}</style>

            <div className="allocation-overview">
                <div className="overview-content">
                    <span className="overview-label">Portfolio Allocation</span>
                    <h1 className="overview-title">How you're spending your money</h1>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.min(allocationPercent, 100)}%` }}></div>
                    </div>
                    <div className="overview-meta">
                        <span>Allocated: <span className="meta-value">{Math.round(allocationPercent)}%</span></span>
                        <span>Remaining: <span className="meta-value">{formatCurrency(remaining)}</span></span>
                    </div>
                </div>
            </div>

            <div className="top-stats-grid">
                <div className="mini-stat-card">
                    <span className="mini-label">Monthly Income</span>
                    <h3 className="mini-value text-green-600">{formatCurrency(totalIncome)}</h3>
                </div>
                <div className="mini-stat-card">
                    <span className="mini-label">Total Allocated</span>
                    <h3 className="mini-value text-blue-600">{formatCurrency(totalAllocated)}</h3>
                </div>
                <div className="mini-stat-card">
                    <span className="mini-label">Unassigned</span>
                    <h3 className={`mini-value ${remaining < 0 ? 'text-red-500' : 'text-slate-400'}`}>{formatCurrency(remaining)}</h3>
                </div>
            </div>

            <div className="budget-grid">
                {categories.map((cat) => (
                    <div key={cat.id} className="category-card">
                        <div className="cat-header">
                            <div className="flex items-center gap-3">
                                <div className="cat-icon-box" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                    <cat.icon size={22} />
                                </div>
                                <span className="cat-name">{cat.name}</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-300" />
                        </div>

                        <div className="input-group">
                            <DollarSign className="input-icon" size={16} />
                            <input 
                                type="number" 
                                value={cat.allocated} 
                                readOnly 
                                placeholder="0.00"
                            />
                        </div>

                        <div style={{ marginTop: '1rem', fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>
                            {totalAllocated > 0 ? ((cat.allocated / totalAllocated) * 100).toFixed(1) : 0}% of Total Budget
                        </div>
                    </div>
                ))}

                <button className="add-cat-btn">
                    <div className="btn-icon-plus"><Plus size={24} /></div>
                    <span>Add Category</span>
                </button>
            </div>

            <div className="module-actions">
                <button className="btn-save" onClick={() => saveMutation.mutate({ id: 1, name: 'Sample' })}>
                    <Save size={18} />
                    Save Budget Plan
                </button>
            </div>
        </div>
    );
};

export default PlanBudget;
