import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peopleService } from '../../services';
import { 
    Plus, 
    Search, 
    Filter, 
    User, 
    ChevronRight, 
    X, 
    Trash2, 
    Briefcase, 
    Users, 
    TrendingUp, 
    TrendingDown,
    Building2,
    Phone,
    Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../App.css';
import { formatCurrency } from '../../lib/formatCurrency';

const PeopleOverview = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPerson, setNewPerson] = useState({ name: '', role_type: 'friend', phone: '', email: '', company: '', relationship: '' });

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: response, isLoading } = useQuery({
        queryKey: ['people-list', searchTerm],
        queryFn: () => peopleService.getPeople({ search: searchTerm }),
    });

    const people = response?.data || response || [];
    const summary = response?.meta?.summary || { total_contacts: 0, total_receivables: 0, total_payables: 0 };

    // ── Mutations ───────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data) => peopleService.createPerson(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-list']);
            setIsModalOpen(false);
            setNewPerson({ name: '', role_type: 'friend', phone: '', email: '', company: '', relationship: '' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => peopleService.deletePerson(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-list']);
        }
    });

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(newPerson);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this contact and all their records?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <div className="loading-state-v2">
                <div className="premium-loader" />
                <p>Syncing your network...</p>
            </div>
        );
    }

    return (
        <div className="people-overview-page">
            <style>{premiumStyles}</style>

            <div className="p-header-v2">
                <div className="header-top">
                    <div>
                        <h1 className="p-title">People Network</h1>
                        <p className="p-subtitle">Track relationships, debts, and documents in one place.</p>
                    </div>
                    <button className="btn-primary-v2" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} /> Add Contact
                    </button>
                </div>
            </div>

            <div className="p-stats-grid">
                <div className="p-stat-card blue">
                    <div className="card-icon"><Users size={24} /></div>
                    <div className="card-content">
                        <span className="label">Total Contacts</span>
                        <span className="val">{summary.total_contacts}</span>
                    </div>
                </div>
                <div className="p-stat-card green">
                    <div className="card-icon"><TrendingUp size={24} /></div>
                    <div className="card-content">
                        <span className="label">Net Receivables</span>
                        <span className="val">{formatCurrency(summary.total_receivables)}</span>
                    </div>
                </div>
                <div className="p-stat-card red">
                    <div className="card-icon"><TrendingDown size={24} /></div>
                    <div className="card-content">
                        <span className="label">Net Payables</span>
                        <span className="val">{formatCurrency(summary.total_payables)}</span>
                    </div>
                </div>
            </div>

            <div className="p-content-container">
                <div className="p-toolbar">
                    <div className="p-search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name, company, or contact info..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="p-filter-group">
                        <button className="btn-icon-filter"><Filter size={18} /></button>
                    </div>
                </div>

                <div className="people-list-v2">
                    <div className="list-header-v2">
                        <div className="col-name">Contact Information</div>
                        <div className="col-cat">Category</div>
                        <div className="col-balance text-right">Net Balance</div>
                        <div className="col-actions"></div>
                    </div>

                    <AnimatePresence>
                        {people.length === 0 ? (
                            <div className="empty-state-p">
                                <Users size={48} className="empty-icon" />
                                <p>No contacts found in your network.</p>
                                <button className="btn-link" onClick={() => setIsModalOpen(true)}>Create your first contact</button>
                            </div>
                        ) : people.map((person, idx) => (
                            <motion.div 
                                key={person.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="person-row-v2"
                                onClick={() => navigate(`/books/people/${person.id}`)}
                            >
                                <div className="col-name person-info-cell">
                                    <div className="avatar-p">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${person.name}`} alt="" />
                                    </div>
                                    <div className="person-text">
                                        <h4>{person.name}</h4>
                                        <span>{person.company || 'Personal'}</span>
                                    </div>
                                </div>
                                <div className="col-cat">
                                    <span className={`badge-p ${person.role_type}`}>{person.role_type}</span>
                                </div>
                                <div className="col-balance text-right">
                                    <div className={`balance-val ${parseFloat(person.net_balance) >= 0 ? 'positive' : 'negative'}`}>
                                        {formatCurrency(person.net_balance)}
                                    </div>
                                    <span className="balance-label">{parseFloat(person.net_balance) >= 0 ? 'Receivable' : 'Payable'}</span>
                                </div>
                                <div className="col-actions">
                                    <div className="action-btns">
                                        <button className="row-action-btn" onClick={(e) => handleDelete(e, person.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                        <ChevronRight size={18} className="chevron" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Add Person Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-content-premium"
                        >
                            <div className="modal-header-premium">
                                <div className="modal-title-group">
                                    <div className="modal-icon-bg">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="modal-title">New Network Contact</h3>
                                        <p className="modal-subtitle">Add a friend, colleague, or business partner</p>
                                    </div>
                                </div>
                                <button className="close-btn-premium" onClick={() => setIsModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="modal-form-premium">
                                <div className="form-section">
                                    <div className="form-group-premium">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="e.g. Michael Scott"
                                            className="premium-input"
                                            value={newPerson.name}
                                            onChange={(e) => setNewPerson({...newPerson, name: e.target.value})}
                                        />
                                    </div>

                                    <div className="form-row-premium">
                                        <div className="form-group-premium">
                                            <label>Category</label>
                                            <select 
                                                className="premium-input"
                                                value={newPerson.role_type}
                                                onChange={(e) => setNewPerson({...newPerson, role_type: e.target.value})}
                                            >
                                                <option value="friend">Friend</option>
                                                <option value="family">Family</option>
                                                <option value="colleague">Colleague</option>
                                                <option value="business">Business</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Relationship</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Tenant, Investor"
                                                className="premium-input"
                                                value={newPerson.relationship}
                                                onChange={(e) => setNewPerson({...newPerson, relationship: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label>Company</label>
                                        <div className="input-with-icon">
                                            <Building2 size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Dunder Mifflin"
                                                className="premium-input"
                                                value={newPerson.company}
                                                onChange={(e) => setNewPerson({...newPerson, company: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row-premium">
                                        <div className="form-group-premium">
                                            <label>Phone</label>
                                            <div className="input-with-icon">
                                                <Phone size={16} />
                                                <input 
                                                    type="tel" 
                                                    placeholder="+91 ..."
                                                    className="premium-input"
                                                    value={newPerson.phone}
                                                    onChange={(e) => setNewPerson({...newPerson, phone: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Email</label>
                                            <div className="input-with-icon">
                                                <Mail size={16} />
                                                <input 
                                                    type="email" 
                                                    placeholder="michael@dm.com"
                                                    className="premium-input"
                                                    value={newPerson.email}
                                                    onChange={(e) => setNewPerson({...newPerson, email: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer-premium">
                                    <button type="button" className="btn-cancel-premium" onClick={() => setIsModalOpen(false)}>Discard</button>
                                    <button type="submit" className="btn-submit-premium" disabled={createMutation.isLoading}>
                                        {createMutation.isLoading ? 'Saving...' : 'Create Contact'}
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
    .people-overview-page { padding: 32px; max-width: 1300px; margin: 0 auto; background: #F8FAFC; min-height: 100vh; }
    
    .p-header-v2 { margin-bottom: 40px; }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .p-title { font-size: 2.25rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
    .p-subtitle { color: #64748B; font-size: 1.1rem; margin: 0; font-weight: 500; }
    
    .btn-primary-v2 { padding: 12px 28px; border-radius: 14px; background: #195BAC; color: white; border: none; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(25, 91, 172, 0.2); }
    .btn-primary-v2:hover { transform: translateY(-2px); background: #1e40af; box-shadow: 0 12px 20px -5px rgba(25, 91, 172, 0.3); }

    .p-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 40px; }
    .p-stat-card { background: white; border-radius: 24px; padding: 28px; display: flex; gap: 20px; align-items: center; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .card-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
    
    .p-stat-card.blue .card-icon { background: #E9F4FF; color: #195BAC; }
    .p-stat-card.green .card-icon { background: #DCFCE7; color: #16A34A; }
    .p-stat-card.red .card-icon { background: #FEE2E2; color: #DC2626; }
    
    .card-content .label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .card-content .val { font-size: 1.75rem; font-weight: 900; color: #0F172A; }

    .p-content-container { background: white; border-radius: 28px; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; }
    .p-toolbar { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; background: #F8FAFC; }
    
    .p-search-box { position: relative; flex: 1; max-width: 450px; }
    .p-search-box svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
    .p-search-box input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 14px; border: 1.5px solid #E2E8F0; font-size: 0.95rem; background: white; transition: all 0.2s; }
    .p-search-box input:focus { outline: none; border-color: #195BAC; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }
    .btn-icon-filter { width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; display: flex; align-items: center; justify-content: center; cursor: pointer; }

    .people-list-v2 { padding: 16px 0; }
    .list-header-v2 { display: grid; grid-template-columns: 2.5fr 1fr 1.5fr 0.5fr; padding: 12px 32px; font-size: 0.8rem; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
    
    .person-row-v2 { display: grid; grid-template-columns: 2.5fr 1fr 1.5fr 0.5fr; padding: 20px 32px; align-items: center; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #F1F5F9; }
    .person-row-v2:last-child { border-bottom: none; }
    .person-row-v2:hover { background: #F8FAFC; }
    
    .person-info-cell { display: flex; gap: 16px; align-items: center; }
    .avatar-p { width: 48px; height: 48px; border-radius: 14px; background: #F1F5F9; overflow: hidden; border: 1px solid #E2E8F0; }
    .person-text h4 { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
    .person-text span { font-size: 0.8rem; color: #64748B; font-weight: 500; }
    
    .badge-p { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .badge-p.friend { background: #E0F2FE; color: #0369A1; }
    .badge-p.family { background: #F0FDF4; color: #166534; }
    .badge-p.business { background: #F5F3FF; color: #5B21B6; }
    .badge-p.colleague { background: #FFF7ED; color: #9A3412; }

    .balance-val { font-size: 1.1rem; font-weight: 800; margin-bottom: 2px; }
    .balance-val.positive { color: #16A34A; }
    .balance-val.negative { color: #DC2626; }
    .balance-label { font-size: 0.7rem; color: #94A3B8; font-weight: 700; text-transform: uppercase; }

    .action-btns { display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
    .row-action-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; color: #94A3B8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .row-action-btn:hover { background: #FEE2E2; color: #DC2626; }
    .chevron { color: #CBD5E1; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
    .modal-content-premium { background: white; width: 100%; max-width: 550px; border-radius: 28px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.3); overflow: hidden; }
    .modal-header-premium { padding: 24px 32px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
    .modal-icon-bg { width: 48px; height: 48px; border-radius: 14px; background: #E9F4FF; color: #195BAC; display: flex; align-items: center; justify-content: center; }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0; }
    .modal-subtitle { font-size: 0.85rem; color: #64748B; margin: 4px 0 0 0; }
    .close-btn-premium { background: #F8FAFC; border: none; color: #64748B; padding: 8px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    
    .modal-form-premium { padding: 32px; }
    .form-section { display: flex; flex-direction: column; gap: 20px; }
    .form-group-premium { display: flex; flex-direction: column; gap: 8px; }
    .form-group-premium label { font-size: 0.85rem; font-weight: 700; color: #334155; }
    .form-row-premium { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .premium-input { padding: 12px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0; font-size: 1rem; color: #0F172A; background: #F8FAFC; transition: all 0.2s; width: 100%; }
    .premium-input:focus { outline: none; border-color: #195BAC; background: white; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }
    
    .input-with-icon { position: relative; }
    .input-with-icon svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
    .input-with-icon .premium-input { padding-left: 44px; }

    .modal-footer-premium { display: flex; gap: 12px; margin-top: 32px; }
    .btn-cancel-premium { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; font-weight: 700; cursor: pointer; }
    .btn-submit-premium { flex: 2; padding: 12px; border-radius: 12px; border: none; background: #195BAC; color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(25, 91, 172, 0.2); }

    .loading-state-v2 { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #64748B; font-weight: 600; }
    .premium-loader { width: 48px; height: 48px; border: 4px solid #E2E8F0; border-top-color: #195BAC; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state-p { padding: 80px; text-align: center; color: #94A3B8; grid-column: 1 / -1; }
    .empty-icon { margin-bottom: 16px; opacity: 0.5; }
    .btn-link { background: none; border: none; color: #195BAC; font-weight: 700; cursor: pointer; text-decoration: underline; margin-top: 12px; }
`;

export default PeopleOverview;
