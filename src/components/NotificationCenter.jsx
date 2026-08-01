import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Wallet, MessageSquare, Users } from 'lucide-react';

const NOTIFICATIONS_KEY = 'os-ai-notifications';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.read).length);
    } else {
      // Add sample notifications
      const sample = [
        { id: '1', type: 'wallet', message: 'Wallet created successfully', read: false, timestamp: Date.now() },
        { id: '2', type: 'ai', message: 'AI response generated', read: false, timestamp: Date.now() - 60000 },
        { id: '3', type: 'workspace', message: 'You were invited to Hustle Hub', read: true, timestamp: Date.now() - 3600000 },
      ];
      setNotifications(sample);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(sample));
      setUnreadCount(2);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'wallet': return <Wallet size={16} className="text-[var(--accent-brass)]" />;
      case 'ai': return <MessageSquare size={16} className="text-[var(--accent-indigo)]" />;
      case 'workspace': return <Users size={16} className="text-[var(--accent-teal)]" />;
      default: return <AlertCircle size={16} className="text-[var(--text-muted)]" />;
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 max-h-[70vh] flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <span className="font-medium text-[var(--text-primary)]">Notifications</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-[var(--accent-indigo)] hover:text-[var(--accent-hover)]">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer ${!n.read ? 'bg-[var(--accent-indigo)]/5' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">{n.message}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatTime(n.timestamp)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--accent-indigo)] shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
