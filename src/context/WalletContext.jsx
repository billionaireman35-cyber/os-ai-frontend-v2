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

      // On-chain balances. CLOSE is tracked as a normal ERC-20 token here
      // (see blockchain.py's get_all_balances token list), so it's already
      // included via the token loop below - the 'close' field is a separate,
      // legacy internal-DB-ledger number that no longer reflects anything
      // real (see workspace_payment_service.py / 2026-08-19 architecture
      // decision) and is intentionally skipped, not surfaced as a fake
      // sendable asset.
      for (const [chain, chainData] of Object.entries(data)) {
        if (chain === 'close') continue;
        const native = chainData.native;
        if (native && native.balance > 0) {
          items.push({
            chain,
            symbol: native.symbol || chain.toUpperCase(),
            balance: native.balance,
            usdValue: native.usd || 0,
            change24h: native.change_24h ?? null,
            sparkline: native.sparkline_7d || null,
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
              change24h: token.change_24h ?? null,
              sparkline: token.sparkline_7d || null,
            });
            total += token.usd || 0;
          }
        }
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
