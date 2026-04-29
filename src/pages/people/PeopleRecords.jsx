import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    FileText, 
    Search, 
    Plus, 
    Filter, 
    Download, 
    Eye, 
    MoreVertical, 
    ArrowLeft,
    X,
    User,
    Calendar,
    FilePlus,
    History,
    Trash2,
    Edit2,
    Image as ImageIcon,
    File,
    Upload,
    Paperclip
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { peopleService } from '../../services';
import { config } from '../../lib/config';
import '../../App.css';

const PeopleRecords = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ 
        person_id: '', 
        title: '', 
        notes: '', 
        type: 'document',
        file_data: null,
        file_name: '' 
    });
    const [filePreview, setFilePreview] = useState(null);

    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: recordsRes, isLoading } = useQuery({
        queryKey: ['people-records-all', searchTerm],
        queryFn: () => peopleService.getAllRecords()
    });

    const { data: people = [] } = useQuery({
        queryKey: ['people-list-dropdown'],
        queryFn: async () => {
            const res = await peopleService.getPeople();
            const rows = res.data || res;
            return Array.isArray(rows) ? rows : [];
        }
    });

    const records = recordsRes?.data || recordsRes || [];
    const stats = recordsRes?.meta?.stats || { total_records: 0 };

    // ── Mutations ───────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data) => peopleService.createRecord(data.person_id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-records-all']);
            closeModal();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (rec) => peopleService.deleteRecord(rec.person_id, rec.id),
        onSuccess: () => {
            queryClient.invalidateQueries(['people-records-all']);
        }
    });

    // ── Handlers ────────────────────────────────────────────────────────────
    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ person_id: '', title: '', notes: '', type: 'document', file_data: null, file_name: '' });
        setFilePreview(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData(prev => ({ ...prev, file_name: file.name }));

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, file_data: reader.result }));
            if (file.type.startsWith('image/')) {
                setFilePreview(reader.result);
            } else {
                setFilePreview('file'); // Generic file icon indicator
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleDelete = (rec) => {
        if (window.confirm('Delete this record?')) {
            deleteMutation.mutate(rec);
        }
    };

    const filteredRecords = Array.isArray(records) ? records.filter(r => {
        return (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
               (r.person_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
               (r.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    }) : [];

    const getAttachmentUrl = (path) => {
        if (!path) return null;
        // Strip /api/v1 from baseUrl if it exists to get the server root
        const serverRoot = (config.api.baseUrl || '').replace(/\/api\/v1\/?$/, '');
        return `${serverRoot}${path}`;
    };

    if (isLoading) {
        return (
            <div className="loading-state-v2">
                <div className="premium-loader" />
                <p>Retrieving documents...</p>
            </div>
        );
    }

    return (
        <div className="people-records-page">
            <style>{premiumStyles}</style>

            <div className="p-header-v2">
                <div className="header-top">
                    <button className="btn-back-link" onClick={() => navigate('/books/people/overview')}>
                        <ArrowLeft size={18} />
                        <span>People Network</span>
                    </button>
                    <div className="header-actions-v2">
                        <button className="btn-primary-v2" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Add Record</button>
                    </div>
                </div>
                <div className="header-main">
                    <div>
                        <h1 className="p-title">Records & Notes</h1>
                        <p className="p-subtitle">Secure storage for identities, contracts, and images across your network.</p>
                    </div>
                </div>
            </div>

            <div className="p-stats-grid">
                <div className="p-stat-card blue">
                    <div className="card-icon"><FileText size={24} /></div>
                    <div className="card-content">
                        <span className="label">Total Entries</span>
                        <span className="val">{stats.total_records || 0}</span>
                    </div>
                </div>
                <div className="p-stat-card green">
                    <div className="card-icon"><History size={24} /></div>
                    <div className="card-content">
                        <span className="label">Last Updated</span>
                        <span className="val">{records.length > 0 ? new Date(records[0].updated_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="p-content-container">
                <div className="p-toolbar">
                    <div className="p-search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by title, contact, or content..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-icon-filter"><Filter size={18} /></button>
                </div>

                <div className="records-grid-v2">
                    {filteredRecords.length === 0 ? (
                        <div className="empty-state-p">
                            <FilePlus size={40} className="empty-icon" />
                            <p>No records found.</p>
                        </div>
                    ) : filteredRecords.map(rec => (
                        <div key={rec.id} className="record-tile-v2">
                            <div className="rec-badge-type">
                                {rec.file_type ? <Paperclip size={12} /> : <FileText size={12} />}
                                {rec.file_type || 'Note'}
                            </div>
                            
                            <div className="rec-header">
                                <div className="avatar-mini">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${rec.person_name}`} alt="" />
                                </div>
                                <div className="rec-meta">
                                    <h4 onClick={() => navigate(`/books/people/${rec.person_id}`)}>{rec.person_name}</h4>
                                    <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="rec-body">
                                {rec.attachment_url && (
                                    <div className="attachment-preview-box">
                                        {['JPG', 'PNG', 'JPEG', 'WEBP'].includes(rec.file_type) ? (
                                            <img src={getAttachmentUrl(rec.attachment_url)} alt={rec.title} />
                                        ) : (
                                            <div className="file-placeholder-v2">
                                                <File size={32} />
                                                <span>{rec.file_type} Document</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <h3 className="rec-title">{rec.title}</h3>
                                <p className="rec-notes">{rec.notes || rec.content || rec.description}</p>
                            </div>

                            <div className="rec-footer">
                                <div className="rec-actions">
                                    {rec.attachment_url && (
                                        <a href={getAttachmentUrl(rec.attachment_url)} target="_blank" rel="noopener noreferrer" className="icon-btn-v2">
                                            <Download size={16} />
                                        </a>
                                    )}
                                    <button className="icon-btn-v2"><Edit2 size={16} /></button>
                                    <button className="icon-btn-v2 danger" onClick={() => handleDelete(rec)}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Record Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="modal-content-premium">
                            <div className="modal-header-premium">
                                <div>
                                    <h3 className="modal-title">New People Record</h3>
                                    <p className="modal-subtitle">Store notes or upload important documents</p>
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
                                        >
                                            <option value="">Choose a contact...</option>
                                            {people.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="upload-area-premium" onClick={() => fileInputRef.current.click()}>
                                        <input 
                                            type="file" 
                                            hidden 
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                        />
                                        {filePreview ? (
                                            <div className="preview-container">
                                                {filePreview === 'file' ? (
                                                    <div className="file-preview-indicator">
                                                        <File size={32} />
                                                        <span>{formData.file_name}</span>
                                                    </div>
                                                ) : (
                                                    <img src={filePreview} alt="Preview" className="img-preview" />
                                                )}
                                                <button type="button" className="remove-file-btn" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFilePreview(null);
                                                    setFormData(prev => ({ ...prev, file_data: null, file_name: '' }));
                                                }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="upload-placeholder-content">
                                                <Upload size={24} />
                                                <div className="text-content">
                                                    <p>Click to upload image or file</p>
                                                    <span>PDF, JPG, PNG or DOCX</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group-premium">
                                        <label>Record Title</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="e.g. Passport Copy / Project Agreement"
                                            className="premium-input"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Notes / Description</label>
                                        <textarea 
                                            rows="3"
                                            placeholder="Enter additional details..."
                                            className="premium-input"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer-premium">
                                    <button type="button" className="btn-cancel-premium" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn-submit-premium" disabled={createMutation.isLoading}>
                                        {createMutation.isLoading ? 'Saving...' : 'Save Record'}
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
    .people-records-page { padding: 32px; max-width: 1300px; margin: 0 auto; background: #F8FAFC; min-height: 100vh; }
    
    .p-header-v2 { margin-bottom: 40px; }
    .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .btn-back-link { display: flex; align-items: center; gap: 8px; background: none; border: none; color: #64748B; font-weight: 600; cursor: pointer; transition: color 0.2s; }
    .btn-back-link:hover { color: #195BAC; }
    
    .btn-primary-v2 { padding: 10px 24px; border-radius: 12px; background: #195BAC; color: white; border: none; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 10px rgba(25, 91, 172, 0.2); }
    .btn-primary-v2:hover { transform: translateY(-2px); background: #1e40af; box-shadow: 0 10px 15px -3px rgba(25, 91, 172, 0.3); }

    .p-title { font-size: 2.25rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; }
    .p-subtitle { color: #64748B; font-size: 1.1rem; margin: 0; font-weight: 500; }

    .p-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 40px; max-width: 800px; }
    .p-stat-card { background: white; border-radius: 24px; padding: 28px; display: flex; gap: 20px; align-items: center; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .card-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
    .p-stat-card.blue .card-icon { background: #E9F4FF; color: #195BAC; }
    .p-stat-card.green .card-icon { background: #DCFCE7; color: #16A34A; }
    .card-content .label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .card-content .val { font-size: 1.75rem; font-weight: 900; color: #0F172A; }

    .p-content-container { background: white; border-radius: 28px; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); overflow: hidden; padding-bottom: 40px; }
    .p-toolbar { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; background: #F8FAFC; margin-bottom: 32px; }
    
    .p-search-box { position: relative; flex: 1; max-width: 450px; }
    .p-search-box svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
    .p-search-box input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 14px; border: 1.5px solid #E2E8F0; font-size: 0.95rem; background: white; transition: all 0.2s; }
    .p-search-box input:focus { outline: none; border-color: #195BAC; box-shadow: 0 0 0 4px rgba(25, 91, 172, 0.1); }
    .btn-icon-filter { width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; display: flex; align-items: center; justify-content: center; cursor: pointer; }

    .records-grid-v2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; padding: 0 32px; }
    .record-tile-v2 { background: #F8FAFC; border-radius: 24px; padding: 24px; border: 1px solid #F1F5F9; position: relative; display: flex; flex-direction: column; transition: all 0.2s; }
    .record-tile-v2:hover { background: white; box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1); transform: translateY(-4px); border-color: #E2E8F0; }
    
    .rec-badge-type { position: absolute; top: 20px; right: 24px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #64748B; background: #F1F5F9; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 6px; }

    .rec-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .avatar-mini { width: 36px; height: 36px; border-radius: 10px; background: white; overflow: hidden; border: 1px solid #E2E8F0; }
    .rec-meta h4 { font-size: 0.9rem; font-weight: 800; color: #195BAC; margin: 0; cursor: pointer; }
    .rec-meta h4:hover { text-decoration: underline; }
    .rec-meta span { font-size: 0.75rem; color: #94A3B8; font-weight: 600; }

    .rec-body { flex: 1; margin-bottom: 24px; }
    .rec-title { font-size: 1.15rem; font-weight: 800; color: #0F172A; margin: 0 0 8px 0; line-height: 1.3; }
    .rec-notes { font-size: 0.9rem; color: #64748B; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-top: 8px; }

    .attachment-preview-box { margin: 12px 0; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; background: white; }
    .attachment-preview-box img { width: 100%; height: 160px; object-fit: cover; }
    .file-placeholder-v2 { height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #64748B; font-weight: 700; background: #F1F5F9; }

    .rec-footer { border-top: 1px solid #E2E8F0; padding-top: 16px; }
    .rec-actions { display: flex; gap: 8px; }
    .icon-btn-v2 { padding: 8px; border-radius: 10px; border: none; background: #F1F5F9; color: #64748B; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; text-decoration: none; }
    .icon-btn-v2:hover { background: #E9F4FF; color: #195BAC; }
    .icon-btn-v2.danger:hover { background: #FEE2E2; color: #DC2626; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
    .modal-content-premium { background: white; width: 100%; max-width: 480px; border-radius: 28px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.3); overflow: hidden; max-height: 90vh; overflow-y: auto; }
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
    
    .upload-area-premium { border: 2px dashed #E2E8F0; border-radius: 20px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: #F8FAFC; position: relative; }
    .upload-area-premium:hover { border-color: #195BAC; background: #E9F4FF; }
    .upload-placeholder-content { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #64748B; }
    .upload-placeholder-content .text-content p { font-weight: 700; color: #334155; margin: 0; font-size: 0.95rem; }
    .upload-placeholder-content .text-content span { font-size: 0.8rem; font-weight: 500; }
    
    .preview-container { position: relative; width: 100%; height: 140px; border-radius: 14px; overflow: hidden; background: white; border: 1px solid #E2E8F0; }
    .img-preview { width: 100%; height: 100%; object-fit: cover; }
    .file-preview-indicator { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #195BAC; font-weight: 700; font-size: 0.85rem; }
    .remove-file-btn { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 8px; background: rgba(0,0,0,0.5); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .remove-file-btn:hover { background: rgba(0,0,0,0.7); }

    .modal-footer-premium { display: flex; gap: 12px; margin-top: 32px; }
    .btn-cancel-premium { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: white; color: #64748B; font-weight: 700; cursor: pointer; }
    .btn-submit-premium { flex: 2; padding: 12px; border-radius: 12px; border: none; background: #195BAC; color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(25, 91, 172, 0.2); }

    .loading-state-v2 { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #64748B; font-weight: 600; }
    .premium-loader { width: 48px; height: 48px; border: 4px solid #E2E8F0; border-top-color: #195BAC; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state-p { padding: 80px; text-align: center; color: #94A3B8; grid-column: 1 / -1; }
    .empty-icon { margin-bottom: 16px; opacity: 0.5; }
`;

export default PeopleRecords;
