import { useState, useEffect } from 'react';
import { Bell, Circle, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../NotificationCenter';

export function Omnibar({ toggleSidebar }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const notifications = JSON.parse(localStorage.getItem('os-ai-notifications') || '[]');
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, []);

  return (
    <header className="h-14 border-b border-[var(--border-color)] flex items-center justify-between px-3 md:px-6 bg-[var(--bg-primary)] shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="lg:hidden touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} className="text-[var(--text-primary)]" />
        </button>
        <span className="font-display font-bold text-lg text-[var(--text-primary)] hidden sm:block">OS AI</span>
        <span className="text-xs text-[var(--text-muted)] font-mono hidden sm:block">v2.0</span>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationCenter />
        <div className="w-8 h-8 rounded-full bg-[var(--accent-indigo)]/20 flex items-center justify-center text-[var(--accent-indigo)] font-bold text-sm">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>
      </div>
    </header>
  );
}
