import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Search, 
    Tag, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Edit2, 
    Trash2, 
    Plus, 
    Filter, 
    Download,
    TrendingUp,
    TrendingDown,
    Calendar,
    User,
    ArrowLeft,
    Coins,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { peopleService } from '../../services';
import '../../App.css';
import { formatCurrency } from '../../lib/formatCurrency';

const PeopleTransactions = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [formData, setFormData] = useState({ person_id: '', type: 'lent', amount: '', date: new Date().toISOString().split('T')[0], description: '', category: '' });

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['people-transactions-all', searchTerm, typeFilter],
        queryFn: async () => {
            const res = await peopleService.getAllTransactions();
            const rows = res.data || res;
            return Array.isArray(rows) ? rows : [];
        }
    });

    const { data: people = [] } = useQuery({
        queryKey: ['people-list-dropdown'],
        queryFn: async () => {
            const res = await peopleService.getPeople();
            const rows = res.data || res;
            return Array.isArray(rows) ? rows : [];
        }
    });

    // ── Mutations ───────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data) => peopleService.createTransaction(data.person_id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-transactions-all']);
            closeModal();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data) => peopleService.updateTransaction(data.person_id, data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-transactions-all']);
            closeModal();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (txn) => peopleService.deleteTransaction(txn.person_id, txn.id),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-transactions-all']);
        }
    });

    // ── Handlers ────────────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingTx(null);
        setFormData({ person_id: '', type: 'lent', amount: '', date: new Date().toISOString().split('T')[0], description: '', category: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (txn) => {
        setEditingTx(txn);
        setFormData({ 
            id: txn.id,
            person_id: txn.person_id, 
            type: txn.type, 
            amount: txn.amount, 
            date: txn.date, 
            description: txn.description, 
            category: txn.category || '' 
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTx(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingTx) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (txn) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            deleteMutation.mutate(txn);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (t.person_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const stats = {
        totalLent: transactions.filter(t => t.type === 'lent').reduce((s, t) => s + Number(t.amount || 0), 0),
        totalBorrowed: transactions.filter(t => t.type === 'borrowed').reduce((s, t) => s + Number(t.amount || 0), 0),
    };

    if (isLoading) {
        return (
            <div className="loading-state-v2">
                <div className="premium-loader" />
                <p>Curating transactions...</p>
            </div>
        );
    }

    return (
        <div className="people-transactions-page">
            <style>{premiumStyles}</style>

            <div className="p-header-v2">
                <div className="header-top">
                    <button className="btn-back-link" onClick={() => navigate('/books/people/overview')}>
                        <ArrowLeft size={18} />
                        <span>People Network</span>
                    </button>
                    <div className="header-actions-v2">
                        <button className="btn-secondary-v2"><Download size={16} /> Export CSV</button>
                        <button className="btn-primary-v2" onClick={openAddModal}><Plus size={18} /> Add Transaction</button>
                    </div>
                </div>
                <div className="header-main">
                    <div>
                        <h1 className="p-title">People Transactions</h1>
                        <p className="p-subtitle">Unified history of all lending and borrowing activities across your network.</p>
                    </div>
                </div>
            </div>

            <div className="p-stats-grid">
                <div className="p-stat-card green">
                    <div className="card-icon"><TrendingUp size={24} /></div>
                    <div className="card-content">
                        <span className="label">Overall Lent</span>
                        <span className="val">{formatCurrency(stats.totalLent)}</span>
                    </div>
                </div>
                <div className="p-stat-card red">
                    <div className="card-icon"><TrendingDown size={24} /></div>
                    <div className="card-content">
                        <span className="label">Overall Borrowed</span>
                        <span className="val">{formatCurrency(stats.totalBorrowed)}</span>
                    </div>
                </div>
                <div className="p-stat-card blue">
                    <div className="card-icon"><Coins size={24} /></div>
                    <div className="card-content">
                        <span className="label">Net Exposure</span>
                        <span className="val">{formatCurrency(stats.totalLent - stats.totalBorrowed)}</span>
                    </div>
                </div>
            </div>

            <div className="p-content-container">
                <div className="p-toolbar">
                    <div className="p-search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by contact or description..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="p-filter-group">
                        <select className="p-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="lent">Lent Only</option>
                            <option value="borrowed">Borrowed Only</option>
                        </select>
                        <button className="btn-icon-filter"><Filter size={18} /></button>
                    </div>
                </div>

                <div className="p-table-container">
                    <div className="p-table-header">
                        <div className="col-date">Date</div>
                        <div className="col-person">Contact</div>
                        <div className="col-desc">Description</div>
                        <div className="col-type">Type</div>
                        <div className="col-amount text-right">Amount</div>
                        <div className="col-actions"></div>
                    </div>
                    <div className="p-table-body">
                        {filteredTransactions.length === 0 ? (
                            <div className="empty-state-p">
                                <Search size={40} className="empty-icon" />
                                <p>No matching transactions found.</p>
                            </div>
                        ) : filteredTransactions.map(txn => (
                            <div key={txn.id} className="p-table-row">
                                <div className="col-date">
                                    <div className="date-box">
                                        <Calendar size={14} />
                                        <span>{new Date(txn.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="col-person">
                                    <div className="person-box" onClick={() => navigate(`/books/people/${txn.person_id}`)}>
                                        <div className="avatar-mini">
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${txn.person_name}`} alt="" />
                                        </div>
                                        <span>{txn.person_name}</span>
                                    </div>
                                </div>
                                <div className="col-desc">
                                    <span className="desc-text">{txn.description}</span>
                                    <span className="cat-tag">{txn.category || 'General'}</span>
                                </div>
                                <div className="col-type">
                                    <span className={`type-badge ${txn.type}`}>{txn.type}</span>
                                </div>
                                <div className={`col-amount text-right font-bold ${txn.type}`}>
                                    {txn.type === 'lent' ? '+' : '-'}{formatCurrency(txn.amount)}
                                </div>
                                <div className="col-actions">
                                    <div className="actions-group">
                                        <button className="icon-btn-p" onClick={() => openEditModal(txn)}><Edit2 size={16} /></button>
                                        <button className="icon-btn-p danger" onClick={() => handleDelete(txn)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="modal-content-premium">
                            <div className="modal-header-premium">
                                <div>
                                    <h3 className="modal-title">{editingTx ? 'Edit Transaction' : 'Record Transaction'}</h3>
                                    <p className="modal-subtitle">{editingTx ? 'Modify existing entry details' : 'Add a new lending or borrowing entry'}</p>
                                </div>
                                <button className="close-btn-premium" onClick={closeModal}>
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="modal-form-premium">
                                <div className="form-section">
                                    <div className="form-group-premium">
                                        <label>Select Contact</label>
                                        <select 
                                            required 
                                            className="premium-input"
                                            value={formData.person_id}
                                            onChange={(e) => setFormData({...formData, person_id: e.target.value})}
                                            disabled={!!editingTx}
                                        >
                                            <option value="">Select a person...</option>
                                            {people.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row-premium">
                                        <div className="form-group-premium">
                                            <label>Entry Type</label>
                                            <select 
                                                className="premium-input"
                                                value={formData.type}
                                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                            >
                                                <option value="lent">I Lent Money</option>
                                                <option value="borrowed">I Borrowed Money</option>
                                            </select>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Amount (₹)</label>
                                            <input 
                                                type="number" 
                                                required 
                                                placeholder="0.00"
                                                className="premium-input"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Transaction Date</label>
                                        <input 
                                            type="date" 
                                            required 
                                            className="premium-input"
                                            value={formData.date}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Description</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Lunch at Cafe"
                                            className="premium-input"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer-premium">
                                    <button type="button" className="btn-cancel-premium" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn-submit-premium" disabled={createMutation.isLoading || updateMutation.isLoading}>
                                        {createMutation.isLoading || updateMutation.isLoading ? 'Processing...' : (editingTx ? 'Update Entry' : 'Record Transaction')}
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

const premiumStyles = `
    .people-transactions-page { padding: 32px; max-width: 1300px; margin: 0 auto; background: #F8FAFC; min-height: 100vh; }
    
    .p-header-v2 { margin-bottom: 40px; }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .btn-back-link { display: flex; align-items: center; gap: 8px; background: none; border: none; color: #64748B; font-weight: 600; cursor: pointer; transition: color 0.2s; }
    .btn-back-link:hover { color: #195BAC; }
    
    .header-actions-v2 { display: flex; gap: 12px; }
    .btn-secondary-v2 { padding: 10px 20px; border-radius: 12px; border: 1px solid #E2E8F0; background: white; color: #475569; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
    .btn-secondary-v2:hover { background: #F1F5F9; border-color: #CBD5E1; }
    .btn-primary-v2 { padding: 10px 24px; border-radius: 12px; background: #195BAC; color: white; border: none; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(25, 91, 172, 0.2); }
    .btn-primary-v2:hover { transform: translateY(-2px); background: #1e40af; box-shadow: 0 10px 15px -3px rgba(25, 91, 172, 0.3); }

    .p-title { font-size: 2.25rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
    .p-subtitle { color: #64748B; font-size: 1.1rem; margin: 0; font-weight: 500; }

    .p-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
    .p-stat-card { background: white; border-radius: 24px; padding: 28px; display: flex; gap: 20px; align-items: center; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .card-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
    .p-stat-card.green .card-icon { background: #DCFCE7; color: #16A34A; }
    .p-stat-card.red .card-icon { background: #FEE2E2; color: #DC2626; }
    .p-stat-card.blue .card-icon { background: #E9F4FF; color: #195BAC; }
    .card-content .label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .card-content .val { font-size: 1.75rem; font-weight: 900; color: #0F172A; }

    .p-content-container { background: white; border-radius: 28px; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; }
    .p-toolbar { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; background: #F8FAFC; }
    
    .p-search-box { position: relative; flex: 1; max-width: 450px; }
    .p-search-box svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
    .p-search-box input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 14px; border: 1.5px solid #E2E8F0; font-size: 0.95rem; background: white; transition: all 0.2s; }
    .p-search-box input:focus { outline: none; border-color: #195BAC; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }

    .p-filter-group { display: flex; gap: 12px; }
    .p-select { padding: 10px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; font-weight: 600; color: #475569; background: white; outline: none; cursor: pointer; }
    .btn-icon-filter { width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; display: flex; align-items: center; justify-content: center; cursor: pointer; }

    .p-table-header { display: grid; grid-template-columns: 140px 220px 1fr 120px 180px 100px; padding: 20px 32px; background: #F8FAFC; border-bottom: 1.5px solid #E2E8F0; font-size: 0.8rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
    .p-table-row { display: grid; grid-template-columns: 140px 220px 1fr 120px 180px 100px; padding: 20px 32px; border-bottom: 1px solid #F1F5F9; align-items: center; transition: all 0.2s; }
    .p-table-row:hover { background: #F8FAFC; }

    .date-box { display: flex; align-items: center; gap: 8px; color: #64748B; font-size: 0.9rem; font-weight: 600; }
    .person-box { display: flex; align-items: center; gap: 12px; cursor: pointer; }
    .person-box:hover span { color: #195BAC; text-decoration: underline; }
    .avatar-mini { width: 32px; height: 32px; border-radius: 10px; background: #E9F4FF; overflow: hidden; }
    .person-box span { font-weight: 700; color: #1E293B; }

    .desc-text { display: block; font-weight: 700; color: #334155; margin-bottom: 4px; }
    .cat-tag { font-size: 0.75rem; color: #94A3B8; font-weight: 600; background: #F1F5F9; padding: 2px 8px; border-radius: 6px; }

    .type-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; }
    .type-badge.lent { background: #DCFCE7; color: #16A34A; }
    .type-badge.borrowed { background: #FEE2E2; color: #DC2626; }

    .col-amount { font-size: 1.15rem; }
    .col-amount.lent { color: #16A34A; }
    .col-amount.borrowed { color: #DC2626; }

    .actions-group { display: flex; gap: 8px; justify-content: flex-end; }
    .icon-btn-p { padding: 8px; border-radius: 10px; border: none; background: #F1F5F9; color: #64748B; cursor: pointer; transition: all 0.2s; }
    .icon-btn-p:hover { background: #E9F4FF; color: #195BAC; }
    .icon-btn-p.danger:hover { background: #FEE2E2; color: #EF4444; }

    .loading-state-v2 { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #64748B; font-weight: 600; }
    .premium-loader { width: 48px; height: 48px; border: 4px solid #E2E8F0; border-top-color: #195BAC; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state-p { padding: 80px; text-align: center; color: #94A3B8; }
    .empty-icon { margin-bottom: 16px; opacity: 0.5; }
    .font-bold { font-weight: 800; }
    .text-right { text-align: right; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-content-premium { background: white; width: 100%; max-width: 500px; border-radius: 28px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.3); overflow: hidden; }
    .modal-header-premium { padding: 24px 32px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0; }
    .modal-subtitle { font-size: 0.85rem; color: #64748B; margin: 4px 0 0 0; }
    .close-btn-premium { background: #F8FAFC; border: none; color: #64748B; padding: 8px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .close-btn-premium:hover { background: #F1F5F9; color: #0F172A; }
    .modal-form-premium { padding: 32px; }
    .form-section { display: flex; flex-direction: column; gap: 20px; }
    .form-group-premium { display: flex; flex-direction: column; gap: 8px; }
    .form-group-premium label { font-size: 0.85rem; font-weight: 700; color: #334155; }
    .form-row-premium { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .premium-input { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; font-size: 1rem; color: #0F172A; background: #F8FAFC; transition: all 0.2s; }
    .premium-input:focus { outline: none; border-color: #195BAC; background: white; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }
    .modal-footer-premium { display: flex; gap: 12px; margin-top: 32px; }
    .btn-cancel-premium { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; font-weight: 700; cursor: pointer; }
    .btn-submit-premium { flex: 2; padding: 12px; border-radius: 12px; border: none; background: #195BAC; color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(25, 91, 172, 0.2); }
`;

export default PeopleTransactions;
