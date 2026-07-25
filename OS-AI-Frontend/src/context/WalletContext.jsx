import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/wallet/balance');
      const data = res.data;
      const items = [];
      let total = 0;

      for (const [chain, chainData] of Object.entries(data)) {
        if (chain === 'close') continue;
        const native = chainData.native;
        if (native) {
          items.push({
            chain,
            symbol: native.symbol,
            balance: native.balance,
            usd: native.usd || 0,
          });
          total += native.usd || 0;
        }
        for (const [symbol, token] of Object.entries(chainData.tokens || {})) {
          items.push({ chain, symbol, balance: token.balance, usd: token.usd || 0 });
          total += token.usd || 0;
        }
      }
      if (data.close) {
        items.push({ chain: 'native', symbol: 'CLOSE', balance: data.close.balance, usd: 0 });
      }
      setAssets(items);
      setTotalUsd(total);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchBalances();
  }, [user, fetchBalances]);

  const sendTransaction = async (to, amount, token, chain, signedTx) => {
    const res = await api.post('/wallet/send', { to, amount, token, chain, signed_tx: signedTx });
    return res.data;
  };

  return (
    <WalletContext.Provider
      value={{ assets, totalUsd, loading, error, fetchBalances, sendTransaction }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
