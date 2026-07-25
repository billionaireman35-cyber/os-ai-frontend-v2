import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/wallet/balance');
      const data = res.data;
      const items = [];
      let total = 0;
      for (const [chain, chainData] of Object.entries(data)) {
        if (chain === 'close') continue;
        const native = chainData.native;
        items.push({
          chain,
          symbol: native.symbol,
          balance: native.balance,
          usdValue: native.usd || 0,
        });
        total += native.usd || 0;
        for (const [symbol, token] of Object.entries(chainData.tokens || {})) {
          items.push({
            chain,
            symbol,
            balance: token.balance,
            usdValue: token.usd || 0,
          });
          total += token.usd || 0;
        }
      }
      if (data.close) {
        items.push({
          chain: 'close',
          symbol: 'CLOSE',
          balance: data.close.balance,
          usdValue: 0,
        });
      }
      setBalances(items);
      setTotalUsd(total);
    } catch (e) {
      console.error('Failed to fetch balances', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBalances();
  }, [user]);

  const sendTransaction = async (to, amount, token, chain, signedTx) => {
    const res = await api.post('/wallet/send', { to, amount, token, chain, signed_tx: signedTx });
    return res.data;
  };

  return (
    <WalletContext.Provider value={{ balances, totalUsd, loading, fetchBalances, sendTransaction }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
