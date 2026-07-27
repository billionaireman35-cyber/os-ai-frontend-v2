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
import { useState } from 'react';

function Shell() {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="flex h-screen bg-[var(--color-bg)] overflow-hidden">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${expanded ? 'backdrop-blur-sm' : ''}`}>
        <Omnibar />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/sanctum" element={<Sanctum />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-terms" element={<PrivacyTerms />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/hustle-hub" element={<HustleHub />} />
          </Routes>
        </main>
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
