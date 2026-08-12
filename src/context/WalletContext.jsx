import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

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

      // 1. On‑chain balances
      for (const [chain, chainData] of Object.entries(data)) {
        // Skip the 'close' internal field – we handle separately
        if (chain === 'close') continue;
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
              address: token.address || null,
            });
            total += token.usd || 0;
          }
        }
      }

      // 2. Internal CLOSE balance
      if (data.close && data.close.balance > 0) {
        items.push({
          chain: 'internal',
          symbol: 'CLOSE (internal)',
          balance: data.close.balance,
          usdValue: data.close.usd || 0,
          address: null,
        });
        total += data.close.usd || 0;
      }

      setAssets(items);
      setTotalUsd(total);
    } catch (e) {
      console.error('Failed to fetch balances', e);
      let msg = 'Failed to fetch balances';
      if (e.response?.status === 403) msg = 'API key error – please check your Alchemy key.';
      else if (e.message) msg = e.message;
      setError(msg);
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
