import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { Moon, Sun, LogOut, Shield, Key, Globe, Bell, User, Wallet as WalletIcon, Info, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { user, logout, updateName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { totalUsd } = useWallet();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [showSeed, setShowSeed] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleUpdateName = async () => {
    if (newName.trim() && newName !== user?.name) {
      await updateName(newName.trim());
    }
    setEditingName(false);
  };

  const handleExportSeed = async () => {
    const password = prompt('Enter your wallet password:');
    if (!password) return;
    try {
      const res = await api.get('/wallet/seed');
      // We can't decrypt on the backend, but we can show the encrypted seed.
      // For now, we'll show a placeholder.
      setSeedPhrase('*** encrypted seed (not shown for security) ***');
      setShowSeed(true);
      setTimeout(() => setShowSeed(false), 5000);
    } catch (e) {
      alert('Failed to export seed. Please try again.');
    }
  };

  const handleDeleteWallet = () => {
    if (confirm('This will permanently delete your wallet. Are you sure?')) {
      alert('Wallet deletion not yet implemented.');
    }
  };

  const tierLabels = {
    founder: '👑 Founder',
    enterprise: '🏢 Enterprise',
    pro: '⭐ Pro',
    builder: '🔧 Builder',
    guest: '👤 Guest',
  };
  const tierBadge = user?.stake_tier ? tierLabels[user.stake_tier] || 'Guest' : 'Guest';

  return (
    <div className="p-4 tablet:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Settings</h1>

      {/* Profile */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <User size={20} /> Profile
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Name:</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-base py-1 px-2 text-sm"
                />
                <button onClick={handleUpdateName} className="btn-primary text-xs py-1 px-3">Save</button>
                <button onClick={() => { setEditingName(false); setNewName(user?.name || ''); }} className="btn-secondary text-xs py-1 px-3">Cancel</button>
              </div>
            ) : (
              <span className="text-[var(--text-primary)]">{user?.name || 'Guest'}</span>
            )}
            {!editingName && (
              <button onClick={() => setEditingName(true)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs">Edit</button>
            )}
          </div>
          <p><span className="text-[var(--text-muted)]">Email:</span> {user?.email || 'Not set'}</p>
          <p><span className="text-[var(--text-muted)]">CLOSE Balance:</span> {user?.close_balance || 0} CLOSE</p>
          <p><span className="text-[var(--text-muted)]">Wallet Value:</span> ${totalUsd.toFixed(2)}</p>
          <p><span className="text-[var(--text-muted)]">Tier:</span> <span className="text-[var(--accent-indigo)] font-medium">{tierBadge}</span></p>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Shield size={20} /> Security
        </h2>
        <button className="btn-secondary w-full text-left flex items-center gap-2">
          <Key size={16} /> Change Password
        </button>
        <button className="btn-secondary w-full text-left flex items-center gap-2">
          <Lock size={16} /> Enable 2FA (coming soon)
        </button>
      </div>

      {/* Wallet Management */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <WalletIcon size={20} /> Wallet Management
        </h2>
        <button onClick={handleExportSeed} className="btn-secondary w-full text-left flex items-center gap-2">
          <Eye size={16} /> Export Private Key / Seed
        </button>
        {showSeed && (
          <div className="glass-card p-3 text-sm text-[var(--accent-brass)] bg-[var(--accent-brass)]/10 border border-[var(--accent-brass)]/20">
            {seedPhrase}
          </div>
        )}
        <button onClick={handleDeleteWallet} className="btn-secondary w-full text-left flex items-center gap-2 text-[var(--danger)] border-[var(--danger)]/30 hover:border-[var(--danger)]">
          <EyeOff size={16} /> Delete Wallet
        </button>
      </div>

      {/* Networks */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Globe size={20} /> Networks
        </h2>
        <div className="flex flex-wrap gap-2">
          {['Polygon', 'Ethereum', 'BSC', 'Arbitrum', 'Base', 'Bitcoin'].map((net) => (
            <button key={net} className="btn-secondary text-xs px-3 py-1 rounded-full">
              {net}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Bell size={20} /> Notifications
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Push notifications</span>
          <button className="btn-secondary text-xs px-4 py-1">Enable</button>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />} Appearance
        </h2>
        <button onClick={toggleTheme} className="btn-primary flex items-center gap-2">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* About */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Info size={20} /> About
        </h2>
        <p className="text-[var(--text-muted)]">OS AI v3.0.0</p>
        <p className="text-[var(--text-muted)]">Built by CLOSEAI Technologies</p>
        <div className="flex gap-3">
          <Link to="/about" className="text-[var(--accent-indigo)] hover:text-[var(--accent-hover)] text-sm">About</Link>
          <Link to="/privacy-terms" className="text-[var(--accent-indigo)] hover:text-[var(--accent-hover)] text-sm">Privacy & Terms</Link>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="btn-secondary w-full flex items-center justify-center gap-2 text-[var(--danger)] border-[var(--danger)]/30 hover:border-[var(--danger)] py-3">
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
