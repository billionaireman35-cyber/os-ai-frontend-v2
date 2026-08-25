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
  // _prefillTo/_prefillAmount are optional extra fields a caller can set
  // on the asset object to pre-populate the form (e.g. Staking's "Send
  // from OS Vaults" shortcut, which pre-fills the treasury address and
  // stake amount). Absent for every existing caller, so this is a no-op
  // unless a caller explicitly opts in.
  const [to, setTo] = useState(asset?._prefillTo || '');
  const [amount, setAmount] = useState(asset?._prefillAmount || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Re-sync if the modal is reopened with a different prefilled asset
  // while already mounted (useState's initial value only applies once).
  useEffect(() => {
    if (isOpen && asset?._prefillTo) setTo(asset._prefillTo);
    if (isOpen && asset?._prefillAmount) setAmount(asset._prefillAmount);
  }, [isOpen, asset?._prefillTo, asset?._prefillAmount]);

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
  const [showOverflow, setShowOverflow] = useState(false);

  // CLOSE is pinned separately (hero strip + pinned row), so it's excluded
  // from the plain chain-filtered ledger list below to avoid showing twice.
  const nonCloseAssets = Array.isArray(assets) ? assets.filter((a) => a.symbol !== 'CLOSE') : [];
  const filtered = chain === 'all' ? nonCloseAssets : nonCloseAssets.filter((a) => a.chain === chain);
  const closeAsset = assets.find(a => a.symbol === 'CLOSE');

  // Which chains actually hold a balance (for the live/dim dot on chain pills).
  // Checked against the full asset list (including CLOSE) so CLOSE's chain
  // still lights up even though CLOSE itself is filtered out of the ledger rows.
  const chainsWithBalance = new Set((Array.isArray(assets) ? assets : []).map((a) => a.chain));

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

  // Tiny inline sparkline, mirrors Pulse's visual language. No new deps -
  // just an SVG polyline built from the 7d price array WalletContext
  // already provides on each asset (a.sparkline).
  const Sparkline = ({ points, up }) => {
    const w = 48, h = 20;
    if (!points || points.length < 2) {
      return (
        <svg width={w} height={h}>
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2,3" />
        </svg>
      );
    }
    const min = Math.min(...points), max = Math.max(...points);
    const range = (max - min) || 1;
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const color = up ? 'var(--success)' : 'var(--danger)';
    return (
      <svg width={w} height={h}>
        <polyline points={coords} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Hero Card */}
      {user?.wallet_address ? (
        <div className="glass-panel relative overflow-hidden rounded-2xl p-6">
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{ background: 'radial-gradient(circle at 25% 0%, rgba(201,169,97,0.16), transparent 65%)' }}
          />
          <p className="relative text-xs uppercase tracking-widest mb-2 text-[var(--text-muted)]" style={{ letterSpacing: '2px' }}>Total Balance</p>
          <div className="relative flex items-baseline gap-2 font-display mb-4">
            <span className="text-xl text-[var(--accent-brass)]">◈</span>
            <span className="text-4xl font-bold text-[var(--text-primary)]">${totalUsd.toFixed(2)}</span>
          </div>

          {/* CLOSE strip - elevated, distinct from the total above it */}
          {closeAsset && (
            <div
              className="relative flex items-center justify-between rounded-2xl px-3.5 py-3 mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(201,169,97,0.14), rgba(201,169,97,0.04))',
                border: '1px solid rgba(201,169,97,0.32)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-[13px]"
                  style={{ background: 'linear-gradient(135deg, var(--accent-brass-bright), var(--accent-brass-dim))', color: '#14120C' }}
                >
                  C
                </div>
                <div>
                  <p className="font-display font-semibold text-sm leading-tight text-[var(--text-primary)]">CLOSE</p>
                  <p className="text-[9px] font-mono uppercase tracking-wide text-[var(--accent-brass-bright)]">Native token</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-[var(--accent-brass-bright)]">{closeAsset.balance.toFixed(0)}</p>
                <p className="font-mono text-[10px] text-[var(--text-muted)]">${(closeAsset.usdValue || 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-between pt-4 border-t border-dashed border-[var(--glass-border)]">
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

      {/* Primary Actions */}
      {!user?.wallet_address ? (
        <button
          onClick={() => setShowCreatePasswordModal(true)}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition disabled:opacity-50 bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)] text-black"
        >
          <Lock size={18} /> {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Wallet'}
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => { if (filtered.length === 0 && !closeAsset) { addToast('No assets to send.', 'warning'); return; } if (filtered.length + (closeAsset ? 1 : 0) === 1) { setSendAsset(closeAsset || filtered[0]); setShowSendModal(true); } else { setShowAssetPicker(true); } }}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)]"
            >
              <Send size={17} color="#20190B" /> <span className="text-xs font-medium text-[#20190B]">Send</span>
            </button>
            <button
              onClick={() => setShowSwapModal(true)}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors"
            >
              <ArrowUpDown size={17} className="text-[var(--accent-brass)]" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Swap</span>
            </button>
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-colors"
            >
              <CreditCard size={17} className="text-[var(--accent-brass)]" /> <span className="text-xs font-medium text-[var(--text-secondary)]">Deposit</span>
            </button>
          </div>

          {/* Overflow row - Sell, Refresh, History, Top Up Chat: same handlers, quieter treatment */}
          <div className="flex items-center justify-around rounded-2xl px-2 py-2.5 bg-white/[0.02] border border-[var(--glass-border)]">
            <button onClick={() => setShowSellModal(true)} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <DollarSign size={14} className="text-[var(--accent-brass-dim)]" /> Sell
            </button>
            <button onClick={fetchBalances} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <RefreshCw size={14} className={`text-[var(--accent-brass-dim)] ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <History size={14} className="text-[var(--accent-brass-dim)]" /> History
            </button>
            <button onClick={() => setShowChatTopupModal(true)} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <MessageSquare size={14} className="text-[var(--accent-brass-dim)]" /> Top Up Chat
            </button>
          </div>
        </>
      )}

      {/* Chain Selector - dot shows whether the chain actually holds a balance */}
      <div className="flex gap-2 flex-wrap">
        {chains.map((c) => {
          const has = c === 'all' || chainsWithBalance.has(c);
          return (
            <button
              key={c}
              onClick={() => setChain(c)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-mono font-bold touch transition-all ${
                chain === c
                  ? 'bg-[var(--accent-brass)] text-black'
                  : `bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)] ${has ? '' : 'opacity-45'}`
              }`}
            >
              {c !== 'all' && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: has ? 'var(--success)' : 'var(--text-muted)' }}
                />
              )}
              {c.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Asset List */}
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
        <div className="space-y-2">
          {/* CLOSE pinned row */}
          {closeAsset && (chain === 'all' || closeAsset.chain === chain) && (
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(201,169,97,0.09), var(--glass-bg, rgba(21,19,14,0.55)))',
                border: '1px solid rgba(201,169,97,0.32)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-[13px]"
                  style={{ background: 'linear-gradient(135deg, var(--accent-brass-bright), var(--accent-brass-dim))', color: '#14120C' }}
                >
                  C
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">CLOSE</p>
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--accent-brass-bright)]">Native · Pinned</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <p className="text-sm text-[var(--text-primary)]">{closeAsset.balance.toFixed(4)}</p>
                  <p className="text-xs text-[var(--text-muted)]">${(closeAsset.usdValue || 0).toFixed(2)}</p>
                </div>
                <button onClick={() => { setSendAsset(closeAsset); setShowSendModal(true); }} className="text-[var(--text-muted)] hover:text-[var(--accent-brass)] transition-colors"><Send size={15} /></button>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-xl px-1">
            {filtered.length === 0 ? (
              !closeAsset && <p className="text-sm py-6 text-center text-[var(--text-muted)]">No assets on this chain yet.</p>
            ) : (
              filtered.map((a, i) => {
                const up = (a.change24h ?? 0) >= 0;
                return (
                  <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b border-[var(--glass-border)]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-9 h-9 rounded-full flex items-center justify-center bg-[var(--accent-brass)]/10">{chainLogos[a.chain] || '🪙'}</span>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{a.symbol}</p>
                        <p className="text-xs text-[var(--text-muted)]">{a.chain}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sparkline points={a.sparkline} up={up} />
                      <div className="text-right font-mono">
                        <p className="text-sm text-[var(--text-primary)]">{a.balance.toFixed(4)}</p>
                        <p className="text-xs text-[var(--text-muted)]">${(a.usdValue || 0).toFixed(2)}</p>
                      </div>
                      <button onClick={() => { setSendAsset(a); setShowSendModal(true); }} className="text-[var(--text-muted)] hover:text-[var(--accent-brass)] transition-colors"><Send size={15} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
            {(closeAsset ? [closeAsset, ...filtered] : filtered).map((a, i) => (
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

function Staking() {
  const { assets, fetchBalances } = useWallet();
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [terms, setTerms] = useState(null);
  const [treasuryAddress, setTreasuryAddress] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showNewStake, setShowNewStake] = useState(false);
  const [stakeStep, setStakeStep] = useState(1);
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [stakeTxHash, setStakeTxHash] = useState('');
  const [submittingStake, setSubmittingStake] = useState(false);

  const [showSendFromVault, setShowSendFromVault] = useState(false);

  const [actionLoading, setActionLoading] = useState({});
  const [showUnstakeConfirm, setShowUnstakeConfirm] = useState(null);

  const closeAsset = assets.find(a => a.symbol === 'CLOSE');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/staking/terms'),
      api.get('/staking/positions'),
    ])
      .then(([termsRes, positionsRes]) => {
        setTerms(termsRes.data.terms);
        setTreasuryAddress(termsRes.data.treasury_address);
        setPositions(positionsRes.data.positions || []);
      })
      .catch((e) => addToast(extractErrorMessage(e, 'Failed to load staking data'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const totalStaked = positions
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPendingYield = positions
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + p.pending_yield, 0);

  const copyTreasury = () => {
    if (!treasuryAddress) return;
    navigator.clipboard.writeText(treasuryAddress);
    setCopied(true);
    addToast('Address copied!', 'info', 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetNewStake = () => {
    setShowNewStake(false);
    setStakeStep(1);
    setStakeAmount('');
    setSelectedTerm(null);
    setStakeTxHash('');
  };

  const submitStake = async () => {
    if (!stakeTxHash.trim()) { addToast('Enter the transaction hash', 'error'); return; }
    setSubmittingStake(true);
    try {
      await api.post('/staking/stake', {
        amount: Math.floor(parseFloat(stakeAmount)),
        term: selectedTerm,
        tx_hash: stakeTxHash.trim(),
      });
      addToast('Stake opened!', 'success');
      resetNewStake();
      loadData();
      fetchBalances();
    } catch (e) {
      addToast(extractErrorMessage(e, 'Failed to verify stake'), 'error');
    } finally {
      setSubmittingStake(false);
    }
  };

  const claimYield = async (stakeId) => {
    setActionLoading(prev => ({ ...prev, [stakeId]: 'claim' }));
    try {
      const res = await api.post('/staking/claim', { stake_id: stakeId });
      addToast(`Claimed ${res.data.claimed} CLOSE! Tx: ${res.data.tx_hash?.slice(0, 12)}...`, 'success');
      loadData();
      fetchBalances();
    } catch (e) {
      addToast(extractErrorMessage(e, 'Claim failed'), 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [stakeId]: null }));
    }
  };

  const doUnstake = async (stakeId) => {
    setActionLoading(prev => ({ ...prev, [stakeId]: 'unstake' }));
    try {
      const res = await api.post('/staking/unstake', { stake_id: stakeId });
      const forfeitMsg = res.data.forfeited_yield > 0 ? ` (forfeited ${res.data.forfeited_yield} CLOSE yield)` : '';
      addToast(`Unstaked ${res.data.returned} CLOSE${forfeitMsg}. Tx: ${res.data.tx_hash?.slice(0, 12)}...`, 'success');
      setShowUnstakeConfirm(null);
      loadData();
      fetchBalances();
    } catch (e) {
      addToast(extractErrorMessage(e, 'Unstake failed'), 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [stakeId]: null }));
    }
  };

  const isEarly = (position) => {
    if (!position.unlock_at || position.status !== 'active') return false;
    return new Date(position.unlock_at) > new Date();
  };

  const termLabel = (term) => term === 'flexible' ? 'Flexible' : term === '30d' ? '30 day lock' : term === '90d' ? '90 day lock' : term === '180d' ? '180 day lock' : term;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Total Staked</p>
          <p className="text-xl font-display font-bold text-[var(--text-primary)]">{totalStaked.toLocaleString()}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[9.5px] font-mono uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Pending Yield</p>
          <p className="text-xl font-display font-bold text-[var(--accent-brass-bright)]">{totalPendingYield.toFixed(2)}</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />)}
        </div>
      )}

      {!loading && (
        <>
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">Your Positions</p>

          {positions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">No stakes yet. Open one to start earning yield.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {positions.map((p) => {
                const early = isEarly(p);
                const canClaim = p.status === 'active' && p.pending_yield > 0;
                const isLoadingClaim = actionLoading[p.id] === 'claim';
                const isLoadingUnstake = actionLoading[p.id] === 'unstake';
                return (
                  <div
                    key={p.id}
                    className="glass-panel rounded-2xl p-4"
                    style={early ? { borderColor: 'rgba(216,154,58,0.35)' } : undefined}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-display font-bold text-lg text-[var(--text-primary)]">{p.amount.toLocaleString()} CLOSE</p>
                        <p className="text-[10px] font-mono uppercase text-[var(--accent-brass-bright)] mt-0.5">{termLabel(p.term)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-[var(--success)]">{p.apy}% APY</p>
                        <p className="text-[9px] font-mono text-[var(--text-muted)]">
                          {p.status !== 'active' ? p.status : p.unlock_at ? `unlocks ${new Date(p.unlock_at).toLocaleDateString()}` : 'no lock'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11.5px] text-[var(--text-secondary)] py-2.5 border-t border-b border-dashed border-[var(--glass-border)] mb-3">
                      <span>Pending yield</span>
                      <span className="font-mono font-semibold text-[var(--accent-brass-bright)]">{p.pending_yield.toFixed(2)} CLOSE</span>
                    </div>

                    {p.status === 'active' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => claimYield(p.id)}
                          disabled={!canClaim || isLoadingClaim}
                          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-semibold transition ${
                            canClaim
                              ? 'bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)] text-[#20190B]'
                              : 'bg-white/[0.03] text-[var(--text-muted)]'
                          }`}
                        >
                          {isLoadingClaim ? <Loader2 size={14} className="animate-spin mx-auto" /> : canClaim ? 'Claim Yield' : 'Nothing to claim'}
                        </button>
                        <button
                          onClick={() => setShowUnstakeConfirm(p)}
                          disabled={isLoadingUnstake}
                          className="flex-1 text-center py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)]"
                        >
                          {isLoadingUnstake ? <Loader2 size={14} className="animate-spin mx-auto" /> : early ? 'Unstake early' : 'Unstake'}
                        </button>
                      </div>
                    )}

                    {early && p.status === 'active' && (
                      <div className="flex items-center gap-1.5 mt-2 text-[9.5px] font-mono" style={{ color: '#d89a3a' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d89a3a' }} />
                        Unstaking now forfeits your pending yield
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => { if (!user?.wallet_address) { addToast('Create a wallet first.', 'warning'); return; } setShowNewStake(true); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)] text-[#20190B]"
          >
            + New Stake
          </button>
        </>
      )}

      {showNewStake && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={resetNewStake}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">New Stake</h3>
              <button onClick={resetNewStake} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>

            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex-1 h-1 rounded-full" style={{ background: s <= stakeStep ? 'var(--accent-brass)' : 'var(--glass-border)' }} />
              ))}
            </div>

            {stakeStep === 1 && (
              <>
                <p className="text-sm text-[var(--text-secondary)]">Choose how much to stake and for how long.</p>
                <div>
                  <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount (CLOSE)</label>
                  <input type="text" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="input-glass w-full mt-1" placeholder="0" />
                  {closeAsset && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">Available: {closeAsset.balance.toFixed(0)} CLOSE</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide mb-2 block">Lock Term</label>
                  <div className="grid grid-cols-2 gap-2">
                    {terms && Object.entries(terms).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTerm(key)}
                        className="rounded-xl p-3 text-center border transition"
                        style={selectedTerm === key
                          ? { borderColor: 'var(--accent-brass)', background: 'rgba(201,169,97,0.08)' }
                          : { borderColor: 'var(--glass-border)' }}
                      >
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{termLabel(key)}</p>
                        <p className="font-mono text-base font-bold text-[var(--accent-brass-bright)] mt-0.5">{info.apy}%</p>
                        <p className="text-[8.5px] font-mono text-[var(--text-muted)]">APY</p>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!stakeAmount || parseFloat(stakeAmount) <= 0) { addToast('Enter a valid amount', 'error'); return; }
                    if (!selectedTerm) { addToast('Choose a lock term', 'error'); return; }
                    setStakeStep(2);
                  }}
                  className="btn-primary w-full justify-center"
                >
                  Continue →
                </button>
              </>
            )}

            {stakeStep === 2 && (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  Send exactly {stakeAmount} CLOSE from your own wallet to the address below.
                </p>
                <div className="rounded-xl p-3 bg-white/5 border border-[var(--glass-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono break-all pr-2 text-[var(--text-primary)]">{treasuryAddress}</span>
                    <button onClick={copyTreasury} className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                      {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
                    This is the CLOSE staking treasury. Only send from a wallet you control — staking credits the account whose wallet sent the transaction.
                  </p>
                </div>
                <button
                  onClick={() => setShowSendFromVault(true)}
                  className="btn-primary w-full justify-center"
                >
                  Send {stakeAmount} CLOSE from OS Vaults →
                </button>
                <button onClick={() => setStakeStep(3)} className="w-full text-center text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  or send manually, then continue
                </button>
              </>
            )}

            {stakeStep === 3 && (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  Paste the transaction hash from your send — we'll verify it on-chain and open your position.
                </p>
                <div>
                  <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Transaction Hash</label>
                  <input type="text" value={stakeTxHash} onChange={(e) => setStakeTxHash(e.target.value)} className="input-glass w-full mt-1" placeholder="0x..." />
                </div>
                <button onClick={submitStake} disabled={submittingStake} className="btn-primary w-full justify-center">
                  {submittingStake ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Verify and Open Stake'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showSendFromVault && closeAsset && (
        <SendModal
          isOpen={showSendFromVault}
          onClose={() => setShowSendFromVault(false)}
          asset={{ ...closeAsset, _prefillTo: treasuryAddress, _prefillAmount: stakeAmount }}
          assets={assets}
          onSent={(txHash) => {
            setShowSendFromVault(false);
            setStakeTxHash(txHash);
            setStakeStep(3);
            addToast('Sent! Paste the tx hash to confirm your stake.', 'success');
          }}
        />
      )}

      {showUnstakeConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowUnstakeConfirm(null)}>
          <div className="glass-panel rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Confirm Unstake</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Return {showUnstakeConfirm.amount.toLocaleString()} CLOSE principal to your wallet.
            </p>
            {isEarly(showUnstakeConfirm) && (
              <p className="text-sm font-mono p-3 rounded-xl" style={{ color: '#d89a3a', background: 'rgba(216,154,58,0.08)', border: '1px solid rgba(216,154,58,0.25)' }}>
                ⚠️ This stake hasn't unlocked yet. Unstaking now forfeits your {showUnstakeConfirm.pending_yield.toFixed(2)} CLOSE pending yield.
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => doUnstake(showUnstakeConfirm.id)} className="btn-primary flex-1 justify-center">Confirm Unstake</button>
              <button onClick={() => setShowUnstakeConfirm(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
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
        <button onClick={() => setTab('staking')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all flex items-center gap-2 ${tab === 'staking' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Coins size={16} /> Staking</button>
      </div>
      {tab === 'standard' && <StandardWallet />}
      {tab === 'analytics' && <WalletAnalytics />}
      {tab === 'safe' && <SafeWallet />}
      {tab === 'staking' && <Staking />}
    </div>
  );
}
