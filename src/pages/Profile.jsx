import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, accountsService } from '../services';
import Topbar from '../components/Topbar';
import {
    User,
    Wallet,
    Database,
    Phone,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    Download,
    Upload
} from 'lucide-react';
import '../App.css';
import Breadcrumbs from '../components/Breadcrumbs';

const Profile = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState('Basic Info');

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const sidebarItems = [
        { label: 'Basic Info', icon: User },
        { label: 'Account Summary', icon: Wallet },
        { label: 'Data & Backup', icon: Database },
    ];

    // Fetch Profile
    const { data: user = {}, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: profileService.getProfile
    });

    // Fetch Summary
    const { data: summary = {} } = useQuery({
        queryKey: ['account-summary'],
        queryFn: async () => {
            // Simplified summary for profile view
            const data = await accountsService.getAccounts();
            const total = data.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
            return { total };
        }
    });

    const BasicInfoView = () => {
        const [isEditing, setIsEditing] = useState(false);
        const [localUser, setLocalUser] = useState(user);

        const mutation = useMutation({
            mutationFn: profileService.updateProfile,
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                setIsEditing(false);
            }
        });

        const handleSave = () => {
            if (isEditing) {
                mutation.mutate(localUser);
            } else {
                setIsEditing(true);
            }
        };

        return (
            <div className="dashboard-tile" style={{ maxWidth: '100%', height: '100%' }}>
                <div className="tile-header" style={{ padding: '0.75rem 1rem' }}>
                    <div className="tile-title" style={{ fontSize: '0.9rem' }}>
                        <User size={18} className="text-blue-600" />
                        Basic Information
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={mutation.isLoading}
                        style={{
                            padding: '0.4rem 0.8rem',
                            background: isEditing ? '#195BAC' : 'white',
                            color: isEditing ? 'white' : '#195BAC',
                            border: '1px solid #195BAC',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: mutation.isLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                        className="transition"
                    >
                        {mutation.isLoading ? 'Saving...' : (isEditing ? 'Save' : 'Edit')}
                    </button>
                </div>
                <div className="tile-content" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%', background: '#E2E8F0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <User size={48} color="#64748B" />
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <table className="table-auto border-separate border-spacing-2 border border-gray-400 dark:border-gray-500 w-full" style={{ borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px', fontSize: '0.9rem', color: '#64748B' }}>Full Name</td>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px', fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
                                            {isEditing ? <input value={localUser.name} onChange={e => setLocalUser({...localUser, name: e.target.value})} /> : user.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px', fontSize: '0.9rem', color: '#64748B' }}>Email Address</td>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px', fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>{user.email}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px', fontSize: '0.9rem', color: '#64748B' }}>Phone</td>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px', fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>{user.phone || 'Not set'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px', fontSize: '0.9rem', color: '#64748B' }}>Account Type</td>
                                        <td className="border border-gray-300 dark:border-gray-700" style={{ padding: '8px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: '#DBEAFE', color: '#1E40AF', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                {user.account_type || 'Basic'}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AccountSummaryView = () => (
        <div className="dashboard-tile" style={{ maxWidth: '100%' }}>
            <div className="tile-header" style={{ padding: '0.75rem 1rem' }}>
                <div className="tile-title" style={{ fontSize: '0.9rem' }}><Wallet size={18} /> Account Summary</div>
            </div>
            <div className="tile-content" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px' }}>
                        <span style={{ color: '#64748B', fontSize: '0.9rem' }}>Total Combined Balance</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>₹ {(summary.total || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const DataBackupView = () => (
        <div className="dashboard-tile" style={{ maxWidth: '100%' }}>
            <div className="tile-header" style={{ padding: '0.75rem 1rem' }}>
                <div className="tile-title" style={{ fontSize: '0.9rem' }}><Database size={18} /> Data & Backup</div>
            </div>
            <div className="tile-content" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <span style={{ color: '#334155', fontWeight: 500, fontSize: '0.9rem' }}>Cloud Sync Status</span>
                        <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.8rem', background: '#DCFCE7', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>Active</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Your data is securely stored in PostgreSQL.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' }}>
                        <Download size={24} color="#195BAC" />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Export All Data</span>
                    </button>
                    <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' }}>
                        <Upload size={24} color="#195BAC" />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Import Records</span>
                    </button>
                </div>
            </div>
        </div>
    );

    if (isProfileLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTopColor: '#195BAC', borderRadius: '50%' }} />
            </div>
        );
    }

    return (
        <div className={`app-root select-none ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ height: '100vh', overflow: 'hidden' }}>
            <Topbar onToggleSidebar={toggleSidebar} />
            <div className="app-body" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                <div className="main-content-area" style={{ background: '#F8FAFC', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '0' }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 2rem 0 2rem', width: '100%', flexShrink: 0 }}>
                        <Breadcrumbs />
                    </div>

                    <div className="content-scrollable" style={{ overflowY: 'auto' }}>
                        <div className="content-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 2rem', height: '100%' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Account Settings</h1>
                                    <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Manage your data and personal information.</p>
                                </div>
                                <button
                                    onClick={() => navigate(-1)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: '#64748B',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        background: 'transparent',
                                        border: '1px solid #E2E8F0',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ArrowLeft size={18} />
                                    <span>Back</span>
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2rem',
                                borderBottom: '1px solid #E2E8F0',
                                marginBottom: '1.5rem',
                                paddingBottom: '1px'
                            }}>
                                {sidebarItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => setActiveSection(item.label)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 0',
                                            borderBottom: activeSection === item.label ? '2px solid #195BAC' : '2px solid transparent',
                                            background: 'transparent',
                                            color: activeSection === item.label ? '#195BAC' : '#64748B',
                                            fontSize: '0.95rem',
                                            fontWeight: activeSection === item.label ? 600 : 500,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            border: 'none',
                                            transition: 'all 0.2s',
                                            marginBottom: '-1px'
                                        }}
                                    >
                                        <item.icon size={18} strokeWidth={activeSection === item.label ? 2.5 : 2} />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                                {activeSection === 'Basic Info' && <BasicInfoView />}
                                {activeSection === 'Account Summary' && <AccountSummaryView />}
                                {activeSection === 'Data & Backup' && <DataBackupView />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </div>
    );
};

export default Profile;
