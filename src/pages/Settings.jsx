import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services';
import Breadcrumbs from '../components/Breadcrumbs';
import { Toggle } from '../components/ui/toggle';
import { Bell, Shield, Globe, Save } from 'lucide-react';

const Settings = () => {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState({
        notifications: true,
        emailDigest: false,
        darkMode: false,
        publicProfile: true,
        twoFactor: true,
        dataSharing: false
    });

    const { data: serverSettings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: settingsService.getSettings,
        onSuccess: (data) => {
            if (data.settings) {
                setLocalSettings(prev => ({ ...prev, ...data.settings }));
            }
        }
    });

    const mutation = useMutation({
        mutationFn: (data) => settingsService.updateSettings({ settings: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        }
    });

    const handleToggle = (key) => {
        setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        mutation.mutate(localSettings);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E3F2FD', borderTopColor: '#2563EB', borderRadius: '50%' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Breadcrumbs />
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.5rem' }}>Settings</h1>
                <p style={{ color: '#64748B' }}>Manage your application preferences and system configurations.</p>
            </div>

            <SettingSection title="Preferences" icon={Globe}>
                <SettingItem
                    label="Dark Mode"
                    description="Use a dark theme for the application interface."
                    isToggled={localSettings.darkMode}
                    onToggle={() => handleToggle('darkMode')}
                />
                <SettingItem
                    label="Language"
                    description="Current system language: English (US)"
                    isToggled={true}
                    onToggle={() => { }}
                    last={true}
                />
            </SettingSection>

            <SettingSection title="Notifications" icon={Bell}>
                <SettingItem
                    label="Push Notifications"
                    description="Receive real-time alerts for updates and activities."
                    isToggled={localSettings.notifications}
                    onToggle={() => handleToggle('notifications')}
                />
                <SettingItem
                    label="Email Digest"
                    description="Receive a weekly summary of your financial activity."
                    isToggled={localSettings.emailDigest}
                    onToggle={() => handleToggle('emailDigest')}
                    last={true}
                />
            </SettingSection>

            <SettingSection title="Privacy & Security" icon={Shield}>
                <SettingItem
                    label="Public Profile"
                    description="Allow other users on the platform to find you."
                    isToggled={localSettings.publicProfile}
                    onToggle={() => handleToggle('publicProfile')}
                />
                <SettingItem
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account."
                    isToggled={localSettings.twoFactor}
                    onToggle={() => handleToggle('twoFactor')}
                />
                <SettingItem
                    label="Data & Analytics"
                    description="Allow usage data to be collected to improve experience."
                    isToggled={localSettings.dataSharing}
                    onToggle={() => handleToggle('dataSharing')}
                    last={true}
                />
            </SettingSection>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button 
                    onClick={handleSave}
                    disabled={mutation.isLoading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 2rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: mutation.isLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(25, 91, 172, 0.2)',
                        opacity: mutation.isLoading ? 0.7 : 1
                    }}
                >
                    <Save size={18} />
                    {mutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};
const SettingSection = ({ title, icon: Icon, children }) => (
    <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: '#DBEAFE', borderRadius: '8px', color: 'var(--primary)' }}>
                <Icon size={20} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</h2>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {children}
        </div>
    </div>
);

const SettingItem = ({ label, description, isToggled, onToggle, last = false }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        borderBottom: last ? 'none' : '1px solid #F1F5F9'
    }}>
        <div style={{ marginRight: '1rem' }}>
            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{description}</div>
        </div>
        <Toggle
            checked={isToggled}
            onChange={onToggle}
            size="md"
            aria-label={label}
        />
    </div>
);

export default Settings;
