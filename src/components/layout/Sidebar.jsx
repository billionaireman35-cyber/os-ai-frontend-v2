import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  MessageSquare,
  Wallet,
  Radio,
  Users,
  Code,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Sparkles,
  BarChart,
  Globe,
  Settings,
  Coins,
  Moon,
  Sun,
  Lock
} from 'lucide-react';
import { api } from '../../utils/api';

const navItems = [
  { to: '/', label: 'Intelligence', icon: MessageSquare },
  { to: '/vault', label: 'Vault', icon: Wallet },
  { to: '/pulse', label: 'Pulse', icon: Radio },
  { to: '/hustle-hub', label: 'Hustle Hub', icon: Users },
  { to: '/developer', label: 'Foundry', icon: Code },
];

export function Sidebar({ expanded, setExpanded }) {
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isFounder = user?.stake_tier === 'founder' || user?.is_founder;

  // Easter egg for founder login
  const [tapCount, setTapCount] = useState(0);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [founderKey, setFounderKey] = useState('');
  const [founderError, setFounderError] = useState('');

  const handleLogoClick = () => {
    setTapCount((prev) => prev + 1);
    if (tapCount + 1 >= 13) {
      setShowFounderModal(true);
      setTapCount(0);
    }
  };

  const handleFounderLogin = async () => {
    try {
      const res = await api.post('/founder', { code: founderKey });
      localStorage.setItem('token', res.data.token);
      window.location.reload();
    } catch (e) {
      setFounderError(e.response?.data?.detail || 'Invalid founder key');
    }
  };

  const newChat = () => {
    navigate('/');
    window.location.reload();
  };

  return (
    <aside
      className={`shrink-0 h-full bg-[var(--color-panel2)] border-r border-[var(--color-line)] flex flex-col transition-[width] duration-300 ease-out ${
        expanded ? 'w-80' : 'w-16'
      }`}
    >
      {/* Logo / Brand – with Easter egg */}
      <div
        className="h-14 flex items-center px-4 border-b border-[var(--color-line)] cursor-pointer select-none"
        onClick={handleLogoClick}
        title="Tap 13 times for founder login"
      >
        {expanded ? (
          <span className="font-display font-semibold text-[16px] tracking-tight text-[var(--color-text-primary)]">OS AI</span>
        ) : (
          <span className="font-display font-bold text-[18px] text-brass mx-auto">OS</span>
        )}
      </div>

      <button
        onClick={newChat}
        className={`mx-3 mt-3 flex items-center justify-center gap-2 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target ${
          expanded ? 'px-4' : 'px-2'
        }`}
      >
        <Plus size={18} />
        {expanded && <span className="text-[14px]">New Chat</span>}
      </button>

      {expanded && (
        <div className="mx-3 mt-3 flex items-center gap-2 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-1.5">
          <Search size={16} className="text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search chats..."
            className="bg-transparent border-none outline-none text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] w-full"
          />
        </div>
      )}

      <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors touch-target press-soft ${
                isActive ? 'bg-brass/10 text-brass' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.03]'
              } ${expanded ? 'justify-start' : 'justify-center'}`
            }
            title={!expanded ? label : undefined}
          >
            <Icon size={18} strokeWidth={1.8} className="shrink-0" />
            {expanded && <span className="font-medium">{label}</span>}
          </NavLink>
        ))}

        {isFounder && (
          <NavLink
            to="/sanctum"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors touch-target press-soft ${
                isActive ? 'bg-teal/10 text-teal' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.03]'
              } ${expanded ? 'justify-start' : 'justify-center'}`
            }
            title={!expanded ? 'Sanctum' : undefined}
          >
            <ShieldCheck size={18} strokeWidth={1.8} className="shrink-0" />
            {expanded && <span className="font-medium">Sanctum</span>}
          </NavLink>
        )}
      </nav>

      {expanded && (
        <div className="px-4 py-3 border-t border-[var(--color-line)]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button className="flex items-center gap-2 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] hover:bg-white/5 touch-target">
              <Sparkles size={14} className="text-brass" /> Research
            </button>
            <button className="flex items-center gap-2 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] hover:bg-white/5 touch-target">
              <Code size={14} className="text-brass" /> Coding
            </button>
            <button className="flex items-center gap-2 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] hover:bg-white/5 touch-target">
              <BarChart size={14} className="text-brass" /> Crypto
            </button>
            <button className="flex items-center gap-2 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] hover:bg-white/5 touch-target">
              <Globe size={14} className="text-brass" /> Everyday
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="px-4 py-2 border-t border-[var(--color-line)]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Hustle Hub</p>
          <div className="flex items-center gap-2 mt-1 text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer touch-target">
            <Users size={14} /> Switch Hub
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-line)] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brass/20 flex items-center justify-center text-brass font-semibold text-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>
        {expanded && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[var(--color-text-primary)] truncate">{user?.name || 'Guest'}</p>
            <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
              <Coins size={12} /> {user?.close_balance || 0} CLOSE
            </div>
          </div>
        )}
        {expanded && (
          <button
            onClick={toggleTheme}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] touch-target"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
        {expanded && (
          <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] touch-target">
            <Settings size={16} />
          </button>
        )}
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        className="h-11 flex items-center justify-center border-t border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors touch-target"
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Founder Login Modal */}
      {showFounderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-panel2)] border border-[var(--color-line)] rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-display text-[var(--color-text-primary)]">Founder Login</h3>
            <p className="text-[13px] text-[var(--color-text-muted)]">Enter your founder key to access the Sanctum.</p>
            <input
              type="password"
              value={founderKey}
              onChange={(e) => setFounderKey(e.target.value)}
              className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass"
              placeholder="Founder key"
            />
            {founderError && <p className="text-[12px] text-[var(--color-danger)] font-mono">{founderError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleFounderLogin}
                className="flex-1 bg-brass hover:bg-brassLight text-void font-semibold rounded-md py-2.5 press-soft touch-target"
              >
                Login as Founder
              </button>
              <button
                onClick={() => { setShowFounderModal(false); setFounderKey(''); setFounderError(''); }}
                className="flex-1 bg-[var(--color-panel)] border border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-md py-2.5 press-soft touch-target"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
