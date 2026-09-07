import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import { RequireAuth } from './components/layout/RequireAuth';
import { Sidebar } from './components/layout/Sidebar';
import { Omnibar } from './components/layout/Omnibar';
import Login from './pages/Login';
import Register from './pages/Register';
import RecoverPassword from './pages/RecoverPassword';
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './config/appkit';
import { AppKitThemeSync } from './components/AppKitThemeSync';

function Shell() {
  const [expanded, setExpanded] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
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
      <div className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ease-in-out ${expanded ? 'lg:ml-[380px]' : 'lg:ml-0'}`}>
        <Omnibar toggleSidebar={toggleSidebar} />
        <main className="flex-1 min-h-0 overflow-y-auto animate-fade-in">
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
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WalletProvider>
        <ThemeProvider>
          <AppKitThemeSync />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/recover-password" element={<RecoverPassword />} />
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
    </QueryClientProvider>
  );
}

export default App;
