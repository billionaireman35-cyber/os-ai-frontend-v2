import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { Sidebar } from './components/layout/Sidebar';
import { Omnibar } from './components/layout/Omnibar';
import Chat from './pages/Chat';
import Wallet from './pages/Wallet';
import Pulse from './pages/Pulse';
import Sanctum from './pages/Sanctum';

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <div className="flex h-screen bg-[#0B0D12] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Omnibar />
              <main className="flex-1 overflow-y-auto p-4 tablet:p-6 landscape:p-8">
                <Routes>
                  <Route path="/" element={<Chat />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/pulse" element={<Pulse />} />
                  <Route path="/sanctum" element={<Sanctum />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
