import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const CLOSE_CONTRACT = import.meta.env.VITE_CLOSE_CONTRACT || '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = async () => {
    if (!user) {
      setAssets([]);
      setTotalUsd(0);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/wallet/balance');
      const data = res.data.balances || {};
      const items = [];
      let total = 0;

      // Chain balances
      for (const [chain, chainData] of Object.entries(data)) {
        const native = chainData.native;
        if (native && native.balance > 0) {
          items.push({
            chain,
            symbol: native.symbol || chain.toUpperCase(),
            balance: native.balance,
            usdValue: native.usd || 0,
          });
          total += native.usd || 0;
        }
        const tokens = chainData.tokens || {};
        for (const [symbol, token] of Object.entries(tokens)) {
          if (token.balance > 0) {
            items.push({
              chain,
              symbol,
              balance: token.balance,
              usdValue: token.usd || 0,
              address: token.address,
            });
            total += token.usd || 0;
          }
        }
      }

      // ✅ Include internal CLOSE with contract address
      if (res.data.close && res.data.close.balance > 0) {
        items.push({
          chain: 'polygon',
          symbol: 'CLOSE',
          balance: res.data.close.balance,
          usdValue: res.data.close.usd || 0,
          address: CLOSE_CONTRACT,  // <-- contract address for sending
        });
        total += res.data.close.usd || 0;
      }

      setAssets(items);
      setTotalUsd(total);
    } catch (e) {
      console.error('Failed to fetch balances', e);
      setError(e.message || 'Failed to fetch balances');
      setAssets([]);
      setTotalUsd(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [user]);

  return (
    <WalletContext.Provider value={{ assets, totalUsd, loading, error, fetchBalances }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
