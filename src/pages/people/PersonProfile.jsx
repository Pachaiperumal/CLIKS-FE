import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Briefcase, 
    Calendar, 
    ArrowLeft, 
    Plus, 
    Edit2, 
    Trash2,
    FileText,
    Coins,
    Bell,
    Wallet,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    Eye,
    History,
    Loader2,
    X,
    ArrowUpRight,
    ArrowDownLeft,
    FilePlus,
    PlusCircle
} from 'lucide-react';
import { peopleService, goalWalletService } from '../../services';
import '../../App.css';
import { formatCurrency } from '../../lib/formatCurrency';

const PersonProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('Overview');

    // ── Modal States ───────────────────────────────────────────────────────
    const [modalType, setModalType] = useState(null); // 'transaction', 'note', 'reminder', 'wallet'
    const [formData, setFormData] = useState({});

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: person, isLoading: isPersonLoading } = useQuery({
        queryKey: ['person', id],
        queryFn: () => peopleService.getPersonById(id).then(res => res.data || res),
    });

    const { data: transactions = [], isLoading: isTxLoading } = useQuery({
        queryKey: ['person-transactions', id],
        queryFn: () => peopleService.getTransactions(id).then(res => res.data || res),
    });

    const { data: records = [], isLoading: isRecordsLoading } = useQuery({
        queryKey: ['person-records', id],
        queryFn: () => peopleService.getRecords(id).then(res => res.data || res),
    });

    const { data: reminders = [], isLoading: isRemindersLoading } = useQuery({
        queryKey: ['person-reminders', id],
        queryFn: () => peopleService.getReminders(id).then(res => res.data || res),
    });

    const { data: wallets = [], isLoading: isWalletsLoading } = useQuery({
        queryKey: ['person-wallets', id],
        queryFn: () => goalWalletService.getWallets({ person_id: id }).then(res => res.data || res),
    });

    // ── Mutations ───────────────────────────────────────────────────────────
    const createTxMutation = useMutation({
        mutationFn: (data) => peopleService.createTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['person-transactions', id]);
            setModalType(null);
        }
    });

    const createNoteMutation = useMutation({
        mutationFn: (data) => peopleService.createRecord(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['person-records', id]);
            setModalType(null);
        }
    });

    const createReminderMutation = useMutation({
        mutationFn: (data) => peopleService.createReminder(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['person-reminders', id]);
            setModalType(null);
        }
    });

    const createWalletMutation = useMutation({
        mutationFn: (data) => goalWalletService.createWallet({ ...data, person_id: id }),
        onSuccess: () => {
            queryClient.invalidateQueries(['person-wallets', id]);
            setModalType(null);
        }
    });

    // ── Summary Logic ───────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const rows = transactions.data || transactions;
        const txList = Array.isArray(rows) ? rows : [];
        const lent = txList.filter(t => t.type === 'lent').reduce((s, t) => s + t.amount, 0);
        const borrowed = txList.filter(t => t.type === 'borrowed').reduce((s, t) => s + t.amount, 0);
        
        const remRows = reminders.data || reminders;
        const remList = Array.isArray(remRows) ? remRows : [];

        const wallRows = wallets.data || wallets;
        const wallList = Array.isArray(wallRows) ? wallRows : [];

        return {
            totalLent: lent,
            totalBorrowed: borrowed,
            netBalance: lent - borrowed,
            activeWallets: wallList.filter(w => w.status === 'active').length,
            pendingReminders: remList.filter(r => r.status !== 'settled').length
        };
    }, [transactions, wallets, reminders]);

    if (isPersonLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 size={40} className="animate-spin text-primary mb-4" />
                <p className="text-muted font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!person) return <div className="p-12 text-center text-muted">Person not found.</div>;

    const tabs = ['Overview', 'Notes', 'Money', 'Wallets', 'Reminders'];

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (modalType === 'transaction') createTxMutation.mutate(formData);
        if (modalType === 'note') createNoteMutation.mutate(formData);
        if (modalType === 'reminder') createReminderMutation.mutate(formData);
        if (modalType === 'wallet') createWalletMutation.mutate(formData);
    };

    return (
        <div className="profile-page-v2">
            <style>{premiumStyles}</style>
            
            {/* Nav Header */}
            <div className="profile-nav-header">
                <button className="back-link" onClick={() => navigate('/books/people/overview')}>
                    <ArrowLeft size={18} />
                    <span>People Network</span>
                </button>
                <div className="action-btns">
                    <button className="btn-circle-outline"><Edit2 size={16} /></button>
                    <button className="btn-circle-danger"><Trash2 size={16} /></button>
                </div>
            </div>

            {/* Profile Summary Card */}
            <div className="person-identity-card">
                <div className="identity-left">
                    <div className="identity-avatar-container">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${person.name}`} alt="" />
                        <div className={`status-dot ${person.status || 'active'}`}></div>
                    </div>
                    <div className="identity-text">
                        <div className="identity-name-row">
                            <h1>{person.name}</h1>
                            <span className={`badge-role ${person.role_type}`}>{person.role_type}</span>
                        </div>
                        <div className="identity-meta-row">
                            {person.phone && <span><Phone size={12} /> {person.phone}</span>}
                            {person.email && <span><Mail size={12} /> {person.email}</span>}
                            {person.company && <span><Briefcase size={12} /> {person.company}</span>}
                        </div>
                    </div>
                </div>
                <div className="identity-right">
                    <div className="net-worth-display">
                        <span className="label">Financial Standing</span>
                        <div className={`value ${stats.netBalance >= 0 ? 'pos' : 'neg'}`}>
                            {stats.netBalance >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            {formatCurrency(Math.abs(stats.netBalance))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Selector */}
            <div className="premium-tabs">
                {tabs.map(tab => (
                    <button 
                        key={tab} 
                        className={`p-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                        {activeTab === tab && <motion.div layoutId="activeTab" className="active-line" />}
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            <div className="p-tab-panel">
                <AnimatePresence mode="wait">
                    {activeTab === 'Overview' && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} key="ov">
                            <div className="ov-grid">
                                <div className="ov-main">
                                    <div className="ov-stats-row">
                                        <div className="ov-stat-tile green">
                                            <div className="tile-icon"><ArrowUpRight size={20} /></div>
                                            <div className="tile-body">
                                                <span className="label">Total Lent</span>
                                                <span className="val">{formatCurrency(stats.totalLent)}</span>
                                            </div>
                                        </div>
                                        <div className="ov-stat-tile red">
                                            <div className="tile-icon"><ArrowDownLeft size={20} /></div>
                                            <div className="tile-body">
                                                <span className="label">Total Borrowed</span>
                                                <span className="val">{formatCurrency(stats.totalBorrowed)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ov-section">
                                        <div className="sec-header">
                                            <h3>Recent Activity</h3>
                                            <button className="sec-link">View All</button>
                                        </div>
                                        <div className="timeline-list">
                                            {(() => {
                                                const txs = transactions.data || transactions;
                                                const rems = reminders.data || reminders;
                                                const recs = records.data || records;
                                                const list = [...(Array.isArray(txs) ? txs : []), ...(Array.isArray(rems) ? rems : []), ...(Array.isArray(recs) ? recs : [])]
                                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                    .slice(0, 4);
                                                
                                                return list.length > 0 ? list.map((item, i) => (
                                                    <div className="timeline-item" key={i}>
                                                        <div className="time-line"></div>
                                                        <div className="item-icon-box">
                                                            {item.amount !== undefined ? <Coins size={14} /> : item.due_date ? <Bell size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <div className="item-content">
                                                            <div className="item-title">{item.description || item.title}</div>
                                                            <div className="item-time">{new Date(item.created_at).toLocaleDateString()}</div>
                                                        </div>
                                                        {item.amount !== undefined && <div className={`item-val ${item.type}`}>{formatCurrency(item.amount)}</div>}
                                                    </div>
                                                )) : <div className="empty-state-mini">No recent activities found</div>;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="ov-sidebar">
                                    <div className="ov-section">
                                        <div className="sec-header">
                                            <h3>Reminders</h3>
                                            <button className="btn-plus-small" onClick={() => { setModalType('reminder'); setFormData({ title: '', due_date: '', message: '' }); }}><Plus size={14} /></button>
                                        </div>
                                        <div className="mini-rem-stack">
                                            {(() => {
                                                const rems = reminders.data || reminders;
                                                const list = Array.isArray(rems) ? rems.filter(r => r.status !== 'settled').slice(0, 3) : [];
                                                return list.length > 0 ? list.map(r => (
                                                    <div className="mini-reminder-card" key={r.id}>
                                                        <div className="m-rem-info">
                                                            <span className="m-rem-title">{r.title}</span>
                                                            <span className="m-rem-date">{new Date(r.due_date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="m-rem-status">Pending</div>
                                                    </div>
                                                )) : <div className="empty-state-mini">All caught up!</div>;
                                            })()}
                                        </div>
                                    </div>

                                    <div className="ov-section mt-6">
                                        <h3>Contact Notes</h3>
                                        <div className="notes-preview-card">
                                            <p>{person.notes || "No general notes for this contact."}</p>
                                            <div className="note-tags">
                                                <span className="tag">Relationship: {person.relationship || 'Friend'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Notes' && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} key="no">
                            <div className="tab-header-row">
                                <div>
                                    <h2 className="tab-title">Records & Documents</h2>
                                    <p className="tab-desc">Stored documents and personal notes for this contact.</p>
                                </div>
                                <button className="btn-premium-action" onClick={() => { setModalType('note'); setFormData({ title: '', notes: '' }); }}>
                                    <FilePlus size={18} />
                                    <span>Add Record</span>
                                </button>
                            </div>
                            <div className="records-grid-v2">
                                {(() => {
                                    const recs = records.data || records;
                                    const list = Array.isArray(recs) ? recs : [];
                                    return list.length > 0 ? list.map(rec => (
                                        <div className="record-tile" key={rec.id}>
                                            <div className="rec-icon-bg"><FileText size={24} /></div>
                                            <div className="rec-body">
                                                <h4>{rec.title}</h4>
                                                <span className="rec-date">{new Date(rec.created_at).toLocaleDateString()}</span>
                                                <p>{rec.notes}</p>
                                            </div>
                                            <div className="rec-actions">
                                                <button className="icon-btn-v2"><Download size={16} /></button>
                                                <button className="icon-btn-v2"><Eye size={16} /></button>
                                            </div>
                                        </div>
                                    )) : <div className="empty-state-v2">No records found. Click "Add Record" to start.</div>;
                                })()}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Money' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="mn">
                            <div className="tab-header-row">
                                <div>
                                    <h2 className="tab-title">Money Trail</h2>
                                    <p className="tab-desc">Full history of lending and borrowing with this person.</p>
                                </div>
                                <button className="btn-premium-action" onClick={() => { setModalType('transaction'); setFormData({ type: 'lent', amount: '', date: new Date().toISOString().split('T')[0], description: '' }); }}>
                                    <PlusCircle size={18} />
                                    <span>Record Entry</span>
                                </button>
                            </div>
                            <div className="tx-table-v2">
                                <div className="tx-table-header">
                                    <span>Type</span>
                                    <span>Description</span>
                                    <span>Date</span>
                                    <span className="text-right">Amount</span>
                                </div>
                                {(() => {
                                    const txs = transactions.data || transactions;
                                    const list = Array.isArray(txs) ? txs : [];
                                    return list.length > 0 ? list.map(tx => (
                                        <div className="tx-table-row" key={tx.id}>
                                            <div className={`tx-type-tag ${tx.type}`}>{tx.type}</div>
                                            <div className="tx-desc-cell">{tx.description}</div>
                                            <div className="tx-date-cell">{new Date(tx.date).toLocaleDateString()}</div>
                                            <div className={`tx-amount-cell ${tx.type}`}>{formatCurrency(tx.amount)}</div>
                                        </div>
                                    )) : <div className="empty-state-v2">No money transactions found.</div>;
                                })()}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Wallets' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="wa">
                            <div className="tab-header-row">
                                <div>
                                    <h2 className="tab-title">Goal Wallets</h2>
                                    <p className="tab-desc">Special funds dedicated for purposes involving this person.</p>
                                </div>
                                <button className="btn-premium-action" onClick={() => { setModalType('wallet'); setFormData({ name: '', target_amount: '', description: '' }); }}>
                                    <Wallet size={18} />
                                    <span>New Wallet</span>
                                </button>
                            </div>
                            <div className="wallets-grid-v2">
                                {(() => {
                                    const walls = wallets.data || wallets;
                                    const list = Array.isArray(walls) ? walls : [];
                                    return list.length > 0 ? list.map(w => (
                                        <div className="wallet-card-v2" key={w.id}>
                                            <div className="w-icon-row">
                                                <div className="w-icon"><Wallet size={20} /></div>
                                                <div className={`w-status ${w.status}`}>{w.status}</div>
                                            </div>
                                            <h4 className="w-name">{w.name}</h4>
                                            <p className="w-desc">{w.description}</p>
                                            <div className="w-progress-box">
                                                <div className="w-labels">
                                                    <span>{Math.round((w.current_amount / w.target_amount) * 100)}%</span>
                                                    <span>{formatCurrency(w.target_amount)}</span>
                                                </div>
                                                <div className="w-bar-bg">
                                                    <div className="w-bar-fill" style={{ width: `${Math.min(100, (w.current_amount / w.target_amount) * 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <div className="empty-state-v2">No wallets linked yet.</div>;
                                })()}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Reminders' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} key="re">
                            <div className="tab-header-row">
                                <div>
                                    <h2 className="tab-title">Reminders & Tasks</h2>
                                    <p className="tab-desc">Manage follow-ups, payment deadlines, and interactions.</p>
                                </div>
                                <button className="btn-premium-action" onClick={() => { setModalType('reminder'); setFormData({ title: '', due_date: '', message: '' }); }}>
                                    <Bell size={18} />
                                    <span>Set Reminder</span>
                                </button>
                            </div>
                            <div className="reminders-list-v2">
                                {(() => {
                                    const rems = reminders.data || reminders;
                                    const list = Array.isArray(rems) ? rems : [];
                                    return list.length > 0 ? list.map(rem => (
                                        <div className={`rem-card-v2 ${rem.status}`} key={rem.id}>
                                            <div className="rem-header">
                                                <div className="rem-title-box">
                                                    <Clock size={16} />
                                                    <h4>{rem.title}</h4>
                                                </div>
                                                <div className="rem-date-box">{new Date(rem.due_date).toLocaleDateString()}</div>
                                            </div>
                                            <p className="rem-msg">{rem.message}</p>
                                            <div className="rem-footer">
                                                <span className="rem-status-v2">{rem.status}</span>
                                                <button className="btn-mark-done">Mark Settled</button>
                                            </div>
                                        </div>
                                    )) : <div className="empty-state-v2">No reminders scheduled.</div>;
                                })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Modals */}
            {modalType && (
                <div className="premium-modal-overlay">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="premium-modal-box">
                        <div className="p-modal-header">
                            <h3>Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h3>
                            <button onClick={() => setModalType(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-modal-form">
                            {modalType === 'transaction' && (
                                <>
                                    <div className="p-form-group">
                                        <label>Transaction Type</label>
                                        <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                            <option value="lent">Lent Money</option>
                                            <option value="borrowed">Borrowed Money</option>
                                        </select>
                                    </div>
                                    <div className="p-form-group">
                                        <label>Amount (₹)</label>
                                        <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                                    </div>
                                    <div className="p-form-group">
                                        <label>Date</label>
                                        <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                    </div>
                                    <div className="p-form-group">
                                        <label>Description</label>
                                        <input type="text" placeholder="e.g. For dinner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    </div>
                                </>
                            )}
                            {modalType === 'note' && (
                                <>
                                    <div className="p-form-group">
                                        <label>Title</label>
                                        <input type="text" required placeholder="e.g. Identity Proof" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div className="p-form-group">
                                        <label>Notes / Content</label>
                                        <textarea rows="4" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                                    </div>
                                </>
                            )}
                            {modalType === 'reminder' && (
                                <>
                                    <div className="p-form-group">
                                        <label>Reminder Title</label>
                                        <input type="text" required placeholder="e.g. Collect pending amount" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div className="p-form-group">
                                        <label>Due Date</label>
                                        <input type="date" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                                    </div>
                                    <div className="p-form-group">
                                        <label>Message</label>
                                        <textarea rows="2" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                                    </div>
                                </>
                            )}
                            {modalType === 'wallet' && (
                                <>
                                    <div className="p-form-group">
                                        <label>Wallet Name</label>
                                        <input type="text" required placeholder="e.g. Arun's Wedding Gift" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="p-form-group">
                                        <label>Target Amount (₹)</label>
                                        <input type="number" required value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} />
                                    </div>
                                    <div className="p-form-group">
                                        <label>Purpose / Description</label>
                                        <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    </div>
                                </>
                            )}
                            <div className="p-modal-footer">
                                <button type="button" className="p-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                                <button type="submit" className="p-btn-primary">Save Entry</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const premiumStyles = `
    .profile-page-v2 { padding: 32px; max-width: 1300px; margin: 0 auto; color: #1E293B; background: #F8FAFC; min-height: 100vh; }
    
    .profile-nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .back-link { display: flex; align-items: center; gap: 8px; color: #64748B; font-weight: 600; background: none; border: none; cursor: pointer; transition: color 0.2s; }
    .back-link:hover { color: #195BAC; }
    .action-btns { display: flex; gap: 12px; }
    .btn-circle-outline { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; color: #64748B; background: white; cursor: pointer; transition: all 0.2s; }
    .btn-circle-outline:hover { border-color: #195BAC; color: #195BAC; }
    .btn-circle-danger { width: 36px; height: 36px; border-radius: 50%; background: #FEE2E2; color: #EF4444; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .btn-circle-danger:hover { background: #FCA5A5; }

    .person-identity-card { 
        background: white; border-radius: 28px; padding: 40px; display: flex; justify-content: space-between; align-items: center;
        border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); margin-bottom: 40px;
    }
    .identity-left { display: flex; gap: 32px; align-items: center; }
    .identity-avatar-container { position: relative; }
    .identity-avatar-container img { width: 110px; height: 110px; border-radius: 35px; background: #E9F4FF; border: 4px solid #F1F5F9; }
    .status-dot { position: absolute; bottom: 5px; right: 5px; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; }
    .status-dot.active { background: #10B981; }
    
    .identity-text h1 { font-size: 2.25rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
    .badge-role { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 99px; }
    .badge-role.friend { background: #E0F2FE; color: #0369A1; }
    .badge-role.family { background: #FEF3C7; color: #D97706; }
    .badge-role.colleague { background: #F1F5F9; color: #64748B; }

    .identity-meta-row { display: flex; gap: 20px; margin-top: 12px; color: #64748B; font-size: 0.9rem; font-weight: 500; }
    .identity-meta-row span { display: flex; align-items: center; gap: 6px; }

    .net-worth-display { text-align: right; }
    .net-worth-display .label { font-size: 0.8rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
    .net-worth-display .value { font-size: 2.25rem; font-weight: 900; display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .net-worth-display .value.pos { color: #16A34A; }
    .net-worth-display .value.neg { color: #DC2626; }

    .premium-tabs { display: flex; gap: 40px; margin-bottom: 40px; padding: 0 10px; }
    .p-tab { background: none; border: none; font-size: 1.1rem; font-weight: 700; color: #94A3B8; cursor: pointer; padding: 8px 0; position: relative; transition: color 0.2s; }
    .p-tab:hover { color: #64748B; }
    .p-tab.active { color: #195BAC; }
    .active-line { position: absolute; bottom: -2px; left: 0; width: 100%; height: 4px; background: #195BAC; border-radius: 10px; }

    .ov-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 40px; }
    .ov-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
    .ov-stat-tile { padding: 24px; border-radius: 24px; display: flex; gap: 20px; align-items: center; border: 1px solid transparent; }
    .ov-stat-tile.green { background: #F0FDF4; border-color: #DCFCE7; color: #16A34A; }
    .ov-stat-tile.red { background: #FEF2F2; border-color: #FEE2E2; color: #DC2626; }
    .tile-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .tile-body .label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.7; }
    .tile-body .val { font-size: 1.5rem; font-weight: 800; }

    .ov-section { background: white; border-radius: 24px; padding: 24px; border: 1px solid #E2E8F0; }
    .sec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .sec-header h3 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0; }
    .sec-link { background: none; border: none; color: #195BAC; font-weight: 700; font-size: 0.85rem; cursor: pointer; }

    .timeline-list { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; align-items: center; gap: 16px; padding: 16px 0; position: relative; }
    .item-icon-box { width: 34px; height: 34px; border-radius: 10px; background: #F8FAFC; color: #64748B; display: flex; align-items: center; justify-content: center; z-index: 1; }
    .item-content { flex: 1; }
    .item-title { font-size: 0.95rem; font-weight: 700; color: #1E293B; }
    .item-time { font-size: 0.75rem; color: #94A3B8; }
    .item-val { font-weight: 800; font-size: 1rem; }
    .item-val.lent { color: #16A34A; }
    .item-val.borrowed { color: #DC2626; }

    .mini-rem-stack { display: flex; flex-direction: column; gap: 12px; }
    .mini-reminder-card { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #F8FAFC; border-radius: 16px; border: 1px solid #F1F5F9; }
    .m-rem-title { display: block; font-weight: 700; font-size: 0.9rem; color: #1E293B; }
    .m-rem-date { font-size: 0.75rem; color: #94A3B8; }
    .m-rem-status { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #F59E0B; background: #FEF3C7; padding: 4px 8px; border-radius: 6px; }

    .btn-plus-small { width: 28px; height: 28px; border-radius: 8px; background: #E9F4FF; color: #195BAC; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .btn-plus-small:hover { background: #195BAC; color: white; }

    .tab-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .tab-title { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0 0 4px 0; }
    .tab-desc { color: #64748B; margin: 0; font-weight: 500; }
    .btn-premium-action { background: #195BAC; color: white; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(25,91,172,0.2); }
    .btn-premium-action:hover { background: #1e40af; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(25,91,172,0.3); }

    .records-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .record-tile { background: white; border-radius: 24px; padding: 24px; border: 1px solid #E2E8F0; position: relative; transition: all 0.2s; }
    .record-tile:hover { transform: translateY(-4px); border-color: #195BAC; box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1); }
    .rec-icon-bg { width: 56px; height: 56px; border-radius: 18px; background: #F1F5F9; color: #64748B; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .record-tile h4 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0 0 4px 0; }
    .rec-date { font-size: 0.8rem; color: #94A3B8; font-weight: 600; }
    .record-tile p { color: #64748B; font-size: 0.9rem; line-height: 1.5; margin: 16px 0 0 0; }
    .rec-actions { position: absolute; top: 20px; right: 20px; display: flex; gap: 8px; }
    .icon-btn-v2 { background: #F8FAFC; border: none; color: #94A3B8; padding: 6px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .icon-btn-v2:hover { color: #195BAC; background: #E9F4FF; }

    .tx-table-v2 { background: white; border-radius: 24px; border: 1px solid #E2E8F0; overflow: hidden; }
    .tx-table-header { display: grid; grid-template-columns: 120px 1fr 140px 140px; padding: 20px 32px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 0.8rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
    .tx-table-row { display: grid; grid-template-columns: 120px 1fr 140px 140px; padding: 20px 32px; border-bottom: 1px solid #F1F5F9; align-items: center; }
    .tx-type-tag { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; width: fit-content; }
    .tx-type-tag.lent { background: #DCFCE7; color: #16A34A; }
    .tx-type-tag.borrowed { background: #FEE2E2; color: #DC2626; }
    .tx-desc-cell { font-weight: 700; color: #1E293B; }
    .tx-date-cell { font-size: 0.9rem; color: #64748B; font-weight: 500; }
    .tx-amount-cell { font-weight: 800; font-size: 1.1rem; text-align: right; }
    .tx-amount-cell.lent { color: #16A34A; }
    .tx-amount-cell.borrowed { color: #DC2626; }

    .wallets-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .wallet-card-v2 { background: white; border-radius: 24px; padding: 28px; border: 1px solid #E2E8F0; }
    .w-icon-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .w-icon { width: 44px; height: 44px; border-radius: 12px; background: #E9F4FF; color: #195BAC; display: flex; align-items: center; justify-content: center; }
    .w-status { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; background: #DCFCE7; color: #16A34A; }
    .w-name { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
    .w-desc { font-size: 0.9rem; color: #64748B; margin-bottom: 24px; line-height: 1.4; }
    .w-labels { display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem; color: #64748B; margin-bottom: 8px; }
    .w-bar-bg { height: 8px; background: #F1F5F9; border-radius: 10px; overflow: hidden; }
    .w-bar-fill { height: 100%; background: #195BAC; border-radius: 10px; transition: width 0.3s ease; }

    .reminders-list-v2 { display: grid; gap: 20px; }
    .rem-card-v2 { background: white; border-radius: 24px; padding: 24px; border: 1px solid #E2E8F0; border-left: 6px solid #195BAC; }
    .rem-card-v2.settled { border-left-color: #CBD5E1; opacity: 0.6; }
    .rem-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .rem-title-box { display: flex; align-items: center; gap: 10px; }
    .rem-title-box h4 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0; }
    .rem-date-box { font-size: 0.85rem; font-weight: 700; color: #64748B; }
    .rem-msg { color: #64748B; font-size: 0.95rem; margin-bottom: 20px; }
    .rem-footer { display: flex; justify-content: space-between; align-items: center; }
    .rem-status-v2 { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #F59E0B; }
    .btn-mark-done { background: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-mark-done:hover { background: #E2E8F0; color: #0F172A; }

    .premium-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
    .premium-modal-box { background: white; width: 100%; max-width: 480px; border-radius: 28px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.3); overflow: hidden; }
    .p-modal-header { padding: 24px 32px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .p-modal-header h3 { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0; }
    .p-modal-header button { background: #F8FAFC; border: none; color: #64748B; padding: 8px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .p-modal-header button:hover { background: #F1F5F9; color: #0F172A; }
    .p-modal-form { padding: 32px; }
    .p-form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .p-form-group label { font-size: 0.85rem; font-weight: 700; color: #334155; }
    .p-form-group input, .p-form-group select, .p-form-group textarea { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; font-size: 1rem; color: #0F172A; transition: all 0.2s; background: #F8FAFC; }
    .p-form-group input:focus, .p-form-group select:focus, .p-form-group textarea:focus { outline: none; border-color: #195BAC; background: white; box-shadow: 0 0 0 4px rgba(25,91,172,0.1); }
    .p-modal-footer { display: flex; gap: 12px; margin-top: 32px; }
    .p-btn-secondary { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; font-weight: 700; cursor: pointer; }
    .p-btn-primary { flex: 2; padding: 12px; border-radius: 12px; border: none; background: #195BAC; color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(25,91,172,0.2); }

    .empty-state-mini { padding: 20px; text-align: center; color: #94A3B8; font-style: italic; font-size: 0.85rem; }
    .empty-state-v2 { padding: 80px 40px; text-align: center; color: #94A3B8; font-style: italic; background: white; border-radius: 24px; border: 2px dashed #E2E8F0; grid-column: span 3; }
`;

export default PersonProfile;
