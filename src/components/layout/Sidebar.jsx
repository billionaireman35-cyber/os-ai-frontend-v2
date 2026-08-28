import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import {
  MessageSquare,
  Wallet,
  Radio,
  Users,
  Code,
  ShieldCheck,
  X,
  SquarePen,
  Search,
  Settings,
  Coins,
  LogOut,
  Zap,
  ChevronDown,
  Star,
  Clock,
  Trophy,
} from 'lucide-react';
import { api } from '../../utils/api';
import { Modal } from '../ui/Modal';

const navItems = [
  { to: '/', label: 'Intelligence', icon: MessageSquare },
  { to: '/vault', label: 'Vault', icon: Wallet },
  { to: '/pulse', label: 'Pulse', icon: Radio },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/hustle-hub', label: 'Hustle Hub', icon: Users },
  { to: '/developer', label: 'Foundry', icon: Code },
];

const PINNED_KEY = 'os-ai-pinned';

export function Sidebar({ expanded, setExpanded, mobileOpen, setMobileOpen, onNewChat, onSelectChat }) {
  const { user, logout, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { assets: walletAssets } = useWallet();
  const closeAsset = walletAssets?.find((a) => a.symbol === 'CLOSE' && a.chain === 'polygon');
  const displayCloseBalance = closeAsset ? closeAsset.balance : 0;
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const recentRef = useRef(null);
  const closeButtonRef = useRef(null);
  const notifRef = useRef(null);
  const modalRef = useRef(null);

  const pinnedKey = user?.id ? `os-ai-pinned-${user.id}` : null;

  const [pinnedChats, setPinnedChats] = useState([]);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentDropdownOpen, setRecentDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const [tapCount, setTapCount] = useState(0);
  const lastTapRef = useRef(0);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [founderKey, setFounderKey] = useState('');
  const [founderError, setFounderError] = useState('');
  const [founderSubmitting, setFounderSubmitting] = useState(false);

  const isOpen = mobileOpen || expanded;
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;

  const resetSidebarState = useCallback(() => {
    setExpanded(false);
    if (mobileOpen && window.history.state?.osAiSidebar) {
      window.history.replaceState(null, '');
    }
    setMobileOpen(false);
  }, [setExpanded, setMobileOpen, mobileOpen]);

  const closeSidebar = useCallback(() => {
    setExpanded(false);
    if (mobileOpen && window.history.state?.osAiSidebar) {
      window.history.back();
    } else {
      setMobileOpen(false);
    }
  }, [setExpanded, setMobileOpen, mobileOpen]);

  const toggleSidebar = () => {
    if (isOpen) {
      closeSidebar();
    } else if (isMobile()) {
      setMobileOpen(true);
    } else {
      setExpanded(true);
    }
  };

  useEffect(() => {
    if (!mobileOpen) return;
    window.history.pushState({ osAiSidebar: true }, '');
    const handlePopState = () => setMobileOpen(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileOpen, setMobileOpen]);

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

  useEffect(() => {
    const handleChatUpdated = () => fetchChats();
    window.addEventListener('chat-updated', handleChatUpdated);
    return () => window.removeEventListener('chat-updated', handleChatUpdated);
  }, [fetchChats]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data || []);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (recentRef.current && !recentRef.current.contains(e.target)) {
        setRecentDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showFounderModal) {
        setShowFounderModal(false);
        setFounderKey('');
        setFounderError('');
      } else if (showNotifDropdown) {
        setShowNotifDropdown(false);
      } else if (recentDropdownOpen) {
        setRecentDropdownOpen(false);
      } else if (isOpen) {
        closeSidebar();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showFounderModal, showNotifDropdown, recentDropdownOpen, closeSidebar]);

  const handleLogoClick = () => {
    const now = Date.now();
    const withinWindow = now - lastTapRef.current < 1500;
    lastTapRef.current = now;
    setTapCount((prev) => {
      const next = withinWindow ? prev + 1 : 1;
      if (next >= 13) {
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
      if (setUser && res.data?.user) {
        setUser(res.data.user);
      }
      closeFounderModal();
      window.location.href = '/sanctum';
    } catch (e) {
      console.error('Founder login failed - full error:', e);
      if (e.response) {
        setFounderError(`(${e.response.status}) ${e.response.data?.detail || 'Request rejected'}`);
      } else if (e.request) {
        setFounderError('No response from server - check your connection.');
      } else {
        setFounderError(`Request failed to send: ${e.message}`);
      }
    } finally {
      setFounderSubmitting(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const newChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      localStorage.removeItem('os-ai-selected-chat');
      window.dispatchEvent(new CustomEvent('new-chat'));
      navigate('/');
    }
    if (isMobile()) resetSidebarState();
  };

  const selectChat = (chatId) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    } else {
      localStorage.setItem('os-ai-selected-chat', chatId);
      navigate('/');
    }
    if (isMobile()) resetSidebarState();
  };

  const togglePin = (chatId) => {
    setPinnedChats((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

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
    platinum: '💎 Platinum',
    gold: '⭐ Gold',
    bronze: '🥉 Bronze',
  };
  const tierBadge = user?.is_founder
    ? '👑 Founder'
    : (user?.stake_tier ? tierLabels[user.stake_tier] || '🥉 Bronze' : '🥉 Bronze');

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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
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
        className={`glass-panel fixed top-0 left-0 h-full w-[300px] flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-color)] shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer select-none rounded-lg px-1.5 py-1"
            onClick={handleLogoClick}
          >
            <Zap size={19} className="text-[var(--accent-brass)]" />
            <span className="font-display font-bold text-[16px] text-[var(--text-primary)]">OS AI</span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeSidebar}
            className="btn-glass-icon w-8 h-8"
            aria-label="Close sidebar"
          >
            <X size={17} />
          </button>
        </div>

        <button
          onClick={newChat}
          className="mx-3 mt-3 flex items-center gap-2.5 rounded-lg px-2.5 py-2 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-bright)] transition-colors touch text-[14px] font-medium text-[var(--text-primary)]"
        >
          <SquarePen size={17} className="text-[var(--accent-brass)] shrink-0" />
          New chat
        </button>

        <div className="mx-3 mt-2 flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-lg px-2.5 py-1.5">
          <Search size={14} className="text-[var(--text-muted)] shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search chats..."
            aria-label="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[13.5px] text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full"
          />
        </div>

        {isSearchActive && searchResults.length > 0 && (
          <div className="mx-3 mt-2 max-h-40 overflow-y-auto space-y-0.5" role="listbox" aria-label="Search results">
            {searchResults.map((chat) => (
              <div
                key={chat.id}
                {...asButton(() => selectChat(chat.id))}
                role="option"
                aria-selected="false"
                className="px-2.5 py-1.5 cursor-pointer hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none rounded-md text-[13px] text-[var(--text-primary)] transition-colors"
              >
                {chat.title || 'New Chat'}
              </div>
            ))}
          </div>
        )}
        {isSearchActive && searchResults.length === 0 && (
          <div className="mx-3 mt-2 text-[13px] text-[var(--text-muted)]" role="status">
            No results found
          </div>
        )}

        <nav className="px-2 py-2 border-b border-[var(--border-color)] mt-1" aria-label="Primary">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => { if (isMobile()) resetSidebarState(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors touch mb-0.5 ${
                  isActive
                    ? 'bg-[var(--accent-brass)]/10 text-[var(--accent-brass-bright)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`
              }
            >
              <Icon size={16} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.is_founder && (
            <NavLink
              to="/sanctum"
              onClick={() => { if (isMobile()) resetSidebarState(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors touch ${
                  isActive
                    ? 'bg-[var(--accent-brass)]/10 text-[var(--accent-brass-bright)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`
              }
            >
              <ShieldCheck size={16} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden="true" />
              <span>Sanctum</span>
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-2 border-b border-[var(--border-color)]">
          <p className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Hustle Hub</p>
          <button
            onClick={() => {
              navigate('/hustle-hub');
              if (isMobile()) resetSidebarState();
            }}
            className="flex items-center gap-2 mt-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer touch w-full"
          >
            <Users size={15} aria-hidden="true" /> Switch Hub
          </button>
        </div>

        <div className="px-2 py-1 flex-1 overflow-y-auto" ref={recentRef}>
          <div
            {...asButton(() => setRecentDropdownOpen((prev) => !prev))}
            className="flex items-center justify-between hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none rounded-md px-2.5 py-1.5 mt-1 transition-colors"
            aria-expanded={recentDropdownOpen}
          >
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Recent</span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`text-[var(--text-muted)] transition-transform ${recentDropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>
          {recentDropdownOpen && (
            <div className="mt-1 space-y-0.5 max-h-60 overflow-y-auto">
              {loadingChats ? (
                <div className="text-[12.5px] text-[var(--text-muted)] px-2.5 py-1" role="status">
                  Loading...
                </div>
              ) : recentChats.length === 0 && pinnedChatsList.length === 0 ? (
                <div className="text-[12.5px] text-[var(--text-muted)] px-2.5 py-1">No chats yet</div>
              ) : (
                <>
                  {pinnedChatsList.length > 0 && (
                    <>
                      <div className="flex items-center gap-1.5 px-2.5 py-1">
                        <Star size={11} className="text-[var(--accent-brass)]" aria-hidden="true" />
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Pinned</span>
                      </div>
                      {pinnedChatsList.map((chat) => (
                        <div
                          key={chat.id}
                          {...asButton(() => selectChat(chat.id))}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none transition-colors"
                        >
                          <span className="text-[13px] text-[var(--text-primary)] flex-1 truncate">
                            {chat.title || 'New Chat'}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }}
                            className="text-[var(--text-muted)] hover:text-[var(--accent-brass)]"
                            aria-label={`Unpin "${chat.title || 'New Chat'}"`}
                          >
                            <Star size={13} fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  {recentChats.length > 0 && (
                    <>
                      {pinnedChatsList.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 mt-1">
                          <Clock size={11} className="text-[var(--text-muted)]" aria-hidden="true" />
                          <span className="text-[9.5px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Recent</span>
                        </div>
                      )}
                      {recentChats.map((chat) => (
                        <div
                          key={chat.id}
                          {...asButton(() => selectChat(chat.id))}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] focus:outline-none transition-colors group"
                        >
                          <span className="text-[13px] text-[var(--text-primary)] flex-1 truncate">
                            {chat.title || 'New Chat'}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }}
                            className="text-[var(--text-muted)] hover:text-[var(--accent-brass)] opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus:opacity-100 transition-opacity"
                            aria-label={`Pin "${chat.title || 'New Chat'}"`}
                          >
                            <Star size={13} />
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

        <div className="border-t border-[var(--border-color)] px-3 py-3 flex items-center gap-3 shrink-0">
          <div
            className="w-9 h-9 rounded-full bg-[var(--accent-brass)]/15 flex items-center justify-center text-[var(--accent-brass-bright)] font-bold text-[15px] shrink-0"
            aria-hidden="true"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-[var(--text-primary)] font-medium truncate">{user?.name || 'Guest'}</p>
            <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
              <Coins size={12} aria-hidden="true" /> {displayCloseBalance} CLOSE
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-brass)]/10 text-[10px] text-[var(--accent-brass-bright)] font-medium">
                {tierBadge}
              </span>
            </div>
          </div>
          <div className="flex gap-0.5">
            <button
              onClick={() => {
                navigate('/settings');
                if (isMobile()) resetSidebarState();
              }}
              className="btn-glass-icon w-8 h-8"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="btn-glass-icon w-8 h-8 hover:text-[var(--danger)]"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <Modal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          title="Log out"
          message="Are you sure you want to log out?"
          showInput={false}
          onConfirm={confirmLogout}
          confirmText="Log out"
          cancelText="Cancel"
        />

        {showFounderModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={closeFounderModal}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="founder-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-md p-8 space-y-5"
            >
              <h3 id="founder-modal-title" className="text-2xl font-display font-bold text-[var(--text-primary)]">
                Founder Login
              </h3>
              <p className="text-[16px] text-[var(--text-secondary)]">Enter your founder key to access the Sanctum.</p>
              <input
                type="password"
                value={founderKey}
                onChange={(e) => setFounderKey(e.target.value)}
                className="input-base w-full"
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
