import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import { RequireAuth } from './components/layout/RequireAuth';
import { Sidebar } from './components/layout/Sidebar';
import { Omnibar } from './components/layout/Omnibar';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Vault from './pages/Vault';
import Pulse from './pages/Pulse';
import Sanctum from './pages/Sanctum';
import About from './pages/About';
import PrivacyTerms from './pages/PrivacyTerms';
import Developer from './pages/Developer';
import HustleHub from './pages/HustleHub';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import { useState } from 'react';
import { MessageSquare, Wallet, Radio, Settings as SettingsIcon } from 'lucide-react';

function Shell() {
  const [expanded, setExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <Sidebar expanded={expanded} setExpanded={setExpanded} mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Omnibar toggleSidebar={toggleSidebar} />
        <main className="flex-1 min-h-0 overflow-y-auto pb-16 lg:pb-0 animate-fade-in">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/sanctum" element={<Sanctum />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-terms" element={<PrivacyTerms />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/hustle-hub" element={<HustleHub />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-around h-16 z-40">
          <button onClick={() => window.location.href = '/'} className="flex flex-col items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] touch">
            <MessageSquare size={20} />
            <span className="text-[10px] mt-0.5">Chat</span>
          </button>
          <button onClick={() => window.location.href = '/vault'} className="flex flex-col items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] touch">
            <Wallet size={20} />
            <span className="text-[10px] mt-0.5">Vault</span>
          </button>
          <button onClick={() => window.location.href = '/pulse'} className="flex flex-col items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] touch">
            <Radio size={20} />
            <span className="text-[10px] mt-0.5">Pulse</span>
          </button>
          <button onClick={() => window.location.href = '/settings'} className="flex flex-col items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] touch">
            <SettingsIcon size={20} />
            <span className="text-[10px] mt-0.5">Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/*"
                element={
                  <RequireAuth>
                    <Shell />
                  </RequireAuth>
                }
              />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
