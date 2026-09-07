import { Menu } from 'lucide-react';
import { OsAiMark } from '../ui/OsAiMark';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../NotificationCenter';

export function Omnibar({ toggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="os-ai-omnibar border-b border-[var(--border-color)] flex items-center justify-between px-3 md:px-6 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="touch p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} className="text-[var(--text-primary)]" />
        </button>
        <div className="os-ai-omnibar-brand hidden sm:flex">
          <div className="os-ai-omnibar-mark">
            <OsAiMark size={24} animated={false} />
          </div>
          <span className="os-ai-omnibar-name">OS AI</span>
          <span className="os-ai-version-pill">V2.0</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <NotificationCenter />
        <div className="os-ai-profile-button">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>
      </div>
    </header>
  );
}
