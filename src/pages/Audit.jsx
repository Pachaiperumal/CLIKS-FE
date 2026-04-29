import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Send,
    Bot,
    User,
    Paperclip,
    MoreVertical,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import '../App.css';
import './Audit.css';

// --- Chat View (New Audit) ---
const ChatView = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: "Hello! I'm your AI Auditor. I can help you analyze financial records, detect anomalies, or generate compliance reports. How would you like to start?" }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        const newMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Mock AI Response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                text: "I've received your request. I'm analyzing the current context data..."
            }]);
        }, 1000);
    };

    return (
        <div className="audit-chat-container">
            <div className="chat-header">
                <div className="chat-header-left">
                    <div className="chat-bot-icon-wrapper">
                        <Bot size={24} />
                    </div>
                    <div className="chat-bot-info">
                        <h2 className="title">AI Audit Assistant</h2>
                        <div className="chat-bot-status">
                            <span className="chat-bot-status-dot"></span>
                            Online
                        </div>
                    </div>
                </div>
                <button className="icon-btn"><MoreVertical size={20} /></button>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                        <div className={`message-avatar ${msg.sender === 'user' ? 'msg-av-user' : 'msg-av-ai'}`}>
                            {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className="message-content">
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="chat-input-area">
                <button className="attach-btn" title="Upload Document">
                    <Paperclip size={20} />
                </button>
                <input
                    type="text"
                    placeholder="Ask anything about your audits..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    className={`send-btn ${input.trim() ? 'active' : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim()}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

// --- View: Audit List (Recent/All) ---
const AuditListView = ({ type }) => (
    <div className="audit-list-view fade-in">
        <div className="audit-list-header">
            <div>
                <h2 className="audit-list-title">{type} Audits</h2>
                <p className="audit-list-subtitle">Manage and review your audit history</p>
            </div>
            <div className="audit-list-actions">
                <button className="btn-secondary btn-secondary-flex">
                    <Filter size={16} /> Filter
                </button>
                <div className="audit-search-wrapper">
                    <Search size={16} className="audit-search-icon" />
                    <input type="text" placeholder="Search audits..." className="audit-search-input" />
                </div>
            </div>
        </div>

        <div className="audit-table-card">
            <table className="audit-table">
                <thead className="audit-thead">
                    <tr>
                        <th className="audit-th">Audit Name</th>
                        <th className="audit-th">Date</th>
                        <th className="audit-th">Status</th>
                        <th className="audit-th">Findings</th>
                        <th className="audit-th right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4].map(i => (
                        <tr key={i} className="audit-tr">
                            <td className="audit-td audit-td-name">
                                <div className="audit-file-icon">
                                    <FileText size={16} />
                                </div>
                                Sample Audit Q{i}
                            </td>
                            <td className="audit-td audit-td-date">Oct {20 + i}, 2026</td>
                            <td className="audit-td">
                                <span className={`audit-status-badge ${i === 1 ? 'audit-status-pending' : 'audit-status-completed'}`}>
                                    {i === 1 ? 'In Progress' : 'Completed'}
                                </span>
                            </td>
                            <td className="audit-td audit-td-findings">{i * 2 + 1} Issues Found</td>
                            <td className="audit-td right">
                                <button className="audit-action-link">View Report</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- View: Findings & Risks ---
const FindingsView = () => (
    <div className="fade-in">
        <h2 className="findings-title">Findings & Risks</h2>
        <div className="findings-grid">
            <div className="findings-card high">
                <div className="findings-card-header">
                    <AlertTriangle className="findings-icon high" size={20} />
                    <h3 className="findings-heading high">High Risk</h3>
                </div>
                <div className="findings-count high">12</div>
                <p className="findings-desc high">Requires immediate attention</p>
            </div>
            <div className="findings-card medium">
                <div className="findings-card-header">
                    <AlertTriangle className="findings-icon medium" size={20} />
                    <h3 className="findings-heading medium">Medium Risk</h3>
                </div>
                <div className="findings-count medium">28</div>
                <p className="findings-desc medium">Review within 7 days</p>
            </div>
            <div className="findings-card resolved">
                <div className="findings-card-header">
                    <CheckCircle2 className="findings-icon resolved" size={20} />
                    <h3 className="findings-heading resolved">Resolved</h3>
                </div>
                <div className="findings-count resolved">156</div>
                <p className="findings-desc resolved">Successfully mitigated</p>
            </div>
        </div>
    </div>
);

// --- Main Page Component ---
const Audit = () => {
    const location = useLocation();
    const path = location.pathname;

    const renderContent = () => {
        if (path.includes('/new')) return <ChatView />;
        if (path.includes('/recent')) return <AuditListView type="Recent" />;
        if (path.includes('/all')) return <AuditListView type="All" />;
        if (path.includes('/findings')) return <FindingsView />;
        if (path.includes('/reports')) return (
            <div className="audit-stub-card fade-in">
                <div className="audit-stub-header">
                    <h2 className="findings-title">Reports</h2>
                </div>
                <EmptyState
                    icon={FileText}
                    title="Reports Dashboard"
                    message="This section is currently under development. Check back later for reports updates."
                    actionLabel="Go to Recent Audits"
                    onAction={() => window.history.back()}
                />
            </div>
        );
        if (path.includes('/settings')) return (
            <div className="audit-stub-card fade-in">
                <div className="audit-stub-header">
                    <h2 className="findings-title">Audit Settings</h2>
                </div>
                <EmptyState
                    icon={Search}
                    title="Configuration"
                    message="This section is currently under development. Check back later for audit settings updates."
                />
            </div>
        );
        return <ChatView />; // Default
    };

    return (
        <div className="audit-page-wrapper">
            {renderContent()}
        </div>
    );
};

export default Audit;
