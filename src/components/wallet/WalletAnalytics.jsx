import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { api } from '../../utils/api';
import {
  BarChart3,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Layers3,
  Sparkles,
  WalletCards,
} from 'lucide-react';

const HOLDING_COLORS = [
  '#8B5CF6',
  '#E8C877',
  '#6E9B79',
  '#8A9BA8',
  '#C1554A',
  '#5C5646',
];

const KIND_META = {
  send: {
    label: 'Sent',
    icon: ArrowUpRight,
  },
  receive: {
    label: 'Received',
    icon: ArrowDownRight,
  },
  swap: {
    label: 'Swaps',
    icon: Activity,
  },
  deposit: {
    label: 'Deposits',
    icon: Layers3,
  },
};

function formatUsd(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function HoldingsDonut({ assets, totalUsd }) {
  const sorted = useMemo(
    () => [...(assets || [])]
      .filter((a) => Number(a.usdValue || 0) > 0)
      .sort((a, b) => Number(b.usdValue || 0) - Number(a.usdValue || 0)),
    [assets]
  );

  if (!sorted.length || !totalUsd) {
    return (
      <div className="py-10 text-center">
        <WalletCards size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
        <p className="text-sm text-[var(--text-muted)]">
          Your portfolio allocation will appear here.
        </p>
      </div>
    );
  }

  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const restUsd = rest.reduce((sum, a) => sum + Number(a.usdValue || 0), 0);

  const slices = top.map((asset, index) => ({
    symbol: asset.symbol,
    usd: Number(asset.usdValue || 0),
    pct: (Number(asset.usdValue || 0) / totalUsd) * 100,
    color: HOLDING_COLORS[index % HOLDING_COLORS.length],
  }));

  if (restUsd > 0) {
    slices.push({
      symbol: 'Other',
      usd: restUsd,
      pct: (restUsd / totalUsd) * 100,
      color: HOLDING_COLORS[5],
    });
  }

  let cumulative = 0;
  const stops = slices.map((slice) => {
    const start = cumulative;
    cumulative += slice.pct;
    return `${slice.color} ${start}% ${cumulative}%`;
  }).join(', ');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-7">
      <div
        className="relative w-40 h-40 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${stops})`,
          filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.25))',
        }}
      >
        <div className="absolute inset-[18px] rounded-full bg-[var(--bg-secondary)] border border-white/[0.05] flex flex-col items-center justify-center">
          <p className="text-[9px] uppercase tracking-[2px] text-[var(--text-muted)]">
            Allocation
          </p>
          <p className="text-xl font-display font-bold text-[var(--text-primary)] mt-1">
            100%
          </p>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {slices.map((slice) => (
          <div
            key={slice.symbol}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-white/[0.025] border border-white/[0.04]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: slice.color }}
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {slice.symbol}
              </span>
            </div>

            <div className="text-right">
              <p className="text-xs font-mono text-[var(--text-primary)]">
                {formatUsd(slice.usd)}
              </p>
              <p className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">
                {slice.pct.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityBreakdown({ history, loading }) {
  const breakdown = useMemo(() => {
    const counts = {};

    for (const tx of history || []) {
      const kind = String(tx.kind || 'other').toLowerCase();
      counts[kind] = (counts[kind] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([kind, count]) => ({
        kind,
        count,
        ...(KIND_META[kind] || {
          label: kind.charAt(0).toUpperCase() + kind.slice(1),
          icon: Activity,
        }),
      }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  if (loading) {
    return (
      <div className="h-36 rounded-2xl bg-white/[0.025] animate-pulse" />
    );
  }

  if (!breakdown.length) {
    return (
      <div className="py-10 text-center">
        <Activity size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
        <p className="text-sm text-[var(--text-muted)]">
          No wallet activity yet.
        </p>
      </div>
    );
  }

  const max = Math.max(...breakdown.map((item) => item.count));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {breakdown.map((item) => {
        const Icon = item.icon;
        const percentage = (item.count / max) * 100;

        return (
          <div
            key={item.kind}
            className="rounded-2xl p-3.5 bg-white/[0.025] border border-white/[0.05]"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-violet-500/[0.08] border border-violet-400/[0.10] flex items-center justify-center">
                <Icon size={15} className="text-violet-300/80" />
              </div>
              <span className="font-mono text-lg font-bold text-[var(--text-primary)]">
                {item.count}
              </span>
            </div>

            <p className="text-[10px] uppercase tracking-[1.5px] text-[var(--text-muted)] mt-3">
              {item.label}
            </p>

            <div className="h-1 rounded-full bg-white/[0.05] mt-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  background: 'linear-gradient(90deg, var(--accent-brass), var(--accent-brass-bright))',
                }}
              />
            </div>
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
    let mounted = true;

    setHistoryLoading(true);

    api.get('/wallet/transactions/history')
      .then((res) => {
        if (mounted) {
          setHistory(res.data?.history || []);
        }
      })
      .catch(() => {
        if (mounted) {
          setHistory([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setHistoryLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-36 rounded-[28px] bg-white/[0.025] animate-pulse" />
        <div className="h-72 rounded-[28px] bg-white/[0.025] animate-pulse" />
      </div>
    );
  }

  const closeAsset = (assets || []).find((a) => a.symbol === 'CLOSE');
  const assetCount = (assets || []).filter((a) => Number(a.balance || 0) > 0).length;

  return (
    <div className="space-y-5">
      {/* Portfolio Intelligence Hero */}
      <section
        className="relative overflow-hidden rounded-[30px] p-5 sm:p-7"
        style={{
          background:
            'radial-gradient(circle at 85% 10%, rgba(124,58,237,0.18), transparent 34%), linear-gradient(135deg, #060607 0%, #0b0b10 58%, #060607 100%)',
          border: '1px solid rgba(139,92,246,0.14)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.25)',
        }}
      >
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-violet-600/[0.08] blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={13} className="text-violet-300" />
            <p className="text-[9px] uppercase font-semibold tracking-[3px] text-violet-200/80">
              Portfolio Intelligence
            </p>
          </div>

          <p className="text-[10px] uppercase tracking-[2px] text-[var(--text-muted)]">
            Total portfolio value
          </p>

          <p className="text-4xl sm:text-5xl font-display font-bold tracking-[-2px] text-[var(--text-primary)] mt-1">
            {formatUsd(totalUsd)}
          </p>

          <div className="grid grid-cols-3 gap-2.5 mt-7">
            <div className="rounded-2xl bg-white/[0.035] border border-white/[0.05] p-3">
              <p className="text-[8.5px] uppercase tracking-[1.5px] text-[var(--text-muted)]">
                Assets
              </p>
              <p className="text-lg font-display font-bold text-[var(--text-primary)] mt-1">
                {assetCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.035] border border-white/[0.05] p-3">
              <p className="text-[8.5px] uppercase tracking-[1.5px] text-[var(--text-muted)]">
                Activity
              </p>
              <p className="text-lg font-display font-bold text-[var(--text-primary)] mt-1">
                {historyLoading ? '—' : history.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.035] border border-white/[0.05] p-3">
              <p className="text-[8.5px] uppercase tracking-[1.5px] text-[var(--text-muted)]">
                CLOSE
              </p>
              <p className="text-lg font-display font-bold text-[var(--accent-brass-bright)] mt-1 truncate">
                {closeAsset ? Number(closeAsset.balance || 0).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Allocation */}
      <section>
        <div className="flex items-end justify-between mb-2.5 px-1">
          <div>
            <p className="text-[9px] uppercase tracking-[2.5px] text-violet-300/70">
              Portfolio
            </p>
            <h3 className="text-lg font-display font-bold text-[var(--text-primary)] mt-0.5">
              Asset allocation
            </h3>
          </div>
          <BarChart3 size={17} className="text-[var(--text-muted)]" />
        </div>

        <div className="glass-panel rounded-[26px] p-4 sm:p-6">
          <HoldingsDonut assets={assets} totalUsd={totalUsd} />
        </div>
      </section>

      {/* Activity */}
      <section>
        <div className="flex items-end justify-between mb-2.5 px-1">
          <div>
            <p className="text-[9px] uppercase tracking-[2.5px] text-violet-300/70">
              Wallet activity
            </p>
            <h3 className="text-lg font-display font-bold text-[var(--text-primary)] mt-0.5">
              Activity overview
            </h3>
          </div>
          <Activity size={17} className="text-[var(--text-muted)]" />
        </div>

        <div className="glass-panel rounded-[26px] p-4 sm:p-5">
          <ActivityBreakdown history={history} loading={historyLoading} />
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 py-1 text-[9px] uppercase tracking-[2px] text-[var(--text-muted)]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
        Live wallet data · Non-custodial
      </div>
    </div>
  );
}
