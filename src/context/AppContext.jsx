import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Workspaces State
  const [workspaces, setWorkspaces] = useState(() => {
    const saved = localStorage.getItem('osai_workspaces');
    return saved ? JSON.parse(saved) : [
      { id: 'ws-1', name: 'Personal Workspace', desc: 'General notes & research', active: true },
      { id: 'ws-[#d4af37]', name: 'OS AI Core', desc: 'System development & models', active: false }
    ];
  });

  // Wallet State
  const [wallet, setWallet] = useState({
    connected: false,
    address: null,
    chain: 'polygon',
    balance: '0.00'
  });

  useEffect(() => {
    localStorage.setItem('osai_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  const addWorkspace = (name, desc) => {
    const newWs = { id: `ws-${Date.now()}`, name, desc: desc || 'No description', active: false };
    setWorkspaces(prev => [...prev, newWs]);
  };

  const removeWorkspace = (id) => {
    setWorkspaces(prev => prev.filter(w => w.id !== id));
  };

  const setActiveWorkspace = (id) => {
    setWorkspaces(prev => prev.map(w => ({ ...w, active: w.id === id })));
  };

  return (
    <AppContext.Provider value={{
      workspaces,
      addWorkspace,
      removeWorkspace,
      setActiveWorkspace,
      wallet,
      setWallet
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
