import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Briefcase, Wallet, Terminal } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Chat', icon: MessageSquare },
    { path: '/workspaces', label: 'Workspaces', icon: Briefcase },
    { path: '/wallet', label: 'Vault', icon: Wallet },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111111] border-r border-white/10 flex flex-col justify-between p-4 hidden md:flex">
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37] flex items-center justify-center text-black font-extrabold text-lg">
              <Terminal size={18} />
            </div>
            <div>
              <h1 className="font-bold text-white leading-none">OS AI</h1>
              <span className="text-[10px] text-[#d4af37] font-mono tracking-wider">v2.0 • LOCAL</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-400">
          <p className="font-semibold text-gray-200 mb-0.5">System Ready</p>
          <p className="text-[11px] text-gray-500">Fully decentralized & encrypted</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Header Nav */}
        <header className="flex md:hidden items-center justify-between p-4 bg-[#111111] border-b border-white/10">
          <span className="font-bold text-white flex items-center gap-2">
            <Terminal size={16} className="text-[#d4af37]" /> OS AI
          </span>
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-lg ${location.pathname === item.path ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-gray-400'}`}
                >
                  <Icon size={18} />
                </Link>
              );
            })}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
