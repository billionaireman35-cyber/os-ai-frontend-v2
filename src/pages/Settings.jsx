import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import {
  Moon, Sun, LogOut, User, Wallet, Copy, CheckCircle,
  Bell, Lock, Eye, Globe, Server, MessageSquare, Languages, Info, FileText,
  ChevronRight, ArrowLeft, Save, RefreshCw, AlertTriangle, Camera, Plus
} from 'lucide-react';

const defaultSettings = {
  notifications: { chat: true, transactions: true },
  privacy: { onlineStatus: true },
  network: { customRpc: '' },
  chat: { defaultModel: 'llama-3.3-70b', temperature: 0.7 },
  language: 'en',
};

function loadSettings() {
  try {
    const stored = localStorage.getItem('os-ai-settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch { return defaultSettings; }
}

function saveSettings(settings) {
  localStorage.setItem('os-ai-settings', JSON.stringify(settings));
}

function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
        on ? 'bg-[var(--accent-brass)]' : 'bg-white/10 border border-[var(--glass-border)]'
      }`}
    >
      <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-transform ${
        on ? 'translate-x-5 bg-[#1a1509]' : 'translate-x-0.5 bg-white'
      }`} />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout, updateName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(loadSettings);
  const [section, setSection] = useState(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [editingName, setEditingName] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profile_picture || null);
  const fileInputRef = useRef(null);
  const [topUpLoading, setTopUpLoading] = useState(false);

  // ── Sub‑page state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSeed, setExportSeed] = useState(null);
  const [resetConfirm, setResetConfirm] = useState('');

  // Settings is a full page (routed at /settings), not an overlay - if
  // there's a section open, back goes up one level to the main list;
  // otherwise it leaves the page entirely via browser history.
  const closeSettings = () => {
    if (section) {
      setSection(null);
    } else {
      navigate(-1);
    }
  };

  const goTo = (path) => {
    navigate(path);
  };

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    saveSettings(merged);
  };

  const copyAddress = () => {
    if (user?.wallet_address) {
      navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateName = async () => {
    if (name.trim() && name !== user?.name) {
      try {
        await updateName(name);
        setEditingName(false);
      } catch (e) {
        console.error('Failed to update name', e);
      }
    } else {
      setEditingName(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        await api.post('/auth/profile-picture', { picture: base64 });
        const userRes = await api.get('/auth/me');
        if (setUser) setUser(userRes.data);
        setProfilePic(base64);
        alert('Profile picture updated!');
      } catch (err) {
        alert('Failed to upload: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword) {
      setPasswordError('Both fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      setPasswordError(e.response?.data?.detail || 'Failed to change password.');
    }
  };

  const handleExportSeed = async () => {
    setExportError('');
    setExportSeed(null);
    if (!exportPassword) {
      setExportError('Password required.');
      return;
    }
    try {
      setExportSeed('mock seed phrase: abandon abandon ...');
    } catch (e) {
      setExportError(e.message || 'Failed to export seed.');
    }
  };

  const handleResetWallet = async () => {
    if (resetConfirm !== 'RESET') {
      alert('Type "RESET" to confirm.');
      return;
    }
    try {
      alert('Wallet reset functionality will be implemented.');
      setResetConfirm('');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleTopUp = async () => {
    if (topUpLoading) return;
    setTopUpLoading(true);
    try {
      await api.post('/founder/add-close', { amount: 10000 });
      const userRes = await api.get('/auth/me');
      if (setUser) setUser(userRes.data);
      alert('Added 10,000 CLOSE!');
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setTopUpLoading(false);
    }
  };

  const sections = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'privacy', label: 'Privacy', icon: Eye },
    { key: 'network', label: 'Network', icon: Server },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'chat', label: 'Chat Settings', icon: MessageSquare },
    { key: 'language', label: 'Language', icon: Languages },
  ];

  const linkSections = [
    { key: 'about', label: 'About', icon: Info, path: '/about' },
    { key: 'terms', label: 'Terms & Conditions', icon: FileText, path: '/privacy-terms' },
  ];

  const renderMain = () => (
    <div className="p-4 space-y-2">
      {sections.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setSection(key)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon size={19} className="text-[var(--accent-brass)]" />
            <span className="text-[var(--text-primary)] text-sm">{label}</span>
          </div>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </button>
      ))}

      {linkSections.map(({ key, label, icon: Icon, path }) => (
        <button
          key={key}
          onClick={() => goTo(path)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon size={19} className="text-[var(--accent-brass)]" />
            <span className="text-[var(--text-primary)] text-sm">{label}</span>
          </div>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </button>
      ))}

      <div className="h-px bg-[var(--glass-border)] my-2 mx-1" />

      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03]">
        <div className="flex items-center gap-3">
          {theme === 'dark' ? <Moon size={19} className="text-[var(--accent-brass)]" /> : <Sun size={19} className="text-[var(--accent-brass)]" />}
          <span className="text-[var(--text-primary)] text-sm">Theme</span>
        </div>
        <Toggle on={theme === 'dark'} onClick={toggleTheme} />
      </div>

      {/* Founder-only top‑up button */}
      {user?.is_founder && (
        <button
          onClick={handleTopUp}
          disabled={topUpLoading}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-sm transition-colors disabled:opacity-50 bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)] text-black mt-1"
        >
          <Plus size={18} /> {topUpLoading ? 'Adding...' : 'Add 10,000 CLOSE (Founder)'}
        </button>
      )}

      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-[var(--danger)] bg-[var(--danger)]/[0.06] hover:bg-[var(--danger)]/[0.12] transition-colors mt-1"
      >
        <LogOut size={19} />
        <span className="text-sm">Logout</span>
      </button>
      <div className="text-xs text-[var(--text-muted)] font-mono p-3 text-center">OS AI v2.0</div>
    </div>
  );

  // ── Profile Sub‑page ──
  const renderProfile = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-indigo)]/20 flex items-center justify-center text-2xl font-bold text-[var(--accent-indigo)] overflow-hidden">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'G'
            )}
          </div>
          <button
            onClick={() => fileInputRef.current.click()}
            className="absolute bottom-0 right-0 bg-[var(--accent-brass)] p-1 rounded-full shadow-lg hover:bg-[#c4a030] transition"
          >
            <Camera size={16} className="text-black" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePicUpload}
            className="hidden"
          />
        </div>
        <div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-glass"
                autoFocus
                onBlur={handleUpdateName}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
              />
              <button onClick={handleUpdateName} className="btn-primary text-sm">Save</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-[var(--text-primary)]">{user?.name || 'Guest'}</p>
              <button onClick={() => setEditingName(true)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Edit</button>
            </div>
          )}
          <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03]">
        <span className="text-[var(--text-primary)] text-sm">Chat notifications</span>
        <Toggle
          on={settings.notifications.chat}
          onClick={() => updateSettings({ notifications: { ...settings.notifications, chat: !settings.notifications.chat } })}
        />
      </div>
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03]">
        <span className="text-[var(--text-primary)] text-sm">Transaction notifications</span>
        <Toggle
          on={settings.notifications.transactions}
          onClick={() => updateSettings({ notifications: { ...settings.notifications, transactions: !settings.notifications.transactions } })}
        />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-sm text-[var(--text-muted)] block">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input-glass w-full mt-1"
          placeholder="Enter current password"
        />
      </div>
      <div>
        <label className="text-sm text-[var(--text-muted)] block">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-glass w-full mt-1"
          placeholder="Enter new password (min 8 chars)"
        />
      </div>
      {passwordError && <p className="text-sm text-[var(--danger)]">{passwordError}</p>}
      {passwordSuccess && <p className="text-sm text-[var(--success)]">{passwordSuccess}</p>}
      <button onClick={handleChangePassword} className="btn-primary w-full justify-center">Change Password</button>
    </div>
  );

  const renderPrivacy = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03]">
        <span className="text-[var(--text-primary)] text-sm">Online status</span>
        <Toggle
          on={settings.privacy.onlineStatus}
          onClick={() => updateSettings({ privacy: { ...settings.privacy, onlineStatus: !settings.privacy.onlineStatus } })}
        />
      </div>
    </div>
  );

  const renderNetwork = () => (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-sm text-[var(--text-muted)] block">Custom RPC URL</label>
        <input
          type="text"
          value={settings.network.customRpc}
          onChange={(e) => updateSettings({ network: { ...settings.network, customRpc: e.target.value } })}
          className="input-glass w-full mt-1"
          placeholder="https://polygon-rpc.com"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">Leave empty to use default RPCs.</p>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="p-4 space-y-4">
      {user?.wallet_address ? (
        <>
          <div className="flex items-center justify-between p-3 glass-card">
            <span className="text-sm font-mono text-[var(--text-primary)] truncate">{user.wallet_address}</span>
            <button onClick={copyAddress} className="text-[var(--text-muted)] hover:text-[var(--accent-brass)] transition-colors shrink-0 ml-2">
              {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
            </button>
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] block">Export Seed Phrase</label>
            <input
              type="password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              className="input-glass w-full mt-1"
              placeholder="Enter wallet password"
            />
            {exportError && <p className="text-sm text-[var(--danger)]">{exportError}</p>}
            <button onClick={handleExportSeed} className="btn-secondary w-full mt-2 justify-center">Export Seed</button>
            {exportSeed && (
              <div className="mt-2 p-3 glass-card">
                <p className="text-sm font-mono break-all">{exportSeed}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(exportSeed)}
                  className="text-xs text-[var(--accent-brass)] mt-1"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] block">Reset Wallet</label>
            <p className="text-xs text-[var(--text-muted)]">Type "RESET" to confirm.</p>
            <input
              type="text"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              className="input-glass w-full mt-1"
              placeholder="RESET"
            />
            <button onClick={handleResetWallet} className="btn-secondary w-full mt-2 justify-center text-[var(--danger)] border-[var(--danger)] hover:bg-[var(--danger)]/10">
              Reset Wallet
            </button>
          </div>
        </>
      ) : (
        <p className="text-[var(--text-muted)]">No wallet found. Create one in the Vault.</p>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-sm text-[var(--text-muted)] block">Default AI Model</label>
        <select
          value={settings.chat.defaultModel}
          onChange={(e) => updateSettings({ chat: { ...settings.chat, defaultModel: e.target.value } })}
          className="input-glass w-full mt-1"
        >
          <option value="llama-3.3-70b">Llama 3.3 70B</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="claude-sonnet-5">Claude Sonnet 5</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-[var(--text-muted)] block">Temperature: {settings.chat.temperature.toFixed(1)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.chat.temperature}
          onChange={(e) => updateSettings({ chat: { ...settings.chat, temperature: parseFloat(e.target.value) } })}
          className="w-full mt-1 accent-[var(--accent-brass)]"
        />
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-sm text-[var(--text-muted)] block">Interface Language</label>
        <select
          value={settings.language}
          onChange={(e) => updateSettings({ language: e.target.value })}
          className="input-glass w-full mt-1"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="pt">Português</option>
          <option value="ar">العربية</option>
          <option value="zh">中文</option>
        </select>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (section) {
      case 'profile': return renderProfile();
      case 'notifications': return renderNotifications();
      case 'security': return renderSecurity();
      case 'privacy': return renderPrivacy();
      case 'network': return renderNetwork();
      case 'wallet': return renderWallet();
      case 'chat': return renderChat();
      case 'language': return renderLanguage();
      default: return renderMain();
    }
  };

  return (
    <div className="min-h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="h-[60px] flex items-center gap-2 px-4 border-b border-[var(--glass-border)] sticky top-0 bg-[var(--bg-primary)]/85 backdrop-blur-xl z-10">
        {section ? (
          <button onClick={() => setSection(null)} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <button onClick={closeSettings} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={20} />
          </button>
        )}
        <h2 className="text-lg font-display font-bold text-[var(--text-primary)] flex-1">
          {section ? sections.find(s => s.key === section)?.label || linkSections.find(s => s.key === section)?.label || 'Settings' : 'Settings'}
        </h2>
      </div>
      <div>
        {renderSection()}
      </div>
    </div>
  );
}
