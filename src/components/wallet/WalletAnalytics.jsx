import { useWallet } from '../../context/WalletContext';
import { BarChart, TrendingUp, DollarSign, Activity } from 'lucide-react';

export function WalletAnalytics() {
  const { totalUsd, assets } = useWallet();

  // Mock data (we'll expand later)
  const totalTransactions = 12;
  const totalGasSpent = 0.0034;
  const topTokens = assets
    ?.sort((a, b) => b.usdValue - a.usdValue)
    .slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <DollarSign size={16} />
            <span>Total Value</span>
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--text-primary)] mt-1">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <Activity size={16} />
            <span>Transactions</span>
          </div>
          <p className="text-2xl font-mono font-bold text-[var(--text-primary)] mt-1">{totalTransactions}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--accent-brass)]" />
          Top Holdings
        </h3>
        {topTokens.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm mt-2">No assets yet</p>
        ) : (
          <div className="space-y-2 mt-2">
            {topTokens.map((token, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-primary)]">{token.symbol}</span>
                <span className="text-sm font-mono text-[var(--text-secondary)]">${token.usdValue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Gas Fees</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">Total spent: <span className="font-mono text-[var(--text-primary)]">{totalGasSpent} POL</span></p>
      </div>
    </div>
  );
}
