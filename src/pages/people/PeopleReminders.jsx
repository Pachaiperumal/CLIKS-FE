import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Bell, 
    Calendar, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    Search, 
    Plus, 
    Filter, 
    MoreVertical, 
    ArrowLeft,
    X,
    User,
    CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { peopleService } from '../../services';
import '../../App.css';

const PeopleReminders = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ person_id: '', title: '', due_date: '', message: '' });

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: remindersRes, isLoading } = useQuery({
        queryKey: ['people-reminders-all', searchTerm, statusFilter],
        queryFn: () => peopleService.getAllReminders()
    });

    const { data: people = [] } = useQuery({
        queryKey: ['people-list-dropdown'],
        queryFn: async () => {
            const res = await peopleService.getPeople();
            const rows = res.data || res;
            return Array.isArray(rows) ? rows : [];
        }
    });

    const reminders = remindersRes?.data || remindersRes || [];
    const stats = remindersRes?.meta?.stats || { due_today: 0, upcoming: 0, overdue: 0 };

    // ── Mutations ───────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data) => peopleService.createReminder(data.person_id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-reminders-all']);
            setIsModalOpen(false);
            setFormData({ person_id: '', title: '', due_date: '', message: '' });
        }
    });

    const settleMutation = useMutation({
        mutationFn: (rem) => peopleService.updateReminder(rem.person_id, rem.id, { status: 'settled' }),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-reminders-all']);
        }
    });

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const filteredReminders = Array.isArray(reminders) ? reminders.filter(r => {
        const matchesSearch = (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (r.person_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];

    if (isLoading) {
        return (
            <div className="loading-state-v2">
                <div className="premium-loader" />
                <p>Syncing reminders...</p>
            </div>
        );
    }

    return (
        <div className="people-reminders-page">
            <style>{premiumStyles}</style>

            <div className="p-header-v2">
                <div className="header-top">
                    <button className="btn-back-link" onClick={() => navigate('/books/people/overview')}>
                        <ArrowLeft size={18} />
                        <span>People Network</span>
                    </button>
                    <div className="header-actions-v2">
                        <button className="btn-primary-v2" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Set Reminder</button>
                    </div>
                </div>
                <div className="header-main">
                    <div>
                        <h1 className="p-title">Reminders & Tasks</h1>
                        <p className="p-subtitle">Track follow-ups, payment deadlines, and important interactions.</p>
                    </div>
                </div>
            </div>

            <div className="p-stats-grid">
                <div className="p-stat-card blue">
                    <div className="card-icon"><Calendar size={24} /></div>
                    <div className="card-content">
                        <span className="label">Due Today</span>
                        <span className="val">{stats.due_today || 0}</span>
                    </div>
                </div>
                <div className="p-stat-card amber">
                    <div className="card-icon"><Clock size={24} /></div>
                    <div className="card-content">
                        <span className="label">Upcoming</span>
                        <span className="val">{stats.upcoming || 0}</span>
                    </div>
                </div>
                <div className="p-stat-card red">
                    <div className="card-icon"><AlertCircle size={24} /></div>
                    <div className="card-content">
                        <span className="label">Overdue</span>
                        <span className="val">{stats.overdue || 0}</span>
                    </div>
                </div>
            </div>

            <div className="p-content-container">
                <div className="p-toolbar">
                    <div className="p-search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by title or contact..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="p-filter-group">
                        <select className="p-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="settled">Settled</option>
                        </select>
                        <button className="btn-icon-filter"><Filter size={18} /></button>
                    </div>
                </div>

                <div className="reminders-list-v2">
                    {filteredReminders.length === 0 ? (
                        <div className="empty-state-p">
                            <Bell size={40} className="empty-icon" />
                            <p>No reminders found.</p>
                        </div>
                    ) : filteredReminders.map(rem => (
                        <div key={rem.id} className={`rem-card-v2 ${rem.status}`}>
                            <div className="rem-main-info">
                                <div className="rem-person">
                                    <div className="avatar-mini">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${rem.person_name}`} alt="" />
                                    </div>
                                    <span onClick={() => navigate(`/books/people/${rem.person_id}`)}>{rem.person_name}</span>
                                </div>
                                <h3 className="rem-title">{rem.title}</h3>
                                <p className="rem-msg">{rem.message}</p>
                            </div>
                            <div className="rem-meta-info">
                                <div className="rem-date-box">
                                    <Clock size={14} />
                                    <span>{new Date(rem.due_date).toLocaleDateString()}</span>
                                </div>
                                <div className="rem-actions-row">
                                    <span className={`status-badge ${rem.status}`}>{rem.status}</span>
                                    {rem.status !== 'settled' && (
                                        <button className="btn-settle" onClick={() => settleMutation.mutate(rem)}>
                                            <CheckCircle2 size={14} />
                                            Mark Settled
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Set Reminder Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="modal-content-premium">
                            <div className="modal-header-premium">
                                <div>
                                    <h3 className="modal-title">Set New Reminder</h3>
                                    <p className="modal-subtitle">Schedule a follow-up or deadline</p>
                                </div>
                                <button className="close-btn-premium" onClick={() => setIsModalOpen(false)}>
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
                                        >
                                            <option value="">Choose a contact...</option>
                                            {people.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Reminder Title</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="e.g. Payment Follow-up"
                                            className="premium-input"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Due Date</label>
                                        <input 
                                            type="date" 
                                            required 
                                            className="premium-input"
                                            value={formData.due_date}
                                            onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Message / Details</label>
                                        <textarea 
                                            rows="3"
                                            placeholder="Add extra context here..."
                                            className="premium-input"
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer-premium">
                                    <button type="button" className="btn-cancel-premium" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit-premium" disabled={createMutation.isLoading}>
                                        {createMutation.isLoading ? 'Scheduling...' : 'Set Reminder'}
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
    .people-reminders-page { padding: 32px; max-width: 1300px; margin: 0 auto; background: #F8FAFC; min-height: 100vh; }
    
    .p-header-v2 { margin-bottom: 40px; }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .btn-back-link { display: flex; align-items: center; gap: 8px; background: none; border: none; color: #64748B; font-weight: 600; cursor: pointer; transition: color 0.2s; }
    .btn-back-link:hover { color: #195BAC; }
    
    .btn-primary-v2 { padding: 10px 24px; border-radius: 12px; background: #195BAC; color: white; border: none; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(25, 91, 172, 0.2); }
    .btn-primary-v2:hover { transform: translateY(-2px); background: #1e40af; box-shadow: 0 10px 15px -3px rgba(25, 91, 172, 0.3); }

    .p-title { font-size: 2.25rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
    .p-subtitle { color: #64748B; font-size: 1.1rem; margin: 0; font-weight: 500; }

    .p-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
    .p-stat-card { background: white; border-radius: 24px; padding: 28px; display: flex; gap: 20px; align-items: center; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .card-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
    .p-stat-card.blue .card-icon { background: #E9F4FF; color: #195BAC; }
    .p-stat-card.amber .card-icon { background: #FEF3C7; color: #D97706; }
    .p-stat-card.red .card-icon { background: #FEE2E2; color: #DC2626; }
    .card-content .label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .card-content .val { font-size: 2rem; font-weight: 900; color: #0F172A; }

    .p-content-container { background: white; border-radius: 28px; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; padding-bottom: 40px; }
    .p-toolbar { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; background: #F8FAFC; margin-bottom: 24px; }
    
    .p-search-box { position: relative; flex: 1; max-width: 450px; }
    .p-search-box svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
    .p-search-box input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 14px; border: 1.5px solid #E2E8F0; font-size: 0.95rem; background: white; transition: all 0.2s; }
    .p-search-box input:focus { outline: none; border-color: #195BAC; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }

    .p-filter-group { display: flex; gap: 12px; }
    .p-select { padding: 10px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; font-weight: 600; color: #475569; background: white; outline: none; cursor: pointer; }
    .btn-icon-filter { width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; display: flex; align-items: center; justify-content: center; cursor: pointer; }

    .reminders-list-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; padding: 0 32px; }
    .rem-card-v2 { background: #F8FAFC; border-radius: 24px; padding: 24px; border: 1px solid #F1F5F9; border-left: 6px solid #195BAC; display: flex; flex-direction: column; justify-content: space-between; min-height: 200px; transition: all 0.2s; }
    .rem-card-v2:hover { background: white; box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1); transform: translateY(-4px); }
    .rem-card-v2.overdue { border-left-color: #DC2626; }
    .rem-card-v2.settled { border-left-color: #CBD5E1; opacity: 0.7; }

    .rem-person { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .avatar-mini { width: 28px; height: 28px; border-radius: 8px; background: white; overflow: hidden; }
    .rem-person span { font-size: 0.85rem; font-weight: 700; color: #195BAC; cursor: pointer; }
    .rem-person span:hover { text-decoration: underline; }

    .rem-title { font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
    .rem-msg { color: #64748B; font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px; }

    .rem-meta-info { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #E2E8F0; }
    .rem-date-box { display: flex; align-items: center; gap: 6px; color: #94A3B8; font-size: 0.8rem; font-weight: 700; }
    .rem-actions-row { display: flex; align-items: center; gap: 12px; }
    
    .status-badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; }
    .status-badge.pending { background: #E9F4FF; color: #195BAC; }
    .status-badge.overdue { background: #FEE2E2; color: #DC2626; }
    .status-badge.settled { background: #F1F5F9; color: #64748B; }

    .btn-settle { background: white; border: 1px solid #E2E8F0; color: #475569; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; }
    .btn-settle:hover { background: #DCFCE7; color: #16A34A; border-color: #16A34A; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
    .modal-content-premium { background: white; width: 100%; max-width: 480px; border-radius: 28px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.3); overflow: hidden; }
    .modal-header-premium { padding: 24px 32px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0; }
    .modal-subtitle { font-size: 0.85rem; color: #64748B; margin: 4px 0 0 0; }
    .close-btn-premium { background: #F8FAFC; border: none; color: #64748B; padding: 8px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .close-btn-premium:hover { background: #F1F5F9; color: #0F172A; }
    .modal-form-premium { padding: 32px; }
    .form-section { display: flex; flex-direction: column; gap: 20px; }
    .form-group-premium { display: flex; flex-direction: column; gap: 8px; }
    .form-group-premium label { font-size: 0.85rem; font-weight: 700; color: #334155; }
    .premium-input { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; font-size: 1rem; color: #0F172A; background: #F8FAFC; transition: all 0.2s; }
    .premium-input:focus { outline: none; border-color: #195BAC; background: white; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }
    .modal-footer-premium { display: flex; gap: 12px; margin-top: 32px; }
    .btn-cancel-premium { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; font-weight: 700; cursor: pointer; }
    .btn-submit-premium { flex: 2; padding: 12px; border-radius: 12px; border: none; background: #195BAC; color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(25, 91, 172, 0.2); }

    .loading-state-v2 { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #64748B; font-weight: 600; }
    .premium-loader { width: 48px; height: 48px; border: 4px solid #E2E8F0; border-top-color: #195BAC; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state-p { padding: 80px; text-align: center; color: #94A3B8; grid-column: 1 / -1; }
    .empty-icon { margin-bottom: 16px; opacity: 0.5; }
`;

export default PeopleReminders;
