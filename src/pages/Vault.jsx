import { useState } from 'react';
import { ShieldCheck, Send, ArrowUpDown, Lock, X } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { signSend, broadcastTx } from '../utils/ethers';
import { ethers } from 'ethers';
import { SwapModal } from '../components/SwapModal';

const chains = ['all', 'polygon', 'ethereum', 'bsc', 'arbitrum', 'base'];

const TOKEN_ADDRESSES = {
  polygon: {
    CLOSE: import.meta.env.VITE_CLOSE_CONTRACT || '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8',
    OSINA: '0xbaf280b74c264a911b41341a26508eac9e74fd4f',
  },
};

function SendModal({ isOpen, onClose, asset, onSent }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(asset?.symbol || 'CLOSE');
  const [chain, setChain] = useState(asset?.chain || 'polygon');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen || !asset) return null;

  const handleSend = async () => {
    if (!to || !amount || parseFloat(amount) <= 0) {
      setError('Invalid recipient or amount');
      return;
    }
    const password = window.prompt('Enter your wallet password:');
    if (!password) {
      setError('Password required');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;
      let tokenAddress = null;
      let amountInWei;
      if (token === 'native') {
        amountInWei = ethers.utils.parseEther(amount).toString();
      } else {
        const decimals = 18;
        amountInWei = ethers.utils.parseUnits(amount, decimals).toString();
        tokenAddress = TOKEN_ADDRESSES[chain]?.[token];
        if (!tokenAddress) throw new Error(`Token ${token} not supported on ${chain}`);
      }
      const signedTx = await signSend(encryptedSeed, password, to, amountInWei, tokenAddress, chain);
      const broadcastRes = await broadcastTx(signedTx, chain);
      setSuccess(`Transaction broadcasted: ${broadcastRes.tx_hash}`);
      onSent?.(broadcastRes.tx_hash);
      setTimeout(() => { onClose(); setSuccess(null); }, 3000);
    } catch (e) {
      setError(e.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-panel2)] border border-[var(--color-line)] rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[16px] font-display text-[var(--color-text-primary)]">Send Tokens</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] touch-target"><X size={20} /></button>
        </div>
        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Recipient</label>
          <input type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass" placeholder="0x..." />
        </div>
        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Amount</label>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass" placeholder="0.0" />
        </div>
        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Token</label>
          <select value={token} onChange={(e) => setToken(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)]">
            <option value="native">Native (POL/ETH/BNB)</option>
            <option value="CLOSE">CLOSE</option>
            <option value="OSINA">OSINA</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Chain</label>
          <select value={chain} onChange={(e) => setChain(e.target.value)} className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)]">
            <option value="polygon">Polygon</option>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="base">Base</option>
          </select>
        </div>
        {error && <p className="text-[12px] text-[var(--color-danger)] font-mono">{error}</p>}
        {success && <p className="text-[12px] text-[var(--color-success)] font-mono">{success}</p>}
        <div className="flex gap-2">
          <button onClick={handleSend} disabled={loading} className="flex-1 bg-brass hover:bg-brassLight disabled:opacity-50 text-void font-semibold rounded-md py-2.5 press-soft touch-target">{loading ? 'Sending…' : 'Send'}</button>
          <button onClick={onClose} className="flex-1 bg-[var(--color-panel)] border border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-md py-2.5 press-soft touch-target">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function StandardWallet() {
  const { balances, totalUsd, loading, error, fetchBalances } = useWallet();
  const [chain, setChain] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAsset, setSendAsset] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);

  const filtered = chain === 'all' ? balances : balances.filter((a) => a.chain === chain);

  const createWallet = async () => {
    const password = prompt('Enter a password to encrypt your wallet:');
    if (!password) return;
    try {
      const res = await api.post('/wallet/create', { password });
      alert(`Wallet created!\nAddress: ${res.data.address}\nBonus: 500 CLOSE\nSeed phrase: ${res.data.seed_phrase}`);
      fetchBalances();
    } catch (e) {
      alert(e.response?.data?.detail || 'Wallet creation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col tablet:flex-row justify-between items-start tablet:items-end gap-4">
        <div>
          <p className="text-[12px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Total balance</p>
          <p className="text-3xl font-mono text-[var(--color-text-primary)] mt-1">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {chains.map((c) => (
            <button key={c} onClick={() => setChain(c)} className={`px-3 py-1.5 rounded-md text-[12px] font-mono touch-target press-soft ${chain === c ? 'bg-brass text-void' : 'bg-[var(--color-panel)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-line)]'}`}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={createWallet} className="bg-brass hover:bg-brassLight text-void text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target flex items-center gap-1">
          <Lock size={16} /> Create Wallet
        </button>
        <button onClick={() => { if (balances.length === 0) { alert('No assets to send. Create a wallet and add funds first.'); return; } setSendAsset({ symbol: 'CLOSE', chain: 'polygon' }); setShowSendModal(true); }} className="bg-teal/20 hover:bg-teal/30 text-teal text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target flex items-center gap-1">
          <Send size={16} /> Send
        </button>
        <button onClick={() => setShowSwapModal(true)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target flex items-center gap-1">
          <ArrowUpDown size={16} /> Swap
        </button>
        <button onClick={() => fetchBalances()} className="bg-[var(--color-panel)] hover:bg-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-[13px] font-semibold rounded-md px-4 py-2 press-soft touch-target flex items-center gap-1 border border-[var(--color-line)]">
          ⟳ Refresh
        </button>
      </div>

      {loading && <p className="text-[var(--color-text-muted)] text-[13px] font-mono">Loading balances…</p>}
      {error && (
        <div className="ledger-card border-[var(--color-danger)]/30 p-4 text-[13px] text-[var(--color-danger)] flex items-center justify-between">
          Couldn't reach your wallet.
          <button onClick={fetchBalances} className="underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 tablet:grid-cols-2 landscape:grid-cols-3 gap-3">
          {filtered.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-[13px] col-span-full">No assets on this chain yet.</p>
          ) : (
            filtered.map((a, i) => (
              <div key={i} className="ledger-card px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[14px] text-[var(--color-text-primary)] font-medium">{a.symbol}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{a.balance} · {a.chain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[var(--color-text-primary)] text-[14px]">${a.usdValue.toFixed(2)}</p>
                  <button onClick={() => { setSendAsset(a); setShowSendModal(true); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><Send size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} asset={sendAsset} onSent={(txHash) => { console.log('Transaction sent:', txHash); fetchBalances(); }} />
      <SwapModal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} onSwap={(txHash) => { console.log('Swap tx:', txHash); fetchBalances(); }} />
    </div>
  );
}

function SafeWallet() {
  return (
    <div className="space-y-6">
      <div className="ledger-card p-5 flex items-start gap-3">
        <ShieldCheck size={20} className="text-teal shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] text-[var(--color-text-primary)] font-medium">Gnosis Safe Multisig</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Extra security for larger balances — coming soon.</p>
        </div>
      </div>
      <div className="ledger-card p-8 text-center">
        <p className="text-[13px] text-[var(--color-text-muted)]">Safe integration is being prepared.</p>
      </div>
    </div>
  );
}

export default function Vault() {
  const [tab, setTab] = useState('standard');

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <div className="flex gap-1 ledger-card p-1 w-fit">
        <button onClick={() => setTab('standard')} className={`px-4 py-1.5 rounded-md text-[13px] font-medium press-soft touch-target ${tab === 'standard' ? 'bg-brass text-void' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}>
          Standard
        </button>
        <button onClick={() => setTab('safe')} className={`px-4 py-1.5 rounded-md text-[13px] font-medium press-soft touch-target flex items-center gap-1.5 ${tab === 'safe' ? 'bg-brass text-void' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}>
          <ShieldCheck size={14} /> Safe
        </button>
      </div>
      {tab === 'standard' ? <StandardWallet /> : <SafeWallet />}
    </div>
  );
}
