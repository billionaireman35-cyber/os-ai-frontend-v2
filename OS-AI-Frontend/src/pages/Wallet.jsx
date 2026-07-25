import { useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const chains = ['all', 'base', 'ethereum', 'polygon', 'bsc', 'bitcoin', 'arbitrum'];

function StandardWallet() {
  const { assets, totalUsd, loading, error, fetchBalances } = useWallet();
  const [chain, setChain] = useState('all');

  const filtered = chain === 'all' ? assets : assets.filter((a) => a.chain === chain);

  return (
    <div className="space-y-6">
      <div className="flex flex-col tablet:flex-row justify-between items-start tablet:items-end gap-4">
        <div>
          <p className="text-[12px] text-muted font-mono uppercase tracking-wide">Total balance</p>
          <p className="text-3xl font-mono text-bone mt-1">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {chains.map((c) => (
            <button
              key={c}
              onClick={() => setChain(c)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-mono touch-target press-soft ${
                chain === c ? 'bg-brass text-void' : 'ledger-card text-muted hover:text-bone'
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-muted text-[13px] font-mono">Loading balances…</p>}
      {error && (
        <div className="ledger-card border-alert/30 p-4 text-[13px] text-alert flex items-center justify-between">
          Couldn't reach your wallet.
          <button onClick={fetchBalances} className="underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 tablet:grid-cols-2 landscape:grid-cols-3 gap-3">
          {filtered.length === 0 ? (
            <p className="text-muted text-[13px] col-span-full">No assets on this chain yet.</p>
          ) : (
            filtered.map((a, i) => (
              <div key={i} className="ledger-card px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[14px] text-bone font-medium">{a.symbol}</p>
                  <p className="text-[11px] text-muted font-mono">{a.balance} · {a.chain}</p>
                </div>
                <p className="font-mono text-bone text-[14px]">${a.usd.toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SafeWallet() {
  // Placeholder until /wallet/safe endpoints exist on the backend.
  // Intended flow: list Safes the user owns/co-signs, show signer threshold
  // (e.g. 2-of-3), pending proposals awaiting co-signature, and a
  // "Deploy new Safe" action.
  return (
    <div className="space-y-6">
      <div className="ledger-card p-5 flex items-start gap-3">
        <ShieldCheck size={20} className="text-teal shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] text-bone font-medium">Gnosis Safe (multisig)</p>
          <p className="text-[12px] text-muted mt-1">
            Extra security for larger balances — transactions need multiple approvals before they execute.
            Not connected yet.
          </p>
        </div>
      </div>

      <div className="ledger-card p-8 text-center">
        <Users size={22} className="text-muted mx-auto mb-2" />
        <p className="text-[13px] text-muted">No Safe deployed yet.</p>
        <button className="mt-4 bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target">
          Deploy a Safe
        </button>
      </div>
    </div>
  );
}

export default function Wallet() {
  const [tab, setTab] = useState('standard');

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <div className="flex gap-1 ledger-card p-1 w-fit">
        <button
          onClick={() => setTab('standard')}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium press-soft touch-target ${
            tab === 'standard' ? 'bg-brass text-void' : 'text-muted hover:text-bone'
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => setTab('safe')}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium press-soft touch-target flex items-center gap-1.5 ${
            tab === 'safe' ? 'bg-brass text-void' : 'text-muted hover:text-bone'
          }`}
        >
          <ShieldCheck size={14} /> Safe
        </button>
      </div>

      {tab === 'standard' ? <StandardWallet /> : <SafeWallet />}
    </div>
  );
}
