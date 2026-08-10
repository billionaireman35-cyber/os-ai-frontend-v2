import React from 'react';
import { useWallet } from '../../context/WalletContext';

export function WalletAnalytics() {
  const { assets, totalUsd, loading } = useWallet();

  if (loading) return <div className="text-[var(--text-muted)]">Loading analytics...</div>;

  const totalAssets = assets.length;
  const totalTransactions = 0; // we could fetch from backend, but we'll show a message
  const gasSpent = 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Total Value</p>
          <p className="text-2xl font-mono font-bold text-[#d4af37]">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Transactions</p>
          <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">{totalTransactions}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Gas Fees</p>
          <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">${gasSpent.toFixed(4)}</p>
        </div>
      </div>
      <div className="glass-card p-4 text-center text-[var(--text-muted)]">
        <p>Transaction history and detailed analytics coming soon.</p>
      </div>
    </div>
  );
}
