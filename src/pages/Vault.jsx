import { useState } from 'react';
import { ShieldCheck, Send, ArrowUpDown, Lock, X, CreditCard, DollarSign, BarChart } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { signSend, broadcastTx } from '../utils/ethers';
import { ethers } from 'ethers';
import { SwapModal } from '../components/SwapModal';
import { BuyModal } from '../components/BuyModal';
import { Modal } from '../components/ui/Modal';
import { WalletAnalytics } from '../components/wallet/WalletAnalytics';

const chains = ['all', 'polygon', 'ethereum', 'bsc', 'arbitrum', 'base'];

const TOKEN_ADDRESSES = {
  polygon: {
    CLOSE: import.meta.env.VITE_CLOSE_CONTRACT || '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8',
    OSINA: '0xbaf280b74c264a911b41341a26508eac9e74fd4f',
  },
};

// ─── Send Modal ──────────────────────────────────────────────
function SendModal({ isOpen, onClose, asset, onSent }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(asset?.symbol || 'CLOSE');
  const [chain, setChain] = useState(asset?.chain || 'polygon');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!isOpen || !asset) return null;

  const handleSend = async (password) => {
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
      setShowPasswordModal(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Send Tokens</h3>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch"><X size={24} /></button>
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Recipient</label>
            <input type="text" value={to} onChange={(e) => setTo(e.target.value)} className="input-base" placeholder="0x..." />
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount</label>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base" placeholder="0.0" />
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Token</label>
            <select value={token} onChange={(e) => setToken(e.target.value)} className="input-base">
              <option value="native">Native (POL/ETH/BNB)</option>
              <option value="CLOSE">CLOSE</option>
              <option value="OSINA">OSINA</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Chain</label>
            <select value={chain} onChange={(e) => setChain(e.target.value)} className="input-base">
              <option value="polygon">Polygon</option>
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="base">Base</option>
            </select>
          </div>
          {error && <p className="text-sm text-[var(--danger)] font-mono">{error}</p>}
          {success && <p className="text-sm text-[var(--success)] font-mono">{success}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowPasswordModal(true)} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Sending…' : 'Send'}</button>
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Wallet Password"
        message="Enter your wallet password to sign this transaction."
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={handleSend}
        confirmText="Send"
        cancelText="Cancel"
      />
    </>
  );
}

// ─── Standard Wallet ─────────────────────────────────────────
function StandardWallet() {
  const { assets, totalUsd, loading, error, fetchBalances } = useWallet();
  const [chain, setChain] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAsset, setSendAsset] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const filtered = chain === 'all' ? (assets || []) : (assets || []).filter((a) => a.chain === chain);

  const createWallet = async (password) => {
    if (!password) return;
    try {
      const res = await api.post('/wallet/create', { password });
      alert(`Wallet created!\nAddress: ${res.data.address}\nBonus: 500 CLOSE\nSeed phrase: ${res.data.seed_phrase}`);
      fetchBalances();
      setShowPasswordModal(false);
    } catch (e) {
      alert(e.response?.data?.detail || 'Wallet creation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col tablet:flex-row justify-between items-start tablet:items-end gap-4">
        <div>
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Total balance</p>
          <p className="text-4xl font-mono font-bold text-[var(--text-primary)] mt-1">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {chains.map((c) => (
            <button key={c} onClick={() => setChain(c)} className={`px-4 py-2 rounded-full text-sm font-mono touch transition-all ${chain === c ? 'bg-[var(--accent-indigo)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'}`}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setShowPasswordModal(true)} className="btn-brass flex items-center gap-2">
          <Lock size={18} /> Create Wallet
        </button>
        <button onClick={() => { if (assets.length === 0) { alert('No assets to send. Create a wallet and add funds first.'); return; } setSendAsset({ symbol: 'CLOSE', chain: 'polygon' }); setShowSendModal(true); }} className="btn-primary flex items-center gap-2">
          <Send size={18} /> Send
        </button>
        <button onClick={() => setShowSwapModal(true)} className="btn-secondary flex items-center gap-2">
          <ArrowUpDown size={18} /> Swap
        </button>
        <button onClick={() => setShowBuyModal(true)} className="btn-primary flex items-center gap-2" style={{ background: 'var(--success)', color: 'white' }}>
          <CreditCard size={18} /> Buy
        </button>
        <button onClick={() => alert('Sell coming soon')} className="btn-secondary flex items-center gap-2" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <DollarSign size={18} /> Sell
        </button>
        <button onClick={() => fetchBalances()} className="btn-secondary flex items-center gap-2">
          ⟳ Refresh
        </button>
      </div>

      {loading && <p className="text-[var(--text-muted)] text-sm font-mono">Loading balances…</p>}
      {error && (
        <div className="glass-card p-4 text-sm text-[var(--danger)] flex items-center justify-between">
          Couldn't reach your wallet.
          <button onClick={fetchBalances} className="underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 tablet:grid-cols-2 landscape:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm col-span-full">No assets on this chain yet.</p>
          ) : (
            filtered.map((a, i) => (
              <div key={i} className="glass-card px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-lg text-[var(--text-primary)] font-bold">{a.symbol}</p>
                  <p className="text-sm text-[var(--text-muted)] font-mono">{a.balance} · {a.chain}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-[var(--text-primary)] text-lg">${a.usdValue.toFixed(2)}</p>
                  <button onClick={() => { setSendAsset(a); setShowSendModal(true); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Send size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} asset={sendAsset} onSent={(txHash) => { console.log('Transaction sent:', txHash); fetchBalances(); }} />
      <SwapModal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} onSwap={(txHash) => { console.log('Swap tx:', txHash); fetchBalances(); }} />
      <BuyModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} onBuy={() => { fetchBalances(); }} />

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Create Wallet"
        message="Enter a password to encrypt your wallet. This password will be used to sign transactions."
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={createWallet}
        confirmText="Create"
        cancelText="Cancel"
      />
    </div>
  );
}

// ─── Safe Wallet ─────────────────────────────────────────────
function SafeWallet() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-5 flex items-start gap-3">
        <ShieldCheck size={24} className="text-[var(--accent-teal)] shrink-0 mt-0.5" />
        <div>
          <p className="text-lg text-[var(--text-primary)] font-bold">Gnosis Safe Multisig</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Extra security for larger balances — coming soon.</p>
        </div>
      </div>
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Safe integration is being prepared.</p>
      </div>
    </div>
  );
}

// ─── Main Vault ──────────────────────────────────────────────
export default function Vault() {
  const [tab, setTab] = useState('standard');

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">OS Vault</h1>
      <p className="text-sm text-[var(--text-muted)]">Multi-chain non-custodial asset hub</p>
      <div className="flex gap-2 glass-card p-1 w-fit">
        <button onClick={() => setTab('standard')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all ${tab === 'standard' ? 'bg-[var(--accent-indigo)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
          Portfolio
        </button>
        <button onClick={() => setTab('analytics')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all flex items-center gap-2 ${tab === 'analytics' ? 'bg-[var(--accent-indigo)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
          <BarChart size={16} /> Analytics
        </button>
        <button onClick={() => setTab('safe')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all flex items-center gap-2 ${tab === 'safe' ? 'bg-[var(--accent-indigo)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
          <ShieldCheck size={16} /> Safe
        </button>
      </div>
      {tab === 'standard' && <StandardWallet />}
      {tab === 'analytics' && <WalletAnalytics />}
      {tab === 'safe' && <SafeWallet />}
    </div>
  );
}
