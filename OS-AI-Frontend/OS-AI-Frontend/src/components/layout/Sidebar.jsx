import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ChatBubbleLeftIcon, 
  WalletIcon, 
  NewspaperIcon, 
  UserGroupIcon, 
  CodeBracketIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'Intelligence', icon: ChatBubbleLeftIcon },
  { to: '/wallet', label: 'Vault', icon: WalletIcon },
  { to: '/pulse', label: 'Pulse', icon: NewspaperIcon },
  { to: '/workspaces', label: 'Collectives', icon: UserGroupIcon },
  { to: '/developer', label: 'Foundry', icon: CodeBracketIcon },
];

export function Sidebar() {
  const { user } = useAuth();
  const isFounder = user?.stake_tier === 'founder' || user?.is_founder;

  return (
    <aside className="w-16 tablet:w-20 bg-[#0B0D12] border-r border-white/5 flex flex-col items-center py-4 space-y-6">
      <div className="text-xl font-bold text-purple-400">OS</div>
      <nav className="flex-1 space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-colors touch-target ${isActive ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`
            }
          >
            <Icon className="h-6 w-6" />
            <span className="text-[10px] tablet:text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </nav>
      {isFounder && (
        <NavLink
          to="/sanctum"
          className="flex flex-col items-center p-2 rounded-xl touch-target text-yellow-400 hover:bg-yellow-500/20"
        >
          <ShieldCheckIcon className="h-6 w-6" />
          <span className="text-[10px] mt-1">Sanctum</span>
        </NavLink>
      )}
      <div className="text-[8px] text-gray-600 mt-4 select-none">OS AI</div>
    </aside>
  );
}
