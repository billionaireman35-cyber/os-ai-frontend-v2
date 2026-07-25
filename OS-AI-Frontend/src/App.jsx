import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { RequireAuth } from './components/layout/RequireAuth';
import { Sidebar } from './components/layout/Sidebar';
import { Omnibar } from './components/layout/Omnibar';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Wallet from './pages/Wallet';
import Pulse from './pages/Pulse';
import Sanctum from './pages/Sanctum';

function Shell() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex h-screen bg-void overflow-hidden">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      <div className="flex-1 flex flex-col min-w-0">
        <Omnibar />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/sanctum" element={<Sanctum />} />
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
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
