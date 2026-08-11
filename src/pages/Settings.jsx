import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import {
  X, Moon, Sun, LogOut, User, Wallet, Copy, CheckCircle,
  Bell, Lock, Eye, Globe, Server, MessageSquare, Languages, Terminal,
  ChevronRight, ArrowLeft, Save, RefreshCw, AlertTriangle, Camera
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

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout, updateName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(loadSettings);
  const [section, setSection] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [editingName, setEditingName] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profile_picture || null);
  const fileInputRef = useRef(null);

  // ── Sub‑page state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSeed, setExportSeed] = useState(null);
  const [resetConfirm, setResetConfirm] = useState('');

  const closeSettings = () => {
    setIsClosing(true);
    setTimeout(() => navigate(-1), 300);
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
      // In real implementation, call a backend endpoint that decrypts and returns seed
      // For now we'll simulate
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
      // Call backend to clear wallet for user
      alert('Wallet reset functionality will be implemented.');
      setResetConfirm('');
    } catch (e) {
      alert(e.message);
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
    { key: 'developer', label: 'Developer', icon: Terminal },
  ];

  const renderMain = () => (
    <div className="p-4 space-y-1">
      {sections.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setSection(key)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon size={20} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-primary)]">{label}</span>
          </div>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </button>
      ))}
      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
        <div className="flex items-center gap-3">
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          <span className="text-[var(--text-primary)]">Theme</span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-12 h-7 rounded-full transition-colors bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
        >
          <div className={`w-5 h-5 rounded-full bg-[#d4af37] transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
      <div className="text-xs text-[var(--text-muted)] p-3">OS AI v2.0</div>
    </div>
  );

  // ── Profile Sub‑page (with picture upload) ──
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
            className="absolute bottom-0 right-0 bg-[#d4af37] p-1 rounded-full shadow-lg hover:bg-[#c4a030] transition"
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
                className="input-base"
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-primary)]">Chat notifications</span>
        <button
          onClick={() => updateSettings({ notifications: { ...settings.notifications, chat: !settings.notifications.chat } })}
          className={`w-12 h-7 rounded-full transition-colors ${settings.notifications.chat ? 'bg-[#d4af37]' : 'bg-gray-500'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications.chat ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-primary)]">Transaction notifications</span>
        <button
          onClick={() => updateSettings({ notifications: { ...settings.notifications, transactions: !settings.notifications.transactions } })}
          className={`w-12 h-7 rounded-full transition-colors ${settings.notifications.transactions ? 'bg-[#d4af37]' : 'bg-gray-500'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications.transactions ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
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
          className="input-base w-full mt-1"
          placeholder="Enter current password"
        />
      </div>
      <div>
        <label className="text-sm text-[var(--text-muted)] block">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-base w-full mt-1"
          placeholder="Enter new password (min 8 chars)"
        />
      </div>
      {passwordError && <p className="text-sm text-[var(--danger)]">{passwordError}</p>}
      {passwordSuccess && <p className="text-sm text-green-400">{passwordSuccess}</p>}
      <button onClick={handleChangePassword} className="btn-primary w-full justify-center">Change Password</button>
    </div>
  );

  const renderPrivacy = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-primary)]">Online status</span>
        <button
          onClick={() => updateSettings({ privacy: { ...settings.privacy, onlineStatus: !settings.privacy.onlineStatus } })}
          className={`w-12 h-7 rounded-full transition-colors ${settings.privacy.onlineStatus ? 'bg-[#d4af37]' : 'bg-gray-500'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.privacy.onlineStatus ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
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
          className="input-base w-full mt-1"
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
          <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl">
            <span className="text-sm font-mono text-[var(--text-primary)] truncate">{user.wallet_address}</span>
            <button onClick={copyAddress} className="text-[var(--text-muted)] hover:text-[#d4af37]">
              {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
            </button>
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] block">Export Seed Phrase</label>
            <input
              type="password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              className="input-base w-full mt-1"
              placeholder="Enter wallet password"
            />
            {exportError && <p className="text-sm text-[var(--danger)]">{exportError}</p>}
            <button onClick={handleExportSeed} className="btn-secondary w-full mt-2 justify-center">Export Seed</button>
            {exportSeed && (
              <div className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                <p className="text-sm font-mono break-all">{exportSeed}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(exportSeed)}
                  className="text-xs text-[#d4af37] mt-1"
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
              className="input-base w-full mt-1"
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
          className="input-base w-full mt-1"
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
          className="w-full mt-1 accent-[#d4af37]"
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
          className="input-base w-full mt-1"
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

  const renderDeveloper = () => (
    <div className="p-4 space-y-4">
      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
        <p className="text-sm text-[var(--text-muted)]">API Keys (Coming soon)</p>
        <p className="text-xs text-[var(--text-muted)]">Manage your API keys for programmatic access.</p>
      </div>
      <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
        <p className="text-sm text-[var(--text-muted)]">Webhooks (Coming soon)</p>
        <p className="text-xs text-[var(--text-muted)]">Configure webhooks for events.</p>
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
      case 'developer': return renderDeveloper();
      default: return renderMain();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={closeSettings} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[var(--bg-secondary)] border-l border-[var(--border-color)] z-50 shadow-2xl transition-transform duration-300 ease-out ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}>
        <div className="h-16 flex items-center gap-2 px-4 border-b border-[var(--border-color)]">
          {section ? (
            <button onClick={() => setSection(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <h2 className="text-xl font-display font-bold text-[var(--text-primary)] flex-1">Settings</h2>
          )}
          <button onClick={closeSettings} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {renderSection()}
        </div>
      </div>
    </>
  );
}
