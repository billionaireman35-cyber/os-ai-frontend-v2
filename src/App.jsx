import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import { RequireAuth } from './components/layout/RequireAuth';
import { Sidebar } from './components/layout/Sidebar';
import { Omnibar } from './components/layout/Omnibar';
import { lazy, Suspense, useState } from 'react';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const RecoverPassword = lazy(() => import('./pages/RecoverPassword'));
const Chat = lazy(() => import('./pages/Chat'));
const Vault = lazy(() => import('./pages/Vault'));
const Pulse = lazy(() => import('./pages/Pulse'));
const Sanctum = lazy(() => import('./pages/Sanctum'));
const About = lazy(() => import('./pages/About'));
const PrivacyTerms = lazy(() => import('./pages/PrivacyTerms'));
const Developer = lazy(() => import('./pages/Developer'));
const HustleHub = lazy(() => import('./pages/HustleHub'));
const Settings = lazy(() => import('./pages/Settings'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './config/appkit';
import { AppKitThemeSync } from './components/AppKitThemeSync';
import { StartupFlow } from './components/startup/StartupFlow';

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
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-[var(--bg-primary)] text-[var(--text-muted)]">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent-brass)] animate-pulse" />
                  <span>Loading OS AI…</span>
                </div>
              </div>
            }
          >
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
          </Suspense>
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
          <BrowserRouter future={{ v7_startTransition: true }}>
            <Routes>
              <Route path="/welcome" element={<StartupFlow />} />
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
