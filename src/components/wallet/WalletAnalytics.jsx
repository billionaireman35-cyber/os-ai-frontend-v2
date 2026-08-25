import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { api } from '../../utils/api';

const HOLDING_COLORS = ['#E8C877', '#8A9BA8', '#9B7FD4', '#6E9B79', '#C1554A', '#5C5646'];

function HoldingsDonut({ assets, totalUsd }) {
  if (!assets || assets.length === 0 || !totalUsd) {
    return <p className="text-sm text-center py-6 text-[var(--text-muted)]">No holdings yet.</p>;
  }

  const sorted = [...assets].sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const restUsd = rest.reduce((sum, a) => sum + (a.usdValue || 0), 0);

  const slices = top.map((a, i) => ({
    sym: a.symbol,
    usd: a.usdValue || 0,
    pct: totalUsd ? ((a.usdValue || 0) / totalUsd) * 100 : 0,
    color: HOLDING_COLORS[i % HOLDING_COLORS.length],
  }));
  if (restUsd > 0) {
    slices.push({
      sym: 'Other',
      usd: restUsd,
      pct: totalUsd ? (restUsd / totalUsd) * 100 : 0,
      color: HOLDING_COLORS[HOLDING_COLORS.length - 1],
    });
  }

  let cumulative = 0;
  const stops = slices
    .map((s) => {
      const start = cumulative;
      cumulative += s.pct;
      return `${s.color} ${start}% ${cumulative}%`;
    })
    .join(', ');

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-24 h-24 rounded-full shrink-0 relative"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-3.5 rounded-full bg-[var(--bg-secondary)]" />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="font-medium text-[var(--text-primary)]">{s.sym}</span>
            </div>
            <span className="font-mono text-[var(--text-muted)]">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityByKind({ history }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-center py-6 text-[var(--text-muted)]">No activity yet.</p>;
  }

  const counts = {};
  for (const tx of history) {
    const kind = tx.kind || 'other';
    counts[kind] = (counts[kind] || 0) + 1;
  }
  const kinds = Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const max = Math.max(...kinds.map((k) => k.count));

  return (
    <div className="flex items-end gap-3.5 h-28 pt-5">
      {kinds.map((k, i) => {
        const heightPct = (k.count / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div className="relative w-full flex justify-center" style={{ height: `${heightPct}%` }}>
              <span className="absolute -top-4.5 font-mono text-[11px] text-[var(--text-primary)]">{k.count}</span>
              <div
                className="w-full rounded-t-md rounded-b-sm"
                style={{ height: '100%', background: 'linear-gradient(180deg, var(--accent-brass-bright), var(--accent-brass-dim))' }}
              />
            </div>
            <span className="font-mono text-[9.5px] uppercase text-[var(--text-muted)] capitalize">{k.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function WalletAnalytics() {
  const { assets, totalUsd, loading } = useWallet();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    setHistoryLoading(true);
    api.get('/wallet/transactions/history')
      .then((res) => setHistory(res.data?.history || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  if (loading) return <div className="text-[var(--text-muted)]">Loading analytics...</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-card p-3.5">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Total Value</p>
          <p className="text-[22px] font-mono font-bold text-[var(--accent-brass)]">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Transactions</p>
          <p className="text-[22px] font-mono font-bold text-[var(--text-primary)]">
            {historyLoading ? '—' : history.length}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Holdings Breakdown</h3>
        <div className="glass-card p-4">
          <HoldingsDonut assets={assets} totalUsd={totalUsd} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Activity by Type</h3>
        <div className="glass-card p-4">
          {historyLoading ? (
            <p className="text-sm text-center py-6 text-[var(--text-muted)]">Loading...</p>
          ) : (
            <ActivityByKind history={history} />
          )}
        </div>
      </div>
    </div>
  );
}
