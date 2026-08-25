import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Crown, Loader2, Users, Layers, ArrowLeftRight, Coins, Vault, CheckCircle, AlertTriangle } from 'lucide-react';

const PAGE_SIZE = 50;

const TABS = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'workspaces', label: 'Hubs', icon: Layers },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { key: 'treasury', label: 'Treasury', icon: Vault },
];

function usePaginatedFounderData(endpoint, listKey, active) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);

  const load = useCallback(async (nextOffset) => {
    setLoading(true);
    try {
      const res = await api.get(`${endpoint}?limit=${PAGE_SIZE}&offset=${nextOffset}`);
      setTotal(res.data.total || 0);
      setItems((prev) => (nextOffset === 0 ? res.data[listKey] || [] : [...prev, ...(res.data[listKey] || [])]));
      setOffset(nextOffset);
      setError(null);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Failed to load';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [endpoint, listKey]);

  useEffect(() => {
    if (active && items.length === 0 && !loading) {
      load(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const loadMore = () => load(offset + PAGE_SIZE);
  const hasMore = items.length < total;

  return { items, total, loading, error, loadMore, hasMore, reload: () => load(0) };
}

function UsersTab({ active }) {
  const { items, total, loading, error, loadMore, hasMore, reload } = usePaginatedFounderData(
    '/founder-suite/users', 'users', active
  );

  if (error) {
    return (
      <div className="p-4 text-yellow-400">
        <p>⚠️ {error}</p>
        <button onClick={reload} className="mt-2 underline text-[#d4af37]">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-muted)]">{total} users</p>
      {items.map((u) => (
        <div key={u.id} className="glass-card p-3 flex items-center gap-3 border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all rounded-xl">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.14)', color: '#818cf8' }}>
            <Users size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{u.name || 'Unnamed'} {u.is_founder && <span className="text-[#d4af37]">👑</span>}</p>
            <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {u.stake_tier || 'guest'} · {u.fingerprint_verified ? 'verified' : 'unverified'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-[#d4af37]">{u.close_balance} CLOSE</p>
            <p className="text-xs text-[var(--text-muted)]">staked: {u.close_staked}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {u.last_active ? new Date(u.last_active).toLocaleDateString() : 'never active'}
            </p>
          </div>
        </div>
      ))}
      {items.length === 0 && !loading && (
        <div className="text-center text-[var(--text-muted)] py-10">No users found</div>
      )}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full mt-3 py-2 rounded-xl border border-[var(--border-color)] hover:border-[#d4af37]/30 text-sm text-[var(--text-secondary)] disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}

function WorkspacesTab({ active }) {
  const { items, total, loading, error, loadMore, hasMore, reload } = usePaginatedFounderData(
    '/founder-suite/workspaces', 'workspaces', active
  );

  if (error) {
    return (
      <div className="p-4 text-yellow-400">
        <p>⚠️ {error}</p>
        <button onClick={reload} className="mt-2 underline text-[#d4af37]">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-muted)]">{total} hubs</p>
      {items.map((w) => (
        <div key={w.id} className="glass-card p-3 flex items-center gap-3 border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all rounded-xl">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(110,155,121,0.14)', color: '#6E9B79' }}>
            <Layers size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{w.name} {w.is_public ? '· public' : '· private'}</p>
            <p className="text-xs text-[var(--text-muted)]">{w.description || 'No description'}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">owner: {w.owner_email || w.owner_id}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-sm">{w.room_code}</p>
            <p className="text-xs text-green-400">{w.approved_members} approved</p>
            {w.pending_requests > 0 && (
              <p className="text-xs text-yellow-400">{w.pending_requests} pending</p>
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && !loading && (
        <div className="text-center text-[var(--text-muted)] py-10">No workspaces found</div>
      )}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full mt-3 py-2 rounded-xl border border-[var(--border-color)] hover:border-[#d4af37]/30 text-sm text-[var(--text-secondary)] disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}

function TransactionsTab({ active }) {
  const { items, total, loading, error, loadMore, hasMore, reload } = usePaginatedFounderData(
    '/founder-suite/transactions', 'transactions', active
  );

  return (
    <div className="space-y-2">
      {error ? (
        <div className="p-4 text-yellow-400">
          <p>⚠️ {error}</p>
          <button onClick={reload} className="mt-2 underline text-[#d4af37]">Retry</button>
        </div>
      ) : (
        <>
          <p className="text-xs text-[var(--text-muted)]">{total} transactions</p>
          {items.map((t) => (
            <div key={`${t.source}-${t.id}`} className="glass-card p-3 flex items-center gap-3 border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all rounded-xl">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(201,169,97,0.14)', color: '#d4af37' }}>
                <ArrowLeftRight size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{t.kind}</p>
                <p className="text-xs text-[var(--text-muted)]">{t.user_email || t.user_id}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {t.source} {t.status ? `· ${t.status}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                {t.amount != null && <p className="font-mono text-[#d4af37]">{t.amount}</p>}
                <p className="text-xs text-[var(--text-muted)]">
                  {t.created ? new Date(t.created).toLocaleString() : ''}
                </p>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="text-center text-[var(--text-muted)] py-10">No transactions found</div>
          )}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full mt-3 py-2 rounded-xl border border-[var(--border-color)] hover:border-[#d4af37]/30 text-sm text-[var(--text-secondary)] disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function TreasuryTab({ active }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/founder-suite/staking-treasury?limit=100&offset=0');
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && !data && !loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (error) {
    return (
      <div className="p-4 text-yellow-400">
        <p>⚠️ {error}</p>
        <button onClick={load} className="mt-2 underline text-[#d4af37]">Retry</button>
      </div>
    );
  }

  if (!data) {
    return loading ? (
      <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#d4af37]" /></div>
    ) : null;
  }

  const balanceKnown = data.treasury_balance !== null && data.treasury_balance !== undefined;

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-4"
        style={{
          background: data.solvent ? 'rgba(110,155,121,0.1)' : 'rgba(193,85,74,0.1)',
          border: `1px solid ${data.solvent ? 'rgba(110,155,121,0.35)' : 'rgba(193,85,74,0.4)'}`,
        }}
      >
        <div className="flex items-center gap-2">
          {data.solvent ? (
            <CheckCircle size={18} className="text-[var(--success)]" />
          ) : (
            <AlertTriangle size={18} className="text-[var(--danger)]" />
          )}
          <p className="font-bold text-sm" style={{ color: data.solvent ? 'var(--success)' : 'var(--danger)' }}>
            {balanceKnown ? (data.solvent ? 'Treasury is solvent' : 'Treasury cannot cover all obligations') : 'Could not read on-chain balance'}
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1 font-mono break-all">{data.treasury_address}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">On-Chain Balance</p>
          <p className="text-xl font-display font-bold text-[var(--text-primary)]">
            {balanceKnown ? data.treasury_balance.toLocaleString() : '—'}
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Total Owed</p>
          <p className="text-xl font-display font-bold text-[var(--accent-brass-bright)]">{data.total_owed.toLocaleString()}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Total Staked</p>
          <p className="text-lg font-display font-bold text-[var(--text-primary)]">{data.total_staked.toLocaleString()}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Pending Yield</p>
          <p className="text-lg font-display font-bold text-[var(--text-primary)]">{data.total_pending_yield.toLocaleString()}</p>
        </div>
      </div>

      <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
        Active Positions ({data.active_position_count})
      </p>

      {data.positions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">No active positions.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.positions.map((p) => (
            <div key={p.id} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{p.amount.toLocaleString()} CLOSE</p>
                <p className="text-xs text-[var(--text-muted)]">{p.user_email || p.user_id}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-[var(--success)]">{p.apy}% APY</p>
                <p className="text-xs text-[var(--accent-brass)]">+{p.pending_yield.toFixed(2)} pending</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sanctum() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');

  if (!user?.is_founder) {
    return (
      <div className="p-6 text-[var(--text-primary)]">
        <h1 className="text-2xl font-bold">Sanctum</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">Founder-only area</p>
        <div className="mt-4 text-yellow-400">Access denied. You must be a founder.</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-full">
      <div
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(201,169,97,0.14), rgba(201,169,97,0.03))',
          border: '1px solid rgba(201,169,97,0.32)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 15% 0%, rgba(201,169,97,0.2), transparent 65%)' }}
        />
        <div className="relative flex items-center gap-3.5">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--accent-brass-bright, #E8C877), #C9A961)', color: '#14120C' }}
          >
            <Crown size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Sanctum</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Founder-only oversight</p>
          </div>
        </div>
        <div
          className="relative inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-mono font-semibold"
          style={{ background: 'rgba(201,169,97,0.12)', border: '1px solid rgba(201,169,97,0.16)', color: '#E8C877' }}
        >
          <Coins size={13} /> {user.close_balance} CLOSE
        </div>
      </div>

      <div
        className="flex gap-1 p-1 w-fit rounded-2xl flex-wrap"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,169,97,0.16)' }}
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tab === key
              ? { background: '#d4af37', color: '#000' }
              : { color: 'var(--text-muted)' }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'users' && <UsersTab active={tab === 'users'} />}
        {tab === 'workspaces' && <WorkspacesTab active={tab === 'workspaces'} />}
        {tab === 'transactions' && <TransactionsTab active={tab === 'transactions'} />}
        {tab === 'treasury' && <TreasuryTab active={tab === 'treasury'} />}
      </div>
    </div>
  );
}
