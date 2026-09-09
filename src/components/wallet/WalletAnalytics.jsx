import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { api } from '../../utils/api';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  ExternalLink,
  Coins,
  History,
  Layers3,
  WalletCards,
  Sparkles,
  BarChart3,
} from 'lucide-react';

const HOLDING_COLORS = [
  '#4ADE80',
  '#A3E635',
  '#6EE7B7',
  '#94A3B8',
  '#64748B',
  '#475569',
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

  return (
    <div>
      {/* Proportional stacked bar - replaces the donut+overlapping-legend
          layout, which crowded badly on narrow screens. A single bar with
          segments is unambiguous at any width and needs no side-by-side
          companion element to make sense. */}
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-white/[0.04]">
        {slices.map((slice) => (
          <div
            key={slice.symbol}
            style={{ width: `${slice.pct}%`, background: slice.color }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {slices.map((slice) => (
          <div
            key={slice.symbol}
            className="rounded-xl px-3 py-2.5 bg-white/[0.025] border border-white/[0.04]"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: slice.color }}
              />
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {slice.symbol}
              </span>
            </div>
            <p className="text-xs font-mono text-[var(--text-primary)] mt-1.5">
              {formatUsd(slice.usd)}
            </p>
            <p className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">
              {slice.pct.toFixed(1)}% of portfolio
            </p>
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
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl bg-white/[0.025] animate-pulse" />)}
      </div>
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
    <div className="grid grid-cols-2 gap-3">
      {breakdown.map((item) => {
        const Icon = item.icon;
        const percentage = (item.count / max) * 100;
        return (
          <div
            key={item.kind}
            className="rounded-2xl p-5 bg-white/[0.025] border border-white/[0.05]"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-400/[0.08] border border-emerald-400/[0.14] flex items-center justify-center">
              <Icon size={20} className="text-emerald-300/90" />
            </div>

            <p className="font-mono text-3xl font-bold text-[var(--text-primary)] mt-4">
              {item.count}
            </p>
            <p className="text-[11px] uppercase tracking-[1.5px] text-[var(--text-muted)] mt-1.5">
              {item.label}
            </p>

            <div className="h-1.5 rounded-full bg-white/[0.06] mt-4 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  background: 'linear-gradient(90deg, #4ADE80, #22C55E)',
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
            'radial-gradient(circle at 85% 10%, rgba(74,222,128,0.035), transparent 34%), linear-gradient(135deg, #060607 0%, #0b0b10 58%, #060607 100%)',
          border: '1px solid rgba(74,222,128,0.10)',
          boxShadow: '0 20px 55px rgba(0,0,0,0.20)',
        }}
      >
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-emerald-400/[0.025] blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={13} className="text-emerald-300/80" />
            <p className="text-[9px] uppercase font-semibold tracking-[3px] text-emerald-200/70">
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
              <p className="text-[13px] font-display font-bold text-[var(--accent-brass-bright)] mt-1 leading-tight break-words" title={closeAsset ? Number(closeAsset.balance || 0).toLocaleString() : '0'}>
                {closeAsset ? Number(closeAsset.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Allocation */}
      <section>
        <div className="flex items-end justify-between mb-2.5 px-1">
          <div>
            <p className="text-[9px] uppercase tracking-[2.5px] text-emerald-300/60">
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
            <p className="text-[9px] uppercase tracking-[2.5px] text-emerald-300/60">
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
