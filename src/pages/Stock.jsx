import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, Search, Filter, Package, Loader2, 
    AlertCircle, X, CheckCircle2, Minus, 
    History, Trash2, Edit3, ChevronRight,
    TrendingUp, ArrowRight, ShoppingCart, Box
} from 'lucide-react';
import { 
    fetchStockItems, 
    fetchStockStats, 
    addStockItem, 
    updateStockItem,
    adjustStockQuantity, 
    deleteStockItem, 
    fetchStockHistory 
} from '../services/stockService';
import { formatCurrency } from '../lib/formatCurrency';

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const StockItem = ({ item, onAdjust, onDelete, onEdit, onViewHistory }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const isLowStock = Number(item.quantity) < 5;
    const isOutOfStock = Number(item.quantity) === 0;

    return (
        <div className={`stock-card ${isOutOfStock ? 'out-of-stock' : ''} ${isDeleting ? 'confirm-delete' : ''}`}>
            <div className="card-accent" style={{ background: isLowStock ? '#EF4444' : '#3B82F6' }}></div>
            
            <div className="card-main">
                {isDeleting ? (
                    <div className="delete-confirm-overlay">
                        <p>Remove this item?</p>
                        <div className="confirm-actions">
                            <button type="button" className="confirm-btn yes" onClick={() => { onDelete(item.id); setIsDeleting(false); }}>Yes</button>
                            <button type="button" className="confirm-btn no" onClick={() => setIsDeleting(false)}>No</button>
                        </div>
                    </div>
                ) : null}

                <div className="item-identity">
                    <div className="item-icon-box">
                        <Box size={22} className={isLowStock ? 'text-red-500' : 'text-blue-500'} />
                    </div>
                    <div className="item-details">
                        <h3>{item.name}</h3>
                        <span className="category-tag">{item.category}</span>
                    </div>
                </div>

                <div className="item-inventory">
                    <div className="qty-controls">
                        <button 
                            type="button"
                            className="qty-btn minus" 
                            onClick={() => onAdjust(item.id, -1)}
                            disabled={Number(item.quantity) === 0}
                        >
                            <Minus size={14} />
                        </button>
                        <div className="qty-display">
                            <span className="qty-num">{Number(item.quantity)}</span>
                            <span className="qty-label">{item.unit || 'pcs'}</span>
                        </div>
                        <button 
                            type="button"
                            className="qty-btn plus" 
                            onClick={() => onAdjust(item.id, 1)}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    {isLowStock && (
                        <div className="low-stock-warning">
                            <AlertCircle size={12} />
                            <span>Low Stock</span>
                        </div>
                    )}
                </div>

                <div className="item-actions">
                    <div className="price-info">
                        <span className="price-label">Value</span>
                        <span className="price-val">{formatCurrency(item.value || 0)}</span>
                    </div>
                    <div className="action-row">
                        <button type="button" className="action-icon-btn" onClick={() => onViewHistory(item)} title="History">
                            <History size={16} />
                        </button>
                        <button type="button" className="action-icon-btn" onClick={() => onEdit(item)} title="Edit">
                            <Edit3 size={16} />
                        </button>
                        <button type="button" className="action-icon-btn delete" onClick={() => setIsDeleting(true)} title="Delete">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddItemModal = ({ isOpen, onClose, onSave, editingItem }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Stationery',
        quantity: 1,
        unit: 'pcs',
        unit_price: ''
    });

    React.useEffect(() => {
        if (editingItem) {
            setFormData({
                name: editingItem.name,
                category: editingItem.category,
                quantity: editingItem.quantity,
                unit: editingItem.unit || 'pcs',
                unit_price: editingItem.unit_price || ''
            });
        } else {
            setFormData({
                name: '',
                category: 'Stationery',
                quantity: 1,
                unit: 'pcs',
                unit_price: ''
            });
        }
    }, [editingItem, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{editingItem ? 'Edit Item' : '📦 New Inventory Item'}</h2>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="stock-form">
                    <div className="form-group">
                        <label>Item Name</label>
                        <input 
                            required 
                            type="text" 
                            placeholder="e.g. Blue Ink Pen" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="Stationery">Stationery</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Supplies">Supplies</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Unit</label>
                            <input 
                                type="text" 
                                placeholder="pcs / kg / reams" 
                                value={formData.unit} 
                                onChange={e => setFormData({...formData, unit: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Initial Quantity</label>
                            <input 
                                required 
                                type="number" 
                                min="0" 
                                value={formData.quantity} 
                                onChange={e => setFormData({...formData, quantity: e.target.value})} 
                                disabled={!!editingItem}
                            />
                        </div>
                        <div className="form-group">
                            <label>Price per Unit</label>
                            <input 
                                required 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                value={formData.unit_price} 
                                onChange={e => setFormData({...formData, unit_price: e.target.value})} 
                            />
                        </div>
                    </div>
                    <button type="submit" className="submit-btn">
                        {editingItem ? 'Update Item' : 'Add to Inventory'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const HistoryPanel = ({ item, isOpen, onClose }) => {
    const { data: history = [], isLoading } = useQuery({
        queryKey: ['stock-history', item?.id],
        queryFn: () => fetchStockHistory(item.id),
        enabled: !!item && isOpen
    });

    if (!isOpen) return null;

    return (
        <div className="side-panel-overlay" onClick={onClose}>
            <div className="side-panel" onClick={e => e.stopPropagation()}>
                <div className="panel-header">
                    <div>
                        <h3>Activity Log</h3>
                        <p>{item?.name}</p>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <div className="panel-body">
                    {isLoading ? (
                        <div className="panel-loading"><Loader2 size={24} className="spin" /></div>
                    ) : history.length === 0 ? (
                        <div className="panel-empty">No transactions found for this item.</div>
                    ) : (
                        <div className="history-list">
                            {history.map(tx => (
                                <div key={tx.id} className="history-item">
                                    <div className={`tx-icon ${tx.type}`}>
                                        {tx.type === 'in' ? <Plus size={14} /> : <Minus size={14} />}
                                    </div>
                                    <div className="tx-details">
                                        <div className="tx-main">
                                            <span className="tx-type">{tx.type === 'in' ? 'Stock Added' : 'Stock Used'}</span>
                                            <span className="tx-qty">{tx.quantity} units</span>
                                        </div>
                                        <span className="tx-date">{new Date(tx.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

const Stock = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [historyItem, setHistoryItem] = useState(null);

    // Queries
    const { data: items = [], isLoading } = useQuery({
        queryKey: ['stock', searchQuery, selectedCategory],
        queryFn: () => fetchStockItems({ 
            search: searchQuery, 
            category: selectedCategory === 'All' ? undefined : selectedCategory 
        })
    });

    const { data: stats } = useQuery({
        queryKey: ['stock-stats'],
        queryFn: fetchStockStats
    });

    // Mutations
    const addMutation = useMutation({
        mutationFn: addStockItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
            setIsAddModalOpen(false);
        }
    });

    const adjustMutation = useMutation({
        mutationFn: ({ id, delta }) => adjustStockQuantity(id, delta),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStockItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateStockItem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
            setIsAddModalOpen(false);
            setEditingItem(null);
        }
    });

    const handleSave = (data) => {
        const payload = {
            ...data,
            quantity: Number(data.quantity),
            unit_price: Number(data.unit_price)
        };

        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: payload });
        } else {
            addMutation.mutate(payload);
        }
    };

    const handleAdjust = (id, delta) => {
        adjustMutation.mutate({ id, delta });
    };

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    return (
        <div className="stock-dashboard">
            <style>{`
                .stock-dashboard {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: 'Inter', -apple-system, sans-serif;
                    background-color: #F8FAFC;
                    min-height: 100vh;
                }

                /* Header */
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2.5rem;
                }
                .header-titles h1 {
                    font-size: 2.5rem;
                    font-weight: 900;
                    letter-spacing: -1.5px;
                    margin: 0;
                    color: #0F172A;
                }
                .header-titles p {
                    color: #64748B;
                    font-weight: 600;
                    margin-top: 0.5rem;
                }
                .header-actions {
                    display: flex;
                    gap: 1rem;
                    background: white;
                    padding: 0.5rem;
                    border-radius: 20px;
                    border: 1px solid #F1F5F9;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                /* Stats Bar */
                .stats-bar {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .stat-card-mini {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 24px;
                    border: 1px solid #F1F5F9;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-icon.blue { background: #EFF6FF; color: #3B82F6; }
                .stat-icon.green { background: #F0FDF4; color: #22C55E; }
                .stat-icon.amber { background: #FFFBEB; color: #F59E0B; }
                .stat-icon.purple { background: #FAF5FF; color: #A855F7; }
                .stat-info .label { font-size: 11px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
                .stat-info .value { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0; }

                /* Search & Filters */
                .filters-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    gap: 1.5rem;
                }
                .search-box {
                    flex: 1;
                    max-width: 500px;
                    position: relative;
                }
                .search-box svg {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94A3B8;
                }
                .search-box input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3rem;
                    background: white;
                    border: 1px solid #F1F5F9;
                    border-radius: 18px;
                    font-size: 14px;
                    font-weight: 600;
                    outline: none;
                    transition: all 0.2s;
                }
                .search-box input:focus { border-color: #3B82F6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05); }

                .category-filters {
                    display: flex;
                    gap: 0.5rem;
                }
                .cat-btn {
                    padding: 0.75rem 1.25rem;
                    background: white;
                    border: 1px solid #F1F5F9;
                    border-radius: 14px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #64748B;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .cat-btn.active { background: #0F172A; color: white; border-color: #0F172A; }
                .cat-btn:hover:not(.active) { background: #F8FAFC; color: #0F172A; }

                /* Inventory List */
                .inventory-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 1.5rem;
                }
                .stock-card {
                    background: white;
                    border-radius: 28px;
                    overflow: hidden;
                    border: 1px solid #F1F5F9;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .stock-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
                    border-color: #3B82F6;
                }
                .card-accent {
                    height: 4px;
                    width: 100%;
                }
                .card-main {
                    padding: 1.75rem;
                }
                .item-identity {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.75rem;
                }
                .item-icon-box {
                    width: 50px;
                    height: 50px;
                    background: #F8FAFC;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .item-details h3 {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #0F172A;
                }
                .category-tag {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #94A3B8;
                }

                .item-inventory {
                    background: #F8FAFC;
                    padding: 1.25rem;
                    border-radius: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .qty-controls {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .qty-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    border: none;
                    background: white;
                    color: #0F172A;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    transition: all 0.2s;
                }
                .qty-btn:hover:not(:disabled) { background: #0F172A; color: white; }
                .qty-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .qty-display {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 60px;
                }
                .qty-num { font-size: 1.5rem; font-weight: 900; color: #0F172A; line-height: 1; }
                .qty-label { font-size: 10px; font-weight: 700; color: #94A3B8; margin-top: 2px; }

                .low-stock-warning {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: #FEE2E2;
                    color: #EF4444;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .item-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .price-info {
                    display: flex;
                    flex-direction: column;
                }
                .price-label { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; }
                .price-val { font-size: 1.15rem; font-weight: 800; color: #0F172A; }

                .action-row { display: flex; gap: 0.5rem; }
                .action-icon-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: 1px solid #F1F5F9;
                    background: white;
                    color: #64748B;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-icon-btn:hover { background: #F8FAFC; color: #3B82F6; border-color: #3B82F6; }
                .action-icon-btn.delete:hover { background: #FEE2E2; color: #EF4444; border-color: #EF4444; }

                /* Modal & Side Panel */
                .modal-overlay, .side-panel-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    width: 100%;
                    max-width: 500px;
                    padding: 2.5rem;
                    border-radius: 32px;
                    background: white;
                    box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1);
                }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .modal-header h2 { font-size: 1.5rem; font-weight: 900; margin: 0; }
                .close-btn { background: #F1F5F9; border: none; color: #64748B; cursor: pointer; padding: 8px; border-radius: 12px; }
                
                /* Delete Overlay */
                .delete-confirm-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0.9);
                    backdrop-filter: blur(4px);
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    padding: 1rem;
                    text-align: center;
                    animation: fadeIn 0.2s ease-out;
                }
                .delete-confirm-overlay p { font-weight: 800; color: #0F172A; margin: 0; }
                .confirm-actions { display: flex; gap: 0.75rem; }
                .confirm-btn {
                    padding: 8px 20px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }
                .confirm-btn.yes { background: #EF4444; color: white; }
                .confirm-btn.yes:hover { background: #DC2626; }
                .confirm-btn.no { background: #F1F5F9; color: #64748B; }
                .confirm-btn.no:hover { background: #E2E8F0; }

                .stock-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 1px; }
                .form-group input, .form-group select {
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 14px;
                    padding: 12px 16px;
                    font-size: 14px;
                    font-weight: 600;
                    outline: none;
                }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .submit-btn {
                    margin-top: 1rem;
                    background: #0F172A;
                    color: white;
                    border: none;
                    padding: 18px;
                    border-radius: 18px;
                    font-weight: 800;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .submit-btn:hover { transform: translateY(-2px); background: #2563EB; }

                .side-panel {
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 400px;
                    background: white;
                    box-shadow: -20px 0 50px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                    animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                
                .panel-header { padding: 2rem; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
                .panel-header h3 { font-size: 1.25rem; font-weight: 900; margin: 0; }
                .panel-header p { font-size: 13px; color: #64748B; margin: 4px 0 0; font-weight: 600; }
                
                .panel-body { flex: 1; overflow-y: auto; padding: 1.5rem; }
                .history-list { display: flex; flex-direction: column; gap: 1rem; }
                .history-item {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: #F8FAFC;
                    border-radius: 16px;
                }
                .tx-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .tx-icon.in { background: #DCFCE7; color: #22C55E; }
                .tx-icon.out { background: #FEE2E2; color: #EF4444; }
                .tx-details { flex: 1; }
                .tx-main { display: flex; justify-content: space-between; margin-bottom: 2px; }
                .tx-type { font-size: 13px; font-weight: 800; color: #0F172A; }
                .tx-qty { font-size: 13px; font-weight: 800; }
                .tx-date { font-size: 11px; font-weight: 600; color: #94A3B8; }

                .loading-overlay { height: 60vh; display: flex; align-items: center; justify-content: center; width: 100%; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .action-btn-primary { 
                    background: linear-gradient(135deg, #0F172A, #334155); 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    border-radius: 14px; 
                    font-weight: 700; 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    cursor: pointer; 
                    transition: all 0.2s; 
                }
                .action-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            `}</style>

            <AddItemModal 
                isOpen={isAddModalOpen} 
                onClose={() => {setIsAddModalOpen(false); setEditingItem(null);}} 
                onSave={handleSave} 
                editingItem={editingItem}
            />

            <HistoryPanel 
                item={historyItem} 
                isOpen={!!historyItem} 
                onClose={() => setHistoryItem(null)} 
            />

            <header className="dashboard-header">
                <div className="header-titles">
                    <h1>Inventory <span style={{color: '#3B82F6'}}>Command Center</span></h1>
                    <p>Track assets, monitor stock levels, and manage fulfillment.</p>
                </div>
                <div className="header-actions">
                    <button className="action-btn-primary" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={18} /> Add New Item
                    </button>
                    <button className="cat-btn" style={{padding: '12px'}} onClick={() => queryClient.invalidateQueries({queryKey: ['stock']})}>
                        <TrendingUp size={18} />
                    </button>
                </div>
            </header>

            <section className="stats-bar">
                <div className="stat-card-mini">
                    <div className="stat-icon blue"><Package size={24} /></div>
                    <div className="stat-info">
                        <span className="label">Total Items</span>
                        <p className="value">{stats?.totalItems || 0}</p>
                    </div>
                </div>
                <div className="stat-card-mini">
                    <div className="stat-icon green"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                        <span className="label">Inventory Value</span>
                        <p className="value">{formatCurrency(stats?.totalValue || 0)}</p>
                    </div>
                </div>
                <div className="stat-card-mini">
                    <div className="stat-icon amber"><AlertCircle size={24} /></div>
                    <div className="stat-info">
                        <span className="label">Low Stock</span>
                        <p className="value">{stats?.lowStockCount || 0}</p>
                    </div>
                </div>
                <div className="stat-card-mini">
                    <div className="stat-icon purple"><ShoppingCart size={24} /></div>
                    <div className="stat-info">
                        <span className="label">Categories</span>
                        <p className="value">{stats?.categories?.length || 0}</p>
                    </div>
                </div>
            </section>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={20} />
                    <input 
                        type="text" 
                        placeholder="Search items by name or SKU..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="category-filters">
                    {['All', 'Stationery', 'Electronics', 'Furniture', 'Supplies'].map(cat => (
                        <button 
                            key={cat} 
                            className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="loading-overlay">
                    <Loader2 size={40} className="spin text-blue-500" />
                </div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '32px' }}>
                    <Box size={60} style={{ color: '#E2E8F0', marginBottom: '1.5rem' }} />
                    <h2 style={{ fontWeight: 800 }}>No Inventory Found</h2>
                    <p style={{ color: '#64748B' }}>Your search didn't return any results.</p>
                </div>
            ) : (
                <div className="inventory-grid">
                    {items.map(item => (
                        <StockItem 
                            key={item.id} 
                            item={item} 
                            onAdjust={handleAdjust}
                            onDelete={handleDelete}
                            onEdit={(it) => { setEditingItem(it); setIsAddModalOpen(true); }}
                            onViewHistory={(it) => setHistoryItem(it)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Stock;
