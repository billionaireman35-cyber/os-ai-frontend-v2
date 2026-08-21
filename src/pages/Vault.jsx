import toast from "react-hot-toast";
import { useState, useEffect } from 'react';
import {
  ShieldCheck, Send, ArrowUpDown, Lock, X, CreditCard, DollarSign,
  BarChart, Wallet, RefreshCw, Loader2, Copy, CheckCircle,
  ArrowUpRight, ArrowDownRight, Flame, Coins, History, ExternalLink, MessageSquare
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { SwapModal } from '../components/SwapModal';
import { Modal } from '../components/ui/Modal';
import { WalletAnalytics } from '../components/wallet/WalletAnalytics';
import { ToastContainer, useToast } from '../components/ui/Toast';

const chains = ['all', 'polygon', 'ethereum', 'bsc', 'arbitrum', 'base'];
const chainLogos = { polygon: '🟣', ethereum: '💎', bsc: '🟡', arbitrum: '🔵', base: '🔷' };


function extractErrorMessage(e, fallback) {
  const detail = e.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return e.message || fallback;
}

function SendModal({ isOpen, onClose, asset, assets, onSent }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!isOpen || !asset) return null;

  const MIN_GAS_POL = 0.01;
  const polAsset = (assets || []).find((a) => a.chain === 'polygon' && a.symbol === 'POL');
  const polBalance = polAsset ? polAsset.balance : 0;
  const insufficientGas = asset.chain === 'polygon' && polBalance < MIN_GAS_POL;

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
      setError(extractErrorMessage(e, 'Transaction failed'));
    } finally {
      setLoading(false);
      setShowPasswordModal(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Send {asset.symbol}</h3>
            <button onClick={onClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Recipient</label>
            <input type="text" value={to} onChange={(e) => setTo(e.target.value)} className="input-glass w-full mt-1" placeholder="0x..." />
          </div>
          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount ({asset.symbol})</label>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-glass w-full mt-1" placeholder="0.0" />
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>Chain: <span className="text-[var(--text-primary)] font-medium">{asset.chain}</span></span>
          </div>
          {insufficientGas && (
            <p className="text-sm font-mono" style={{ color: 'var(--accent-brass)' }}>
              ⚠️ Low POL balance ({polBalance.toFixed(4)} POL) - you need at least {MIN_GAS_POL} POL to cover gas for this transaction.
            </p>
          )}
          {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowPasswordModal(true)} disabled={loading || insufficientGas} className="btn-primary flex-1 justify-center">
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

function DepositModal({ isOpen, onClose, onDeposited }) {
  const [chain, setChain] = useState('polygon');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const DEPOSIT_ADDRESS = '0x52b6e0aeD9511A4bCD0c5D454ccBe0EcF4308B7F';
  const MINIMUMS = { polygon: 4, bsc: 4, ethereum: 15 };

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!txHash.trim()) { setError('Enter your transaction hash'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/wallet/deposit/verify', { chain, tx_hash: txHash.trim() });
      onDeposited?.(res.data);
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Deposit Crypto</h3>
          <button onClick={onClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          Send crypto to the address below, then paste your transaction hash to receive CLOSE.
        </p>

        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Chain</label>
          <div className="flex gap-2 mt-1">
            {Object.keys(MINIMUMS).map((c) => (
              <button
                key={c}
                onClick={() => setChain(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  chain === c
                    ? 'bg-[var(--accent-brass)] text-black'
                    : 'bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)]'
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-3 bg-white/5 border border-[var(--glass-border)]">
          <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Deposit Address</label>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-mono break-all pr-2 text-[var(--text-primary)]">{DEPOSIT_ADDRESS}</span>
            <button onClick={copyAddress} className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs mt-2 text-[var(--accent-brass)]">
            Minimum: ${MINIMUMS[chain]} on {chain}
          </p>
        </div>

        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Transaction Hash</label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="input-glass w-full mt-1"
            placeholder="0x..."
          />
        </div>

        {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}

        <div className="flex gap-2">
          <button onClick={handleVerify} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Credit'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ChatTopupModal({ isOpen, onClose, onToppedUp }) {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const CHAT_TREASURY_ADDRESS = '0x109464E84bDD6552d76bcBbaEf03bDe8069C0698';
  const CLOSE_TOKEN_ADDRESS = '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8';

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(CHAT_TREASURY_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!txHash.trim()) { setError('Enter your transaction hash'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/chat/topup', { tx_hash: txHash.trim() });
      onToppedUp?.(res.data);
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Top Up Chat Balance</h3>
          <button onClick={onClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          Send CLOSE (Polygon) to the address below from your own wallet, then paste the transaction hash to credit your chat balance 1:1.
        </p>

        <div className="rounded-xl p-3 bg-white/5 border border-[var(--glass-border)]">
          <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Chat Treasury Address (Polygon)</label>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-mono break-all pr-2 text-[var(--text-primary)]">{CHAT_TREASURY_ADDRESS}</span>
            <button onClick={copyAddress} className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-xs mt-2 text-[var(--accent-brass)]">
            CLOSE token: {CLOSE_TOKEN_ADDRESS.slice(0, 10)}...{CLOSE_TOKEN_ADDRESS.slice(-6)}
          </p>
        </div>

        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Transaction Hash</label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="input-glass w-full mt-1"
            placeholder="0x..."
          />
        </div>

        {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}

        <div className="flex gap-2">
          <button onClick={handleVerify} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Credit'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({ isOpen, onClose, assets, onRequested }) {
  const [chain, setChain] = useState('polygon');
  const [tokenSymbol, setTokenSymbol] = useState('CLOSE');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!destination.trim()) { setError('Enter a destination address'); return; }
    if (!password) { setError('Password required'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/wallet/withdraw/request', {
        chain, token_symbol: tokenSymbol, amount: parseFloat(amount),
        destination_address: destination.trim(), password
      });
      onRequested?.(res.data);
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e, 'Withdrawal request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Withdraw</h3>
          <button onClick={onClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Withdrawals are reviewed before funds are sent - this may take some time.
        </p>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Chain</label>
          <div className="flex gap-2 mt-1">
            {['polygon', 'bsc', 'ethereum'].map((c) => (
              <button
                key={c}
                onClick={() => setChain(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  chain === c
                    ? 'bg-[var(--accent-brass)] text-black'
                    : 'bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)]'
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Token</label>
          <select value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} className="input-glass w-full mt-1">
            <option value="CLOSE">CLOSE</option>
            {assets && assets.filter(a => a.symbol !== 'CLOSE').map(a => (
              <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount</label>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-glass w-full mt-1" placeholder="0.0" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Destination Address</label>
          <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="input-glass w-full mt-1" placeholder="0x..." />
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Wallet Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass w-full mt-1" placeholder="••••••••" />
        </div>
        {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}
        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Request Withdrawal'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function TransactionHistory({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const EXPLORERS = {
    polygon: 'https://polygonscan.com/tx/',
    ethereum: 'https://etherscan.io/tx/',
    bsc: 'https://bscscan.com/tx/'
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/wallet/transactions/history')
      .then(res => setItems(res.data.history || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Transaction History</h3>
          <button onClick={onClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {loading ? (
            <p className="text-sm text-center py-8 text-[var(--text-muted)]">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-center py-8 text-[var(--text-muted)]">No transactions yet.</p>
          ) : (
            items.map((tx, i) => (
              <div key={i} className={`flex items-center justify-between py-3 ${i < items.length - 1 ? 'border-b border-[var(--glass-border)]' : ''}`}>
                <div>
                  <p className="text-sm font-medium capitalize text-[var(--text-primary)]">{tx.kind}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {tx.amount} {tx.token_symbol || 'CLOSE'} {tx.status ? `· ${tx.status}` : ''}
                  </p>
                </div>
                {tx.tx_hash && tx.chain && EXPLORERS[tx.chain] ? (
                  <a href={`${EXPLORERS[tx.chain]}${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 text-xs text-[var(--accent-brass)]">
                    View <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">{tx.status || 'internal'}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StandardWallet() {
  const { assets, totalUsd, loading, error, fetchBalances } = useWallet();
  const { user, refreshUser } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [chain, setChain] = useState('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAsset, setSendAsset] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChatTopupModal, setShowChatTopupModal] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [burnAmount, setBurnAmount] = useState('');
  const [burning, setBurning] = useState(false);
  const [showBurnPasswordModal, setShowBurnPasswordModal] = useState(false);
  const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const filtered = Array.isArray(assets) ? (chain === 'all' ? assets : assets.filter((a) => a.chain === chain)) : [];
  const closeAsset = assets.find(a => a.symbol === 'CLOSE');

  const createWallet = async (password) => {
    if (!password || creating) return;
    setCreating(true);
    try {
      const res = await api.post('/wallet/create', { password });
      if (res.data?.wallet) {
        const { address } = res.data.wallet;
        addToast(`Wallet created! Address: ${address.slice(0, 10)}...`, 'success', 6000);
        await refreshUser();
        fetchBalances();
        setShowCreatePasswordModal(false);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (e) {
      addToast(e.response?.data?.detail || e.message || 'Wallet creation failed.', 'error');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => { if (user) fetchBalances(); }, [user]);

  const errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || 'Unknown error');
  const copyAddress = () => {
    if (user?.wallet_address) {
      navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      addToast('Address copied!', 'info', 2000);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBurn = async (password) => {
    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      addToast('Enter a valid amount', 'error');
      return;
    }
    if (!password) {
      addToast('Password required', 'error');
      return;
    }
    setBurning(true);
    try {
      const res = await api.post('/wallet/burn', {
        amount: Math.floor(parseFloat(burnAmount)),
        password: password
      });
      addToast(`🔥 Burned ${burnAmount} CLOSE! Tx: ${res.data.tx_hash.slice(0, 12)}...`, 'success');
      fetchBalances();
      setShowBurnModal(false);
      setBurnAmount('');
      setShowBurnPasswordModal(false);
    } catch (e) {
      addToast(e.response?.data?.detail || 'Burn failed', 'error');
      setShowBurnPasswordModal(false);
    } finally {
      setBurning(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Wallet Card */}
      {user?.wallet_address ? (
        <div className="glass-panel relative overflow-hidden rounded-2xl p-6">
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{ background: 'radial-gradient(circle at 25% 0%, rgba(201,169,97,0.16), transparent 65%)' }}
          />
          <p className="relative text-xs uppercase tracking-widest mb-2 text-[var(--text-muted)]" style={{ letterSpacing: '2px' }}>OS Vault</p>
          <div className="relative flex items-baseline gap-2 font-display">
            <span className="text-xl text-[var(--accent-brass)]">◈</span>
            <span className="text-4xl font-bold text-[var(--text-primary)]">${totalUsd.toFixed(2)}</span>
          </div>
          <div className="relative flex items-center gap-2 mt-3 flex-wrap">
            {closeAsset && (
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-[var(--accent-brass)]/10 text-[var(--accent-brass)] border border-[var(--glass-border)]">
                {closeAsset.balance.toFixed(0)} CLOSE
              </span>
            )}
          </div>
          <div className="relative flex items-center justify-between mt-4 pt-4 border-t border-dashed border-[var(--glass-border)]">
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
            </span>
            <button onClick={copyAddress} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              {copied ? <CheckCircle size={15} className="text-green-400" /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 text-center">
          <p className="text-[var(--text-muted)]">No wallet found. Create one to start.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2.5">
        {!user?.wallet_address && (
          <button
            onClick={() => setShowCreatePasswordModal(true)}
            disabled={creating}
            className="col-span-4 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition disabled:opacity-50 bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)] text-black"
          >
            <Lock size={18} /> {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Wallet'}
          </button>
        )}
        <button
          onClick={() => { if (!user?.wallet_address) { addToast('Create a wallet first.', 'warning'); return; } if (filtered.length === 0) { addToast('No assets to send.', 'warning'); return; } if (filtered.length === 1) { setSendAsset(filtered[0]); setShowSendModal(true); } else { setShowAssetPicker(true); } }}
          disabled={!user?.wallet_address}
          className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition disabled:opacity-40 bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)]"
        >
          <Send size={17} color="#20190B" /> <span className="text-xs font-medium text-[#20190B]">Send</span>
        </button>
        <button
          onClick={() => { if (!user?.wallet_address) { addToast('Create a wallet first.', 'warning'); return; } setShowSwapModal(true); }}
          disabled={!user?.wallet_address}
          className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors disabled:opacity-40"
        >
          <ArrowUpDown size={17} className="text-[var(--accent-brass)]" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Swap</span>
        </button>
        <button
          onClick={() => { if (!user?.wallet_address) { addToast('Create a wallet first.', 'warning'); return; } setShowBuyModal(true); }}
          disabled={!user?.wallet_address}
          className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors disabled:opacity-40"
        >
          <CreditCard size={17} className="text-[var(--accent-brass)]" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Deposit</span>
        </button>
        <button
          onClick={() => { if (!user?.wallet_address) { addToast('Create a wallet first.', 'warning'); return; } setShowSellModal(true); }}
          disabled={!user?.wallet_address}
          className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors disabled:opacity-40"
        >
          <DollarSign size={17} className="text-[var(--accent-brass)]" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Sell</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-3 gap-2.5">
        <button onClick={fetchBalances} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors">
          <RefreshCw size={17} className={`text-[var(--accent-brass)] ${loading ? 'animate-spin' : ''}`} /> <span className="text-xs font-medium text-[var(--text-secondary)]">Refresh</span>
        </button>
        <button onClick={() => setShowHistory(true)} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors">
          <History size={17} className="text-[var(--accent-brass)]" /> <span className="text-xs font-medium text-[var(--text-secondary)]">History</span>
        </button>
        <button onClick={() => setShowChatTopupModal(true)} disabled={!user?.wallet_address} className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors disabled:opacity-40">
          <MessageSquare size={17} className="text-[var(--accent-brass)]" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Top Up Chat</span>
        </button>
      </div>

      {/* Chain Selector */}
      <div className="flex gap-2 flex-wrap">
        {chains.map((c) => (
          <button
            key={c}
            onClick={() => setChain(c)}
            className={`px-4 py-2 rounded-full text-sm font-mono font-bold touch transition-all ${
              chain === c
                ? 'bg-[var(--accent-brass)] text-black'
                : 'bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)]'
            }`}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Asset List (ledger style) */}
      {loading && (
        <div className="space-y-0.5">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)}
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 text-sm flex items-center justify-between border border-yellow-500/30 text-yellow-400">
          <span>⚠️ {errorMessage}</span>
          <button onClick={fetchBalances} className="underline">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="glass-panel rounded-xl px-1">
          {filtered.length === 0 ? (
            <p className="text-sm py-6 text-center text-[var(--text-muted)]">No assets on this chain yet.</p>
          ) : (
            filtered.map((a, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b border-[var(--glass-border)]' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-9 h-9 rounded-full flex items-center justify-center bg-[var(--accent-brass)]/10">{chainLogos[a.chain] || '🪙'}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{a.symbol}</p>
                    <p className="text-xs text-[var(--text-muted)]">{a.chain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <p className="text-sm text-[var(--text-primary)]">{a.balance.toFixed(4)}</p>
                    <p className="text-xs text-[var(--text-muted)]">${(a.usdValue || 0).toFixed(2)}</p>
                  </div>
                  <button onClick={() => { setSendAsset(a); setShowSendModal(true); }} className="text-[var(--text-muted)] hover:text-[var(--accent-brass)] transition-colors"><Send size={15} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} asset={sendAsset} assets={assets} onSent={(txHash) => { addToast(`Sent: ${txHash.slice(0, 12)}...`, 'success'); fetchBalances(); }} />
      <SwapModal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} userWalletAddress={user?.wallet_address} assets={assets} onSwap={(txHash) => { addToast(`Swap: ${txHash.slice(0, 12)}...`, 'success'); fetchBalances(); }} />
      <DepositModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} onDeposited={(result) => { addToast(`Credited ${result.close_credited} CLOSE (${result.amount} ${result.token_symbol})`, 'success'); fetchBalances(); }} />
      <WithdrawModal isOpen={showSellModal} onClose={() => setShowSellModal(false)} assets={filtered} onRequested={() => { addToast('Withdrawal requested - pending review.', 'info'); }} />
      <TransactionHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <ChatTopupModal isOpen={showChatTopupModal} onClose={() => setShowChatTopupModal(false)} onToppedUp={(result) => { addToast(`Credited ${result.amount} CLOSE to your chat balance`, 'success'); }} />
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowAssetPicker(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-sm p-5 space-y-2" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold mb-2 text-[var(--text-primary)]">Send which asset?</h3>
            {filtered.map((a, i) => (
              <button key={i} onClick={() => { setSendAsset(a); setShowAssetPicker(false); setShowSendModal(true); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]">
                <span className="text-[var(--text-primary)]">{a.symbol}</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{a.balance.toFixed(4)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={showBurnModal}
        onClose={() => setShowBurnModal(false)}
        title="🔥 Burn CLOSE"
        message="Burn your CLOSE tokens to reduce supply and earn rewards."
        inputType="number"
        inputPlaceholder="Enter amount to burn"
        inputValue={burnAmount}
        onInputChange={setBurnAmount}
        onConfirm={() => {
          console.log('Burn amount:', burnAmount, typeof burnAmount);
          if (!burnAmount || parseFloat(burnAmount) <= 0) {
            addToast('Please enter a valid amount greater than 0', 'error');
            return;
          }
          setShowBurnPasswordModal(true);
        }}
        confirmText="Burn"
        cancelText="Cancel"
      />

      <Modal
        isOpen={showBurnPasswordModal}
        onClose={() => { setShowBurnPasswordModal(false); setBurning(false); }}
        title="Confirm Burn"
        message={`Enter your wallet password to burn ${burnAmount || 0} CLOSE.`}
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={handleBurn}
        confirmText={burning ? 'Burning...' : 'Burn'}
        cancelText="Cancel"
        confirmDisabled={burning}
      />

      <Modal
        isOpen={showCreatePasswordModal}
        onClose={() => setShowCreatePasswordModal(false)}
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
      <div className="glass-card p-5 flex items-start gap-3">
        <ShieldCheck size={24} className="text-[var(--accent-brass)] shrink-0 mt-0.5" />
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
        <Wallet size={28} className="text-[var(--accent-brass)]" /> OS Vaults
      </h1>
      <p className="text-sm text-[var(--text-muted)]">Multi-chain non-custodial asset hub</p>
      <div className="glass-panel flex gap-1 p-1 w-fit rounded-2xl">
        <button onClick={() => setTab('standard')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all ${tab === 'standard' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>Portfolio</button>
        <button onClick={() => setTab('analytics')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all flex items-center gap-2 ${tab === 'analytics' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><BarChart size={16} /> Analytics</button>
        <button onClick={() => setTab('safe')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all flex items-center gap-2 ${tab === 'safe' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><ShieldCheck size={16} /> Safe</button>
      </div>
      {tab === 'standard' && <StandardWallet />}
      {tab === 'analytics' && <WalletAnalytics />}
      {tab === 'safe' && <SafeWallet />}
    </div>
  );
}
