import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageSquare, 
  Wallet, 
  Radio, 
  Users, 
  Code, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Intelligence', icon: MessageSquare },
  { to: '/wallet', label: 'Vault', icon: Wallet },
  { to: '/pulse', label: 'Pulse', icon: Radio },
  { to: '/workspaces', label: 'Collectives', icon: Users },
  { to: '/developer', label: 'Foundry', icon: Code },
];

export function Sidebar({ expanded, setExpanded }) {
  const { user } = useAuth();
  const isFounder = user?.stake_tier === 'founder' || user?.is_founder;
  const [expanded, setExpanded] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const handleResize = () => setExpanded(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);

  return (
    <aside
      className={`shrink-0 h-full bg-panel2 border-r border-line flex flex-col transition-[width] duration-300 ease-out ${
        expanded ? 'w-56' : 'w-16'
      }`}
    >
      <div className="h-14 flex items-center px-4 border-b border-line">
        {expanded ? (
          <span className="font-display font-semibold text-[15px] tracking-tight text-bone">OS AI</span>
        ) : (
          <span className="font-display font-bold text-[15px] text-brass mx-auto">OS</span>
        )}
      </div>

      <nav className="flex-1 py-3 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors touch-target press-soft ${
                isActive ? 'bg-brass/10 text-brass' : 'text-muted hover:text-bone hover:bg-white/[0.03]'
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
                isActive ? 'bg-teal/10 text-teal' : 'text-muted hover:text-bone hover:bg-white/[0.03]'
              } ${expanded ? 'justify-start' : 'justify-center'}`
            }
            title={!expanded ? 'Sanctum' : undefined}
          >
            <ShieldCheck size={18} strokeWidth={1.8} className="shrink-0" />
            {expanded && <span className="font-medium">Sanctum</span>}
          </NavLink>
        )}
      </nav>

      <button
        onClick={() => setExpanded((e) => !e)}
        className="h-11 flex items-center justify-center border-t border-line text-muted hover:text-bone transition-colors touch-target"
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}