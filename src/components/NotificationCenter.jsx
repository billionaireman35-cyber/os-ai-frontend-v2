import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, AlertCircle, Wallet, MessageSquare, Users, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data || []);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearAll = () => setNotifications([]);

  const getIcon = (type) => {
    switch (type) {
      case 'wallet_created': return <CheckCircle size={16} className="text-green-400" />;
      case 'transaction': return <Wallet size={16} className="text-[var(--accent-brass)]" />;
      case 'workspace_invite': return <Users size={16} className="text-blue-400" />;
      default: return <AlertCircle size={16} className="text-[var(--text-muted)]" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
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
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 max-h-[70vh] flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <span className="font-medium text-[var(--text-primary)]">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Clear all
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">No notifications yet</div>
            ) : (
              notifications.map((n, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{n.description}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatTime(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
