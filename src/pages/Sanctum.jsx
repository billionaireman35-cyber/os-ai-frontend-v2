import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Crown, Loader2, Users, Layers, ArrowLeftRight } from 'lucide-react';

const PAGE_SIZE = 50;

const TABS = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'workspaces', label: 'Hubs', icon: Layers },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
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
        <div key={u.id} className="glass-card p-3 flex items-center justify-between border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all rounded-xl">
          <div>
            <p className="font-bold">{u.name || 'Unnamed'} {u.is_founder && <span className="text-[#d4af37]">👑</span>}</p>
            <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {u.stake_tier || 'guest'} · {u.fingerprint_verified ? 'verified' : 'unverified'}
            </p>
          </div>
          <div className="text-right">
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
        <div key={w.id} className="glass-card p-3 border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{w.name} {w.is_public ? '· public' : '· private'}</p>
              <p className="text-xs text-[var(--text-muted)]">{w.description || 'No description'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">owner: {w.owner_email || w.owner_id}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{w.room_code}</p>
              <p className="text-xs text-green-400">{w.approved_members} approved</p>
              {w.pending_requests > 0 && (
                <p className="text-xs text-yellow-400">{w.pending_requests} pending</p>
              )}
            </div>
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
            <div key={`${t.source}-${t.id}`} className="glass-card p-3 flex items-center justify-between border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all rounded-xl">
              <div>
                <p className="font-bold">{t.kind}</p>
                <p className="text-xs text-[var(--text-muted)]">{t.user_email || t.user_id}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {t.source} {t.status ? `· ${t.status}` : ''}
                </p>
              </div>
              <div className="text-right">
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
      <div className="flex items-center gap-3">
        <Crown size={32} className="text-[#d4af37]" />
        <div>
          <h1 className="text-3xl font-display font-bold">Sanctum</h1>
          <p className="text-sm text-[var(--text-muted)]">Welcome, Founder 👑 — CLOSE Balance: {user.close_balance}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--border-color)]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'users' && <UsersTab active={tab === 'users'} />}
        {tab === 'workspaces' && <WorkspacesTab active={tab === 'workspaces'} />}
        {tab === 'transactions' && <TransactionsTab active={tab === 'transactions'} />}
      </div>
    </div>
  );
}
