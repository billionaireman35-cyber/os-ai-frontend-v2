import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Menu,
  X,
  Plus,
  Search,
  Sparkles,
  BarChart,
  Globe,
  Settings,
  Coins,
  Moon,
  Sun,
  LogOut,
  Zap,
  ChevronDown,
  Star,
  Clock,
} from 'lucide-react';
import { api } from '../../utils/api';

const navItems = [
  { to: '/', label: 'Intelligence', icon: MessageSquare },
  { to: '/vault', label: 'Vault', icon: Wallet },
  { to: '/pulse', label: 'Pulse', icon: Radio },
  { to: '/hustle-hub', label: 'Hustle Hub', icon: Users },
  { to: '/developer', label: 'Foundry', icon: Code },
];

const FOUNDER_TAP_WINDOW_MS = 1500;
const FOUNDER_TAP_TARGET = 13;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapTabKey(container, e) {
  if (e.key !== 'Tab' || !container) return;
  const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function Sidebar({ expanded, setExpanded, mobileOpen, setMobileOpen, onNewChat, onSelectChat }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const recentRef = useRef(null);
  const closeButtonRef = useRef(null);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  const pinnedKey = user?.id ? `os-ai-pinned-${user.id}` : null;

  const [pinnedChats, setPinnedChats] = useState([]);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentDropdownOpen, setRecentDropdownOpen] = useState(false);

  const [tapCount, setTapCount] = useState(0);
  const lastTapRef = useRef(0);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [founderKey, setFounderKey] = useState('');
  const [founderError, setFounderError] = useState('');
  const [founderSubmitting, setFounderSubmitting] = useState(false);

  const isOpen = mobileOpen || expanded;
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;

  // Single source of truth for closing the sidebar — clears BOTH flags
  // so it can never get stuck open because only one of the two was reset.
  const closeSidebar = useCallback(() => {
    setExpanded(false);
    setMobileOpen(false);
  }, [setExpanded, setMobileOpen]);

  const toggleSidebar = () => {
    if (isOpen) {
      closeSidebar();
    } else if (isMobile()) {
      setMobileOpen(true);
    } else {
      setExpanded(true);
    }
  };

  // Load / persist pinned chats per user.
  useEffect(() => {
    if (!pinnedKey) {
      setPinnedChats([]);
      return;
    }
    try {
      const stored = localStorage.getItem(pinnedKey);
      setPinnedChats(stored ? JSON.parse(stored) : []);
    } catch (e) {
      setPinnedChats([]);
    }
  }, [pinnedKey]);

  useEffect(() => {
    if (!pinnedKey) return;
    localStorage.setItem(pinnedKey, JSON.stringify(pinnedChats));
  }, [pinnedChats, pinnedKey]);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoadingChats(true);
    try {
      const res = await api.get('/chat/chats');
      setChats(res.data || []);
    } catch (e) {
      console.error('Failed to fetch chats:', e);
    } finally {
      setLoadingChats(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Close recent-chats dropdown on outside click.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (recentRef.current && !recentRef.current.contains(e.target)) {
        setRecentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on outside click (desktop only — mobile has the overlay).
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!isOpen || isMobile()) return;
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        closeSidebar();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, closeSidebar]);

  // Escape closes whichever is open: founder modal first, else the sidebar.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showFounderModal) {
        setShowFounderModal(false);
        setFounderKey('');
        setFounderError('');
      } else if (isOpen) {
        closeSidebar();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showFounderModal, closeSidebar]);

  // Focus management: remember what was focused before opening, move focus
  // into the sidebar/modal on open, restore focus on close. This is what
  // makes the drawer usable for keyboard and screen-reader users, not just
  // mouse users.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      closeButtonRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (showFounderModal) {
      previousFocusRef.current = document.activeElement;
    }
  }, [showFounderModal]);

  // Trap Tab focus inside the sidebar while it's presented as a modal
  // drawer on mobile, and inside the founder modal whenever it's open.
  useEffect(() => {
    const handleTab = (e) => {
      if (showFounderModal) {
        trapTabKey(modalRef.current, e);
      } else if (isOpen && isMobile()) {
        trapTabKey(sidebarRef.current, e);
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen, showFounderModal]);

  const handleLogoClick = () => {
    const now = Date.now();
    const withinWindow = now - lastTapRef.current < FOUNDER_TAP_WINDOW_MS;
    lastTapRef.current = now;
    setTapCount((prev) => {
      const next = withinWindow ? prev + 1 : 1;
      if (next >= FOUNDER_TAP_TARGET) {
        setShowFounderModal(true);
        return 0;
      }
      return next;
    });
  };

  const closeFounderModal = () => {
    setShowFounderModal(false);
    setFounderKey('');
    setFounderError('');
  };

  const handleFounderLogin = async () => {
    if (founderSubmitting) return;
    setFounderSubmitting(true);
    setFounderError('');
    try {
      const res = await api.post('/founder/', { code: founderKey });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      closeFounderModal();
      await fetchChats();
      navigate('/sanctum');
    } catch (e) {
      setFounderError(e.response?.data?.detail || 'Invalid founder key');
    } finally {
      setFounderSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const newChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      navigate('/');
    }
    if (isMobile()) closeSidebar();
  };

  const selectChat = (chatId) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    } else {
      localStorage.setItem('os-ai-selected-chat', chatId);
      navigate('/');
    }
    if (isMobile()) closeSidebar();
  };

  const togglePin = (chatId) => {
    setPinnedChats((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  // Enter/Space activation for the div-based rows below (they can't be real
  // <button> elements because each one nests a pin <button> inside it, and
  // a button can't contain another button).
  const asButton = (onActivate) => ({
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  });

  const tierLabels = {
    founder: '👑 Founder',
    enterprise: '🏢 Enterprise',
    pro: '⭐ Pro',
    builder: '🔧 Builder',
    guest: '👤 Guest',
  };
  const tierBadge = user?.stake_tier ? tierLabels[user.stake_tier] || 'Guest' : 'Guest';

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return chats.filter((chat) => chat.title?.toLowerCase().includes(q));
  }, [searchQuery, chats]);
  const isSearchActive = searchQuery.trim().length > 0;

  const pinnedChatsList = useMemo(
    () => chats.filter((chat) => pinnedChats.includes(chat.id)),
    [chats, pinnedChats]
  );
  const recentChats = useMemo(
    () => chats.filter((chat) => !pinnedChats.includes(chat.id)).slice(0, 20),
    [chats, pinnedChats]
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-label="Sidebar navigation"
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-full w-[340px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-color)]">
          <div
            className="flex items-center gap-2 cursor-pointer select-none hover:bg-[var(--bg-tertiary)] transition-colors rounded-lg px-2 py-1"
            onClick={handleLogoClick}
          >
            <span className="font-display font-bold text-[26px] text-[var(--text-primary)] flex items-center gap-2">
              <Zap size={28} className="text-[var(--accent-brass)]" />
              OS AI
            </span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeSidebar}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        {/* New Chat */}
        <button
          onClick={newChat}
          className="mx-4 mt-4 flex items-center justify-center gap-3 bg-[var(--accent-indigo)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl py-4 press-soft touch transition-all shadow-sm hover:shadow-md px-6 text-[17px]"
        >
          <Plus size={24} className="shrink-0" />
          <span className="text-[17px]">New Chat</span>
        </button>

        {/* Search */}
        <div className="mx-4 mt-4 flex items-center gap-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus-within:border-[var(--accent-indigo)] transition-colors">
          <Search size={18} className="text-[var(--text-muted)] shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search chats, messages..."
            aria-label="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full"
          />
        </div>

        {isSearchActive && searchResults.length > 0 && (
          <div className="mx-4 mt-2 max-h-40 overflow-y-auto space-y-1" role="listbox" aria-label="Search results">
            {searchResults.map((chat) => (
              <div
                key={chat.id}
                {...asButton(() => selectChat(chat.id))}
                role="option"
                aria-selected="false"
                className="p-2 cursor-pointer hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none rounded-lg text-[14px] text-[var(--text-primary)]"
              >
                {chat.title || 'New Chat'}
              </div>
            ))}
          </div>
        )}
        {isSearchActive && searchResults.length === 0 && (
          <div className="mx-4 mt-2 text-[14px] text-[var(--text-muted)]" role="status">
            No results found
          </div>
        )}

        {/* Main Navigation */}
        <nav className="px-3 py-2 border-b border-[var(--border-color)]" aria-label="Primary">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => {
                if (isMobile()) closeSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium transition-all touch justify-start ${
                  isActive
                    ? 'bg-[var(--accent-indigo)]/15 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`
              }
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.is_founder && (
            <NavLink
              to="/sanctum"
              onClick={() => {
                if (isMobile()) closeSidebar();
              }}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium transition-all touch justify-start ${
                  isActive
                    ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`
              }
            >
              <ShieldCheck size={20} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span>Sanctum</span>
            </NavLink>
          )}
        </nav>

        {/* Quick Actions */}
        <div className="px-4 py-4 border-t border-[var(--border-color)]">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Quick Actions</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { icon: Sparkles, label: 'Research', mode: 'research' },
              { icon: Code, label: 'Coding', mode: 'coding' },
              { icon: BarChart, label: 'Crypto', mode: 'crypto' },
              { icon: Globe, label: 'Everyday', mode: 'everyday' },
            ].map((item) => (
              <button
                key={item.mode}
                onClick={() => {
                  navigate(`/?mode=${item.mode}`);
                  window.dispatchEvent(new CustomEvent('quick-action', { detail: { mode: item.mode } }));
                  if (isMobile()) closeSidebar();
                }}
                className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full px-4 py-2 text-[14px] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-all touch"
              >
                <item.icon size={16} className="text-[var(--accent-brass)]" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[var(--border-color)]">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Hustle Hub</p>
          <button
            onClick={() => {
              navigate('/hustle-hub');
              if (isMobile()) closeSidebar();
            }}
            className="flex items-center gap-3 mt-1 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer touch w-full"
          >
            <Users size={18} aria-hidden="true" /> Switch Hub
          </button>
        </div>

        {/* Recent Chats */}
        <div className="px-3 py-2 border-t border-[var(--border-color)] flex-1 overflow-y-auto" ref={recentRef}>
          <div
            {...asButton(() => setRecentDropdownOpen((prev) => !prev))}
            className="flex items-center justify-between hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none rounded-lg p-2 transition-colors"
            aria-expanded={recentDropdownOpen}
          >
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Recent</span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`text-[var(--text-muted)] transition-transform ${recentDropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>
          {recentDropdownOpen && (
            <div className="mt-1 space-y-0.5 max-h-60 overflow-y-auto">
              {loadingChats ? (
                <div className="text-[13px] text-[var(--text-muted)] p-2" role="status">
                  Loading...
                </div>
              ) : recentChats.length === 0 && pinnedChatsList.length === 0 ? (
                <div className="text-[13px] text-[var(--text-muted)] p-2">No chats yet</div>
              ) : (
                <>
                  {pinnedChatsList.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-2 py-1">
                        <Star size={12} className="text-[var(--accent-brass)]" aria-hidden="true" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Pinned</span>
                      </div>
                      {pinnedChatsList.map((chat) => (
                        <div
                          key={chat.id}
                          {...asButton(() => selectChat(chat.id))}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none"
                        >
                          <span className="text-[14px] text-[var(--text-primary)] flex-1 truncate">
                            {chat.title || 'New Chat'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(chat.id);
                            }}
                            className="text-[var(--text-muted)] hover:text-[var(--accent-brass)]"
                            aria-label={`Unpin "${chat.title || 'New Chat'}"`}
                          >
                            <Star size={14} fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  {recentChats.length > 0 && (
                    <>
                      {pinnedChatsList.length > 0 && (
                        <div className="flex items-center gap-2 px-2 py-1 mt-1">
                          <Clock size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Recent</span>
                        </div>
                      )}
                      {recentChats.map((chat) => (
                        <div
                          key={chat.id}
                          {...asButton(() => selectChat(chat.id))}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none group"
                        >
                          <span className="text-[14px] text-[var(--text-primary)] flex-1 truncate">
                            {chat.title || 'New Chat'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(chat.id);
                            }}
                            className="text-[var(--text-muted)] hover:text-[var(--accent-brass)] opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus:opacity-100 transition-opacity"
                            aria-label={`Pin "${chat.title || 'New Chat'}"`}
                          >
                            <Star size={14} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="border-t border-[var(--border-color)] px-4 py-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full bg-[var(--accent-indigo)]/20 flex items-center justify-center text-[var(--accent-indigo)] font-bold text-lg shrink-0"
            aria-hidden="true"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] text-[var(--text-primary)] font-medium truncate">{user?.name || 'Guest'}</p>
            <div className="flex items-center gap-2 text-[14px] text-[var(--text-muted)]">
              <Coins size={16} aria-hidden="true" /> {user?.close_balance || 0} CLOSE
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-indigo)]/10 text-[12px] text-[var(--accent-indigo)] font-medium">
                {tierBadge}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={toggleTheme}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                if (isMobile()) closeSidebar();
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="text-[var(--text-muted)] hover:text-[var(--danger)] touch p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
              aria-label="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Founder Modal */}
        {showFounderModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={closeFounderModal}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="founder-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-8 space-y-5 shadow-xl"
            >
              <h3 id="founder-modal-title" className="text-2xl font-display font-bold text-[var(--text-primary)]">
                Founder Login
              </h3>
              <p className="text-[16px] text-[var(--text-secondary)]">Enter your founder key to access the Sanctum.</p>
              <input
                type="password"
                value={founderKey}
                onChange={(e) => setFounderKey(e.target.value)}
                className="input-base"
                placeholder="Founder key"
                aria-label="Founder key"
                autoFocus
              />
              {founderError && (
                <p className="text-[14px] text-[var(--danger)] font-mono" role="alert">
                  {founderError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleFounderLogin}
                  disabled={founderSubmitting || !founderKey}
                  className="btn-primary flex-1 justify-center text-[17px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {founderSubmitting ? 'Signing in…' : 'Login as Founder'}
                </button>
                <button
                  onClick={closeFounderModal}
                  disabled={founderSubmitting}
                  className="btn-secondary flex-1 justify-center text-[17px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
