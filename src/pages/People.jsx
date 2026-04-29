import React from 'react';
import {
    Users,
    ArrowLeftRight,
    Bell,
    FileText,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { peopleService } from '../services/peopleService';
import '../App.css';
import { formatCurrency } from '../lib/formatCurrency';

const FeatureCard = ({ title, icon: Icon, color, path, stats, loading }) => {
    const navigate = useNavigate();

    return (
        <div
            className="dashboard-tile"
            onClick={() => navigate(path)}
            style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = color;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#E2E8F0';
            }}
        >
            {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyCenter: 'center', zIndex: 10 }}>
                    <div className="loader-small" />
                </div>
            )}
            
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${color}15`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1E293B',
                        margin: '0 0 6px 0',
                        lineHeight: '1.2'
                    }}>
                        {title}
                    </h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        color: '#64748B',
                        fontWeight: '500'
                    }}>
                        View Details <ArrowRight size={14} />
                    </div>
                </div>
            </div>

            {/* Stats List */}
            <div style={{ marginTop: 'auto' }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderTop: index === 0 ? 'none' : '1px solid #F1F5F9',
                        fontSize: '14px'
                    }}>
                        <span style={{ color: '#64748B', fontWeight: '500' }}>{stat.label}</span>
                        <span style={{ color: '#0F172A', fontWeight: '700' }}>{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const People = () => {
    // ── Queries ─────────────────────────────────────────────────────────────
    const { data: peopleRes, isLoading: loadingPeople } = useQuery({ 
        queryKey: ['people-summary'], 
        queryFn: () => peopleService.getPeople() 
    });
    
    const { data: transRes, isLoading: loadingTrans } = useQuery({ 
        queryKey: ['people-transactions-global'], 
        queryFn: () => peopleService.getAllTransactions() 
    });
    
    const { data: remindRes, isLoading: loadingRemind } = useQuery({ 
        queryKey: ['people-reminders-global'], 
        queryFn: () => peopleService.getAllReminders() 
    });
    
    const { data: recordsRes, isLoading: loadingRecords } = useQuery({ 
        queryKey: ['people-records-global'], 
        queryFn: () => peopleService.getAllRecords() 
    });

    // ── Derived Data ────────────────────────────────────────────────────────
    const contactSummary = peopleRes?.meta?.summary || { total_contacts: 0, total_receivables: 0, total_payables: 0 };
    const reminderStats = remindRes?.meta?.stats || { upcoming: 0, overdue: 0, due_today: 0 };
    const recordStats = recordsRes?.meta?.stats || { total_records: 0 };
    const transactionMeta = transRes?.meta || { totalItems: 0 };

    // ── Configuration ───────────────────────────────────────────────────────
    const sections = [
        {
            title: "People & Network",
            icon: Users,
            color: "#2563EB",
            path: "/books/people/overview",
            loading: loadingPeople,
            stats: [
                { label: "Total Contacts", value: `${contactSummary.total_contacts} People` },
                { label: "Receivables", value: formatCurrency(contactSummary.total_receivables) },
                { label: "Payables", value: formatCurrency(contactSummary.total_payables) }
            ]
        },
        {
            title: "Friend Transactions",
            icon: ArrowLeftRight,
            color: "#9333EA",
            path: "/books/people/transactions",
            loading: loadingTrans,
            stats: [
                { label: "Total Volume", value: formatCurrency(Number(contactSummary.total_receivables) + Number(contactSummary.total_payables)) },
                { label: "Total Actions", value: `${transactionMeta.totalItems || 0} Records` },
                { label: "Last Sync", value: "Real-time" }
            ]
        },
        {
            title: "Payment Reminders",
            icon: Bell,
            color: "#F59E0B",
            path: "/books/people/reminders",
            loading: loadingRemind,
            stats: [
                { label: "Upcoming", value: `${reminderStats.upcoming} Due` },
                { label: "Overdue", value: `${reminderStats.overdue} Alert` },
                { label: "Due Today", value: `${reminderStats.due_today} Tasks` }
            ]
        },
        {
            title: "Documents & Records",
            icon: FileText,
            color: "#10B981",
            path: "/books/people/records",
            loading: loadingRecords,
            stats: [
                { label: "Total Files", value: `${recordStats.total_records} Docs` },
                { label: "Category", value: "Personal" },
                { label: "Cloud Sync", value: "Active" }
            ]
        }
    ];

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
            <div className="dashboard-header" style={{ marginBottom: '32px' }}>

                <p className="section-subtitle" style={{ fontSize: '16px', color: '#64748B' }}>Manage your network, track shared expenses, and organize records.</p>
            </div>

            <div className="content-wrapper">
                <div className="dashboard-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: '24px'
                }}>
                    {sections.map((section, index) => (
                        <FeatureCard
                            key={index}
                            title={section.title}
                            icon={section.icon}
                            color={section.color}
                            path={section.path}
                            stats={section.stats}
                            loading={section.loading}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default People;
