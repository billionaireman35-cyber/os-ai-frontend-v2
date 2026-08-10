import { useState, useEffect } from 'react';
import { ShieldCheck, Send, ArrowUpDown, Lock, X, CreditCard, DollarSign, BarChart, Wallet, RefreshCw, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { SwapModal } from '../components/SwapModal';
import { BuyModal } from '../components/BuyModal';
import { SellModal } from '../components/SellModal';
import { Modal } from '../components/ui/Modal';
import { WalletAnalytics } from '../components/wallet/WalletAnalytics';
import { ToastContainer, useToast } from '../components/ui/Toast';

const chains = ['all', 'polygon', 'ethereum', 'bsc', 'arbitrum', 'base'];

const chainLogos = {
  polygon: '🟣',
  ethereum: '💎',
  bsc: '🟡',
  arbitrum: '🔵',
  base: '🔷',
};

function SendModal({ isOpen, onClose, asset, onSent }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!isOpen || !asset) return null;

  const handleSend = async (password) => {
    if (!password) { setError('Password required'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/wallet/send', {
        chain: asset.chain,
        to_address: to,
        amount_wei: (parseFloat(amount) * 1e18).toString(),
        password,
        token_address: asset.address || null,
      });
      onSent?.(res.data.tx_hash);
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Transaction failed');
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
            <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Send {asset.symbol}</h3>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={24} /></button>
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Recipient</label>
            <input type="text" value={to} onChange={(e) => setTo(e.target.value)} className="input-base" placeholder="0x..." />
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount ({asset.symbol})</label>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base" placeholder="0.0" />
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>Chain: <span className="text-[var(--text-primary)] font-medium">{asset.chain}</span></span>
          </div>
          {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowPasswordModal(true)} disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Send'}
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Confirm Send"
        message={`Enter your wallet password to send ${amount} ${asset.symbol}.`}
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={handleSend}
        confirmText="Send"
        cancelText="Cancel"
      />
    </>
  );
}

function StandardWallet() {
  const { assets, totalUsd, loading, error, fetchBalances } = useWallet();
  const { user, setUser } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [chain, setChain] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAsset, setSendAsset] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const filtered = Array.isArray(assets) ? (chain === 'all' ? assets : assets.filter((a) => a.chain === chain)) : [];

  const createWallet = async (password) => {
    if (!password || creating) return;
    setCreating(true);
    try {
      const res = await api.post('/wallet/create', { password });
      if (res.data?.wallet) {
        const { address } = res.data.wallet;
        addToast(`Wallet created! Address: ${address.slice(0, 10)}... Private key encrypted.`, 'success', 6000);
        // Refresh user profile to get the new wallet_address
        const userRes = await api.get('/auth/me');
        if (setUser && userRes.data) {
          setUser(userRes.data);
        }
        fetchBalances();
        setShowPasswordModal(false);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (e) {
      addToast(e.response?.data?.detail || e.message || 'Wallet creation failed.', 'error');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (user) fetchBalances();
  }, [user]);

  const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || 'Unknown error');

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex flex-col tablet:flex-row justify-between items-start tablet:items-end gap-4">
        <div>
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Total balance</p>
          <p className="text-4xl font-mono font-bold text-[#d4af37] mt-1">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {chains.map((c) => (
            <button
              key={c}
              onClick={() => setChain(c)}
              className={`px-4 py-2 rounded-full text-sm font-mono touch transition-all ${
                chain === c ? 'bg-[#d4af37] text-black font-bold' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowPasswordModal(true)}
          disabled={creating}
          className="bg-[#d4af37] hover:bg-[#c4a030] text-black font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition disabled:opacity-50"
        >
          <Lock size={18} /> {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Wallet'}
        </button>
        <button
          onClick={() => { if (filtered.length === 0) { addToast('No assets. Create a wallet and add funds first.', 'warning'); return; } setSendAsset(filtered[0]); setShowSendModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Send size={18} /> Send
        </button>
        <button onClick={() => setShowSwapModal(true)} className="btn-secondary flex items-center gap-2">
          <ArrowUpDown size={18} /> Swap
        </button>
        <button onClick={() => setShowBuyModal(true)} className="btn-primary flex items-center gap-2" style={{ background: 'var(--success)', color: 'white' }}>
          <CreditCard size={18} /> Buy
        </button>
        <button onClick={() => setShowSellModal(true)} className="btn-secondary flex items-center gap-2" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <DollarSign size={18} /> Sell
        </button>
        <button onClick={() => fetchBalances()} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 tablet:grid-cols-2 landscape:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card px-5 py-4 animate-pulse h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="glass-card p-4 text-sm text-yellow-400 border border-yellow-500/30 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={fetchBalances} className="underline text-white/70 hover:text-white">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 tablet:grid-cols-2 landscape:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm col-span-full">No assets on this chain yet. Create a wallet and add funds.</p>
          ) : (
            filtered.map((a, i) => (
              <div key={i} className="glass-card px-5 py-4 flex items-center justify-between border border-white/5 hover:border-[#d4af37]/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{chainLogos[a.chain] || '🪙'}</span>
                  <div>
                    <p className="text-lg text-[var(--text-primary)] font-bold">{a.symbol}</p>
                    <p className="text-sm text-[var(--text-muted)] font-mono">{a.balance.toFixed(4)} · {a.chain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-[#d4af37] text-lg">${a.usdValue.toFixed(2)}</p>
                  <button onClick={() => { setSendAsset(a); setShowSendModal(true); }} className="text-[var(--text-muted)] hover:text-[#d4af37] transition"><Send size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} asset={sendAsset} onSent={(txHash) => { addToast(`Transaction sent: ${txHash.slice(0, 12)}...`, 'success'); fetchBalances(); }} />
      <SwapModal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} onSwap={(txHash) => { addToast(`Swap executed: ${txHash.slice(0, 12)}...`, 'success'); fetchBalances(); }} />
      <BuyModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} onBuy={() => { addToast('Buy initiated. Check your wallet.', 'info'); fetchBalances(); }} />
      <SellModal isOpen={showSellModal} onClose={() => setShowSellModal(false)} onSell={() => { addToast('Sell initiated. Check your email for confirmation.', 'info'); fetchBalances(); }} />

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Create Wallet"
        message="Enter a password to encrypt your wallet. This password will be used to sign all transactions. Keep it safe — it cannot be recovered!"
        inputType="password"
        inputPlaceholder="Enter a strong password"
        onConfirm={createWallet}
        confirmText={creating ? 'Creating...' : 'Create'}
        cancelText="Cancel"
        confirmDisabled={creating}
      />
    </div>
  );
}

function SafeWallet() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-5 flex items-start gap-3 border border-[#d4af37]/20">
        <ShieldCheck size={24} className="text-[#d4af37] shrink-0 mt-0.5" />
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

export default function Vault() {
  const [tab, setTab] = useState('standard');

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
        <Wallet size={28} className="text-[#d4af37]" /> OS Vault
      </h1>
      <p className="text-sm text-[var(--text-muted)]">Multi-chain non-custodial asset hub</p>
      <div className="flex gap-2 glass-card p-1 w-fit border border-white/5">
        <button onClick={() => setTab('standard')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all ${tab === 'standard' ? 'bg-[#d4af37] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
          Portfolio
        </button>
        <button onClick={() => setTab('analytics')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all flex items-center gap-2 ${tab === 'analytics' ? 'bg-[#d4af37] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
          <BarChart size={16} /> Analytics
        </button>
        <button onClick={() => setTab('safe')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all flex items-center gap-2 ${tab === 'safe' ? 'bg-[#d4af37] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
          <ShieldCheck size={16} /> Safe
        </button>
      </div>
      {tab === 'standard' && <StandardWallet />}
      {tab === 'analytics' && <WalletAnalytics />}
      {tab === 'safe' && <SafeWallet />}
    </div>
  );
}
