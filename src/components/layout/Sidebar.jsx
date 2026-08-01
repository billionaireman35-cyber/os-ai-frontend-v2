import { useState, useEffect, useRef } from 'react';
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
  LogOut,
  Zap,
  Folder,
  FolderOpen,
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

const STORAGE_KEY = 'os-ai-folders';
const PINNED_KEY = 'os-ai-pinned';

export function Sidebar({ expanded, setExpanded, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isFounder = user?.stake_tier === 'founder' || user?.is_founder;

  const [folders, setFolders] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      const stored = localStorage.getItem(PINNED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [tapCount, setTapCount] = useState(0);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [founderKey, setFounderKey] = useState('');
  const [founderError, setFounderError] = useState('');

  const searchInputRef = useRef(null);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      try {
        const res = await api.get('/chat/chats');
        setChats(res.data || []);
      } catch (e) {
        console.error('Failed to fetch chats:', e);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, [user]);

  // Save folders to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  // Save pinned to localStorage
  useEffect(() => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  const handleLogoClick = () => {
    setTapCount((prev) => prev + 1);
    if (tapCount + 1 >= 13) {
      setShowFounderModal(true);
      setTapCount(0);
    }
  };

  const handleFounderLogin = async () => {
    try {
      const res = await api.post('/founder/', { code: founderKey });
      localStorage.setItem('token', res.data.token);
      window.location.reload();
    } catch (e) {
      setFounderError(e.response?.data?.detail || 'Invalid founder key');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const newChat = () => {
    navigate('/');
    window.location.reload();
  };

  const selectChat = (chatId) => {
    localStorage.setItem('os-ai-selected-chat', chatId);
    navigate('/');
    window.location.reload();
  };

  const togglePin = (chatId) => {
    setPinnedChats(prev => {
      if (prev.includes(chatId)) {
        return prev.filter(id => id !== chatId);
      } else {
        return [...prev, chatId];
      }
    });
  };

  const tierLabels = {
    founder: '👑 Founder',
    enterprise: '🏢 Enterprise',
    pro: '⭐ Pro',
    builder: '🔧 Builder',
    guest: '👤 Guest',
  };
  const tierBadge = user?.stake_tier ? tierLabels[user.stake_tier] || 'Guest' : 'Guest';

  const toggleFolder = (index) => {
    setExpandedFolders(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const addFolder = () => {
    if (newFolderName.trim()) {
      setFolders(prev => [...prev, { name: newFolderName.trim(), chats: [] }]);
      setNewFolderName('');
      setShowAddFolder(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = chats.filter(chat =>
      chat.title?.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const pinnedChatsList = chats.filter(chat => pinnedChats.includes(chat.id));
  const recentChats = chats.filter(chat => !pinnedChats.includes(chat.id)).slice(0, 10);

  return (
    <>
      {expanded && <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 lg:hidden" onClick={() => setExpanded(false)} />}

      <aside
        className={`fixed top-0 left-0 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col transition-all duration-400 ease-out z-50 ${
            mobileOpen || expanded ? 'w-[340px] translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header with toggle */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-color)]">
          <div
            className="flex items-center gap-2 cursor-pointer select-none hover:bg-[var(--bg-tertiary)] transition-colors rounded-lg px-2 py-1"
            onClick={handleLogoClick}
            title="Tap 13 times for founder login"
          >
            {expanded ? (
              <span className="font-display font-bold text-[26px] text-[var(--text-primary)] flex items-center gap-2">
                <Zap size={28} className="text-[var(--accent-brass)]" />
                OS AI
              </span>
            ) : (
              <span className="font-display font-bold text-[24px] text-[var(--accent-brass)]">OS</span>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        {/* New Chat */}
        <button
          onClick={newChat}
          className={`mx-4 mt-4 flex items-center justify-center gap-3 bg-[var(--accent-indigo)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl py-4 press-soft touch transition-all shadow-sm hover:shadow-md ${
            expanded ? 'px-6 text-[17px]' : 'px-3'
          }`}
        >
          <Plus size={24} className="shrink-0" />
          {expanded && <span className="text-[17px]">New Chat</span>}
        </button>

        {/* Advanced Search */}
        {expanded && (
          <div className="mx-4 mt-4 flex items-center gap-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus-within:border-[var(--accent-indigo)] transition-colors">
            <Search size={18} className="text-[var(--text-muted)] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chats, messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full"
            />
          </div>
        )}

        {/* Search Results */}
        {expanded && isSearching && searchResults.length > 0 && (
          <div className="mx-4 mt-2 max-h-40 overflow-y-auto space-y-1">
            {searchResults.map(chat => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className="p-2 cursor-pointer hover:bg-[var(--bg-tertiary)] rounded-lg text-[14px] text-[var(--text-primary)]"
              >
                {chat.title || 'New Chat'}
              </div>
            ))}
          </div>
        )}
        {expanded && isSearching && searchResults.length === 0 && searchQuery.trim() && (
          <div className="mx-4 mt-2 text-[14px] text-[var(--text-muted)]">No results found</div>
        )}

        {/* Main Navigation */}
        <nav className="px-3 py-2 border-b border-[var(--border-color)]">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium transition-all touch ${
                  isActive
                    ? 'bg-[var(--accent-indigo)]/15 text-[var(--accent-indigo)] border border-[var(--accent-indigo)]/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                } ${expanded ? 'justify-start' : 'justify-center'}`
              }
              title={!expanded ? label : undefined}
            >
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              {expanded && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Folders & Recent Chats */}
        {expanded && (
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {/* Folders */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Folders</span>
                <button
                  onClick={() => setShowAddFolder(!showAddFolder)}
                  className="text-[var(--accent-indigo)] hover:text-[var(--accent-hover)] text-sm"
                >
                  + Add Folder
                </button>
              </div>
              {showAddFolder && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)]"
                  />
                  <button onClick={addFolder} className="btn-primary text-xs px-3 py-1">Add</button>
                  <button onClick={() => { setShowAddFolder(false); setNewFolderName(''); }} className="btn-secondary text-xs px-3 py-1">Cancel</button>
                </div>
              )}
              {folders.map((folder, idx) => (
                <div key={idx} className="mb-1">
                  <div
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer"
                    onClick={() => toggleFolder(idx)}
                  >
                    {expandedFolders[idx] ? <FolderOpen size={16} /> : <Folder size={16} />}
                    <span className="text-[14px] text-[var(--text-primary)] flex-1">{folder.name}</span>
                    <ChevronDown size={14} className={`transition-transform ${expandedFolders[idx] ? 'rotate-180' : ''}`} />
                  </div>
                  {expandedFolders[idx] && (
                    <div className="ml-6 space-y-0.5">
                      {folder.chats.length === 0 ? (
                        <div className="text-[12px] text-[var(--text-muted)] p-1">No chats in this folder</div>
                      ) : (
                        folder.chats.map(chatId => {
                          const chat = chats.find(c => c.id === chatId);
                          return chat ? (
                            <div
                              key={chat.id}
                              onClick={() => selectChat(chat.id)}
                              className="p-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] rounded"
                            >
                              {chat.title || 'New Chat'}
                            </div>
                          ) : null;
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pinned Chats */}
            {pinnedChatsList.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={14} className="text-[var(--accent-brass)]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Pinned</span>
                </div>
                {pinnedChatsList.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer"
                  >
                    <span className="text-[14px] text-[var(--text-primary)] flex-1 truncate">{chat.title || 'New Chat'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }}
                      className="text-[var(--text-muted)] hover:text-[var(--accent-brass)]"
                    >
                      <Star size={14} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Chats */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-[var(--text-muted)]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Recent</span>
              </div>
              {loadingChats ? (
                <div className="text-[13px] text-[var(--text-muted)]">Loading...</div>
              ) : recentChats.length === 0 ? (
                <div className="text-[13px] text-[var(--text-muted)]">No chats yet</div>
              ) : (
                recentChats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer group"
                  >
                    <span className="text-[14px] text-[var(--text-primary)] flex-1 truncate">{chat.title || 'New Chat'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(chat.id); }}
                      className="text-[var(--text-muted)] hover:text-[var(--accent-brass)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Quick Actions & Hustle Hub (only when expanded) */}
        {expanded && (
          <>
            <div className="px-4 py-4 border-t border-[var(--border-color)]">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Quick Actions</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { icon: Sparkles, label: 'Research' },
                  { icon: Code, label: 'Coding' },
                  { icon: BarChart, label: 'Crypto' },
                  { icon: Globe, label: 'Everyday' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-full px-4 py-2 text-[14px] text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-all touch"
                  >
                    <item.icon size={16} className="text-[var(--accent-brass)]" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-color)]">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Hustle Hub</p>
              <div className="flex items-center gap-3 mt-1 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer touch">
                <Users size={18} /> Switch Hub
              </div>
            </div>
          </>
        )}

        {/* User Profile */}
        <div className="border-t border-[var(--border-color)] px-4 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-indigo)]/20 flex items-center justify-center text-[var(--accent-indigo)] font-bold text-lg shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-[16px] text-[var(--text-primary)] font-medium truncate">{user?.name || 'Guest'}</p>
              <div className="flex items-center gap-2 text-[14px] text-[var(--text-muted)]">
                <Coins size={16} /> {user?.close_balance || 0} CLOSE
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-indigo)]/10 text-[12px] text-[var(--accent-indigo)] font-medium">
                  {tierBadge}
                </span>
              </div>
            </div>
          )}
          {expanded && (
            <div className="flex gap-1">
              <button
                onClick={toggleTheme}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] touch p-2 rounded-lg hover:bg-[var(--danger)]/10 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="h-12 flex items-center justify-center border-t border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors touch"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Founder Modal */}
        {showFounderModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-8 space-y-5 shadow-xl">
              <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Founder Login</h3>
              <p className="text-[16px] text-[var(--text-secondary)]">Enter your founder key to access the Sanctum.</p>
              <input
                type="password"
                value={founderKey}
                onChange={(e) => setFounderKey(e.target.value)}
                className="input-base"
                placeholder="Founder key"
              />
              {founderError && <p className="text-[14px] text-[var(--danger)] font-mono">{founderError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleFounderLogin}
                  className="btn-primary flex-1 justify-center text-[17px]"
                >
                  Login as Founder
                </button>
                <button
                  onClick={() => { setShowFounderModal(false); setFounderKey(''); setFounderError(''); }}
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
