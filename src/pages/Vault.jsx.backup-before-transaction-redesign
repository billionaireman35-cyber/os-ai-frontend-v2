import toast from "react-hot-toast";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, Send, ArrowUpDown, Lock, X, CreditCard, DollarSign,
  BarChart, Wallet, RefreshCw, Loader2, Copy, CheckCircle,
  ArrowUpRight, ArrowDownRight, Flame, Coins, History, ExternalLink, MessageSquare, Vote
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { SwapModal } from '../components/SwapModal';
import { Modal } from '../components/ui/Modal';
import { WalletAnalytics } from '../components/wallet/WalletAnalytics';
import { ImportWalletModal } from '../components/wallet/ImportWalletModal';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { ToastContainer, useToast } from '../components/ui/Toast';
import { Dropdown } from '../components/ui/Dropdown';

const chains = ['all', 'polygon', 'ethereum', 'bsc', 'arbitrum', 'base'];
const chainColors = { polygon: '#8247E5', ethereum: '#627EEA', bsc: '#F0B90B', arbitrum: '#28A0F0', base: '#0052FF' };


function extractErrorMessage(e, fallback) {
  const detail = e.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return e.message || fallback;
}

// Converts a decimal amount string (e.g. "500000" or "0.0001") to a wei
// integer string, using string/BigInt math instead of float multiplication
// - `parseFloat(amount) * 1e18` loses precision and can render in
// exponential notation (e.g. "5e+23") for large amounts, which FastAPI's
// `int` body parser rejects outright.
function toWeiString(amountStr, decimals = 18) {
  const s = String(amountStr).trim();
  const [whole, frac = ''] = s.split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const wholeDigits = whole.replace(/[^0-9]/g, '') || '0';
  const combined = (wholeDigits + fracPadded).replace(/^0+(?=\d)/, '');
  return BigInt(combined || '0').toString();
}

function SendModal({ isOpen, onClose, asset, assets, onSent, refreshBalances, wallets = [], defaultWalletAddress = '' }) {
  const [fromWallet, setFromWallet] = useState(defaultWalletAddress);
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
  const [sentResult, setSentResult] = useState(null); // { txHash, feeTxHash? } once a send succeeds
  const [copiedHash, setCopiedHash] = useState(false);

  // Re-sync if the modal is reopened with a different prefilled asset
  // while already mounted (useState's initial value only applies once).
  useEffect(() => {
    if (isOpen && asset?._prefillTo) setTo(asset._prefillTo);
    if (isOpen && asset?._prefillAmount) setAmount(asset._prefillAmount);
  }, [isOpen, asset?._prefillTo, asset?._prefillAmount]);

  // Force a fresh balance fetch every time the modal opens - `assets`
  // (and therefore polBalance/insufficientGas below) can otherwise be
  // stale from whenever the page last loaded or last refreshed, which
  // has caused real failed sends: gas actually available on-chain, but
  // insufficientGas read true/false against outdated cached data (seen
  // 2026-08-28 - a send failed with 0 gas balance shortly after a
  // network outage, while the wallet's real POL balance was nonzero).
  useEffect(() => {
    if (isOpen) refreshBalances?.();
    if (isOpen) setSentResult(null);
  }, [isOpen]);

  if (!isOpen || !asset) return null;

  const handleClose = () => {
    setSentResult(null);
    setTo('');
    setAmount('');
    onClose();
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const MIN_GAS_POL = 0.01;
  const polAsset = (assets || []).find((a) => a.chain === 'polygon' && a.symbol === 'POL');
  const polBalance = polAsset ? polAsset.balance : 0;
  const insufficientGas = asset.chain === 'polygon' && polBalance < MIN_GAS_POL;

  const handleSend = async (password) => {
    if (!password) { setError('Password required'); return; }
    setLoading(true);
    setError(null);
    try {
      // Sponsored path: CLOSE-only, relayer pays gas. Anything else with
      // insufficient POL stays blocked (button is disabled via
      // `insufficientGas` below in that case, so this branch is CLOSE-only
      // by construction).
      if (asset.symbol === 'CLOSE' && insufficientGas) {
        const res = await api.post('/swap/send-sponsored', {
          to_address: to,
          amount: parseFloat(amount),
          password,
          wallet_address: fromWallet || undefined,
        });
        // Backend returns { fee_tx, send_tx } - send_tx is the user-facing
        // transaction, fee_tx is the relayer's internal fee pull. Both are
        // shown in the confirmation view so a user checking Polygonscan
        // can find either one, not just the primary send.
        onSent?.(res.data.send_tx);
        setSentResult({ txHash: res.data.send_tx, feeTxHash: res.data.fee_tx });
        return;
      }

      const res = await api.post('/wallet/send', {
        chain: asset.chain,
        to_address: to,
        amount_wei: toWeiString(amount),
        password,
        token_address: asset.address || null,
        wallet_address: fromWallet || undefined,
      });
      onSent?.(res.data.tx_hash);
      setSentResult({ txHash: res.data.tx_hash });
    } catch (e) {
      setError(extractErrorMessage(e, 'Transaction failed'));
    } finally {
      setLoading(false);
      setShowPasswordModal(false);
    }
  };

  const EXPLORER_BASE = { polygon: 'https://polygonscan.com/tx/', ethereum: 'https://etherscan.io/tx/', bsc: 'https://bscscan.com/tx/' }[asset.chain];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4">
          {sentResult ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <CheckCircle size={22} className="text-green-400" /> Sent
                </h3>
                <button onClick={handleClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {amount} {asset.symbol} is on its way to {to.slice(0, 8)}...{to.slice(-6)}.
              </p>

              <div className="rounded-xl p-3 bg-white/5 border border-[var(--glass-border)]">
                <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Transaction Hash</label>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <span className="text-xs font-mono break-all text-[var(--text-primary)]">{sentResult.txHash}</span>
                  <button onClick={() => copyHash(sentResult.txHash)} className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    {copiedHash ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
                {EXPLORER_BASE && (
                  <a href={`${EXPLORER_BASE}${sentResult.txHash}`} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 text-xs mt-2 text-[var(--accent-brass)]">
                    View on Explorer <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {sentResult.feeTxHash && (
                <div className="rounded-xl p-3 bg-white/5 border border-[var(--glass-border)]">
                  <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Sponsorship Fee Transaction</label>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <span className="text-xs font-mono break-all text-[var(--text-secondary)]">{sentResult.feeTxHash}</span>
                  </div>
                  {EXPLORER_BASE && (
                    <a href={`${EXPLORER_BASE}${sentResult.feeTxHash}`} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-xs mt-2 text-[var(--accent-brass)]">
                      View on Explorer <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              <button onClick={handleClose} className="btn-primary w-full justify-center">Done</button>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Send {asset.symbol}</h3>
                <button onClick={handleClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
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
              {wallets.length > 0 && (
                <div>
                  <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Send From</label>
                  <select
                    value={fromWallet}
                    onChange={(e) => setFromWallet(e.target.value)}
                    className="input-glass w-full mt-1"
                  >
                    <option value="">Primary Wallet</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.address}>
                        {w.label} ({w.address.slice(0, 6)}...{w.address.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {insufficientGas && asset.symbol === 'CLOSE' && (
                <p className="text-sm font-mono" style={{ color: 'var(--accent-brass)' }}>
                  ⚡ Low POL balance - this send will use gasless (sponsored) delivery instead.
                </p>
              )}
              {insufficientGas && asset.symbol !== 'CLOSE' && (
                <p className="text-sm font-mono" style={{ color: 'var(--accent-brass)' }}>
                  ⚠️ Low POL balance ({polBalance.toFixed(4)} POL) - you need at least {MIN_GAS_POL} POL to cover gas for this transaction.
                </p>
              )}
              {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowPasswordModal(true)} disabled={loading || (insufficientGas && asset.symbol !== 'CLOSE')} className="btn-primary flex-1 justify-center">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Send'}
                </button>
                <button onClick={handleClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              </div>
            </>
          )}
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
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Buy CLOSE with Crypto</h3>
          <button onClick={onClose} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          This converts crypto you send into CLOSE at the current rate. It is a purchase, not a deposit into your wallet - your CLOSE balance updates once the payment is verified on-chain.
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
          <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Send Payment To</label>
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
          <Dropdown
            value={tokenSymbol}
            onChange={setTokenSymbol}
            options={['CLOSE', ...((assets || []).filter(a => a.symbol !== 'CLOSE').map(a => a.symbol))]}
          />
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
  const { assets, totalUsd, loading, error, fetchBalances, currency, setCurrency, supportedCurrencies } = useWallet();
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

      {/* OS VAULT — Premium Hero */}
      {user?.wallet_address ? (
        <div
          className="relative overflow-hidden rounded-[32px] min-h-[320px] shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
          style={{
            background:
              'radial-gradient(circle at 78% 18%, rgba(124,58,237,0.20), transparent 34%), linear-gradient(135deg, #050506 0%, #09090d 55%, #050506 100%)',
            border: '1px solid rgba(124,58,237,0.16)',
          }}
        >
          {/* Violet edge accent */}
          <div
            className="absolute left-0 top-7 bottom-7 w-1.5 rounded-r-full"
            style={{
              background: 'linear-gradient(180deg, #8b5cf6, #6d28d9)',
              boxShadow: '0 0 18px rgba(139,92,246,0.85)',
            }}
          />

          {/* Official OS Vault triangle */}
          <div
            className="absolute -right-10 -top-12 w-[270px] h-[270px] pointer-events-none"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.65)) drop-shadow(0 0 55px rgba(109,40,217,0.30))',
            }}
          >
            <svg
              viewBox="0 0 100 100"
              width="100%"
              height="100%"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="OS Vault"
            >
              <path
                d="M50 12 L90 84 L10 84 Z"
                stroke="url(#vaultTriangleGradient)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="vaultTriangleGradient" x1="20" y1="15" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="45%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Subtle atmosphere */}
          <div
            className="absolute right-20 top-20 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: 'rgba(124,58,237,0.10)',
              filter: 'blur(55px)',
            }}
          />

          <div className="relative z-10 p-6 sm:p-9">
            {/* Hero header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <p
                  className="text-[10px] uppercase font-semibold text-violet-200/80"
                  style={{ letterSpacing: '4px' }}
                >
                  OS VAULT
                </p>
                <p
                  className="text-[9px] uppercase text-[var(--text-muted)] mt-1"
                  style={{ letterSpacing: '2px' }}
                >
                  Secure · Non-custodial
                </p>
              </div>

              <Dropdown
                variant="compact"
                value={currency}
                onChange={setCurrency}
                options={supportedCurrencies}
              />
            </div>

            {/* Balance */}
            <div className="relative max-w-[68%]">
              <p
                className="text-[11px] uppercase font-medium text-violet-300/80 mb-3"
                style={{ letterSpacing: '4px' }}
              >
                Total Balance
              </p>

              <div className="font-display leading-none">
                <span
                  className="text-5xl sm:text-7xl font-bold tracking-[-4px]"
                  style={{
                    color: 'var(--text-primary)',
                    textShadow: '0 0 30px rgba(255,255,255,0.06)',
                  }}
                >
                  {currency} {totalUsd.toFixed(2)}
                </span>
              </div>

              {/* Wallet address */}
              <button
                onClick={copyAddress}
                className="mt-5 flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <span>
                  {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
                </span>
                {copied ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-[28px] p-8 text-center">
          <div
            className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              border: '1px solid rgba(139,92,246,0.35)',
              boxShadow: '0 0 25px rgba(139,92,246,0.18)',
            }}
          >
            <svg viewBox="0 0 100 100" width="34" height="34" fill="none">
              <path
                d="M50 12 L90 84 L10 84 Z"
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-[var(--text-muted)]">
            No wallet found. Create one to start.
          </p>
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
          {/* OS VAULT — Primary Actions */}
          <div
            className="relative overflow-hidden rounded-[26px] border border-white/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
            style={{
              background: 'linear-gradient(135deg, rgba(18,18,24,0.92), rgba(8,8,12,0.96))',
              border: '1px solid rgba(139,92,246,0.14)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            }}
          >
            <div className="grid grid-cols-4 divide-x divide-[var(--glass-border)]">

              {/* Send */}
              <button
                onClick={() => {
                  if (filtered.length === 0 && !closeAsset) {
                    addToast('No assets to send.', 'warning');
                    return;
                  }
                  if (filtered.length + (closeAsset ? 1 : 0) === 1) {
                    setSendAsset(closeAsset || filtered[0]);
                    setShowSendModal(true);
                  } else {
                    setShowAssetPicker(true);
                  }
                }}
                className="group flex flex-col items-center justify-center gap-2 min-h-[104px] px-2 transition-all duration-200 hover:bg-white/[0.035] hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.975] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/[0.06] border border-violet-400/25 transition-all group-hover:bg-violet-500/[0.10] group-hover:border-violet-300/45 group-hover:shadow-[0_8px_28px_rgba(139,92,246,0.16)]"
                  style={{
                    border: '1px solid rgba(139,92,246,0.75)',
                    boxShadow: '0 0 18px rgba(139,92,246,0.16)',
                  }}
                >
                  <ArrowUpRight
                    size={20}
                    className="text-violet-400 transition-transform group-hover:-translate-y-0.5"
                  />
                </span>
                <span className="text-[11px] font-medium text-[var(--text-primary)]">
                  Send
                </span>
              </button>

              {/* Receive */}
              <button
                onClick={() => setShowReceiveModal(true)}
                className="group flex flex-col items-center justify-center gap-2 min-h-[104px] px-2 transition-all duration-200 hover:bg-white/[0.035] hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.975] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/[0.06] border border-violet-400/25 transition-all group-hover:bg-violet-500/[0.10] group-hover:border-violet-300/45 group-hover:shadow-[0_8px_28px_rgba(139,92,246,0.16)]"
                  style={{
                    border: '1px solid rgba(139,92,246,0.75)',
                    boxShadow: '0 0 18px rgba(139,92,246,0.16)',
                  }}
                >
                  <ArrowDownRight
                    size={20}
                    className="text-violet-400 transition-transform group-hover:translate-y-0.5"
                  />
                </span>
                <span className="text-[11px] font-medium text-[var(--text-primary)]">
                  Receive
                </span>
              </button>

              {/* Swap */}
              <button
                onClick={() => setShowSwapModal(true)}
                className="group flex flex-col items-center justify-center gap-2 min-h-[104px] px-2 transition-all duration-200 hover:bg-white/[0.035] hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.975] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/[0.06] border border-violet-400/25 transition-all group-hover:bg-violet-500/[0.10] group-hover:border-violet-300/45 group-hover:shadow-[0_8px_28px_rgba(139,92,246,0.16)]"
                  style={{
                    border: '1px solid rgba(139,92,246,0.75)',
                    boxShadow: '0 0 18px rgba(139,92,246,0.16)',
                  }}
                >
                  <ArrowUpDown
                    size={20}
                    className="text-violet-400 transition-transform group-hover:scale-105"
                  />
                </span>
                <span className="text-[11px] font-medium text-[var(--text-primary)]">
                  Swap
                </span>
              </button>

              {/* Buy CLOSE */}
              <button
                onClick={() => setShowBuyModal(true)}
                className="group relative flex flex-col items-center justify-center gap-2 min-h-[104px] px-2 transition-all duration-200 hover:bg-[rgba(217,164,65,0.06)] hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.975] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(217,164,65,0.35)]"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/[0.06] border border-violet-400/25 transition-all group-hover:bg-violet-500/[0.10] group-hover:border-violet-300/45 group-hover:shadow-[0_8px_28px_rgba(139,92,246,0.16)]"
                  style={{
                    border: '1px solid rgba(139,92,246,0.75)',
                    boxShadow: '0 0 18px rgba(139,92,246,0.16)',
                  }}
                >
                  <CreditCard
                    size={20}
                    className="text-violet-400 transition-transform group-hover:scale-105"
                  />
                </span>
                <span className="text-[11px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                  Buy CLOSE
                </span>
              </button>

            </div>
          </div>

          {/* Overflow row - Sell, Refresh, History, Top Up Chat: same handlers, quieter treatment */}
          <div className="grid grid-cols-4 items-center rounded-2xl px-1 py-2 bg-white/[0.018] border border-white/[0.055]">
            <button onClick={() => setShowSellModal(true)} className="group flex items-center justify-center gap-1.5 min-h-9 px-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.035] active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30">
              <DollarSign size={14} className="text-[var(--accent-brass-dim)] transition-transform duration-200 group-hover:scale-110" /> Sell
            </button>
            <button onClick={fetchBalances} className="group flex items-center justify-center gap-1.5 min-h-9 px-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.035] active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30">
              <RefreshCw size={14} className={`text-[var(--accent-brass-dim)] transition-transform duration-200 group-hover:rotate-12 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={() => setShowHistory(true)} className="group flex items-center justify-center gap-1.5 min-h-9 px-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.035] active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30">
              <History size={14} className="text-[var(--accent-brass-dim)] transition-transform duration-200 group-hover:scale-110" /> History
            </button>
            <button onClick={() => setShowChatTopupModal(true)} className="group flex items-center justify-center gap-1.5 min-h-9 px-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.035] active:scale-[0.97] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30">
              <MessageSquare size={14} className="text-[var(--accent-brass-dim)] transition-transform duration-200 group-hover:scale-110" /> Top Up Chat
            </button>
          </div>
        </>
      )}

      {/* Chain Selector - dot shows whether the chain actually holds a balance */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="mr-1 text-[9px] uppercase tracking-[2px] text-[var(--text-muted)]">Network</span>
        {chains.map((c) => {
          const has = c === 'all' || chainsWithBalance.has(c);
          return (
            <button
              key={c}
              onClick={() => setChain(c)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-mono font-bold tracking-wider touch transition-all duration-200 hover:-translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brass)]/30 ${
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
        <div className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] uppercase tracking-[3px] text-violet-300/60 font-semibold">Portfolio</p>
              <h3 className="mt-1 text-lg font-display font-semibold text-[var(--text-primary)]">Your Assets</h3>
            </div>
            <span className="text-[9px] uppercase tracking-[2px] text-[var(--text-muted)]">Live balance</span>
          </div>

          {/* OS VAULT — Pinned CLOSE Asset */}
          {closeAsset && (chain === 'all' || closeAsset.chain === chain) && (
            <div
              className="relative overflow-hidden rounded-[28px] p-5 sm:p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
              style={{
                background:
                  'radial-gradient(circle at 100% 0%, rgba(139,92,246,0.13), transparent 42%), linear-gradient(135deg, rgba(20,19,25,0.96), rgba(8,8,12,0.98))',
                border: '1px solid rgba(139,92,246,0.18)',
                boxShadow: '0 14px 45px rgba(0,0,0,0.20)',
              }}
            >
              {/* subtle violet glow */}
              <div
                className="absolute -right-12 -top-12 w-32 h-32 rounded-full pointer-events-none"
                style={{
                  background: 'rgba(139,92,246,0.12)',
                  filter: 'blur(35px)',
                }}
              />

              <div className="relative z-10">
                {/* Label */}
                <div className="flex items-center justify-between mb-5">
                  <p
                    className="text-[9px] uppercase font-medium text-violet-300/70"
                    style={{ letterSpacing: '3px' }}
                  >
                    Pinned Asset
                  </p>

                  <span
                    className="px-2.5 py-1 rounded-full text-[8px] font-mono uppercase"
                    style={{
                      color: '#a78bfa',
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.20)',
                      letterSpacing: '1px',
                    }}
                  >
                    {closeAsset.chain || 'Polygon'}
                  </span>
                </div>

                {/* Asset */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* CLOSE identity */}
                    <div
                      className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_10px_30px_rgba(217,164,65,0.15)]"
                      style={{
                        background:
                          'linear-gradient(145deg, var(--accent-brass-bright), var(--accent-brass-dim))',
                        boxShadow:
                          '0 0 24px rgba(217,164,65,0.20), inset 0 1px rgba(255,255,255,0.22)',
                      }}
                    >
                      <span
                        className="font-display font-black text-lg"
                        style={{ color: '#14120C' }}
                      >
                        C
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-display font-semibold text-[var(--text-primary)]">
                          CLOSE
                        </p>
                        <span className="text-[8px] uppercase tracking-wider text-[var(--accent-brass-bright)]">
                          Native
                        </span>
                      </div>

                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        OS AI Token
                      </p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-lg font-semibold text-[var(--text-primary)]">
                      {closeAsset.balance.toFixed(4)}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                      ${(closeAsset.usdValue || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Bottom metadata / action */}
                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: '#8b5cf6',
                        boxShadow: '0 0 8px rgba(139,92,246,0.9)',
                      }}
                    />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                      Available
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSendAsset(closeAsset);
                      setShowSendModal(true);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-medium text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    Send CLOSE
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-[24px] px-1 overflow-hidden border border-white/[0.055]">
            {filtered.length === 0 ? (
              !closeAsset && <p className="text-sm py-6 text-center text-[var(--text-muted)]">No assets on this network yet.</p>
            ) : (
              filtered.map((a, i) => {
                const up = (a.change24h ?? 0) >= 0;
                return (
                  <div key={i} className={`flex items-center justify-between px-4 py-4 ${i < filtered.length - 1 ? 'border-b border-[var(--glass-border)]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: chainColors[a.chain] || 'var(--text-muted)' }} />
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

      <SendModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} asset={sendAsset} assets={assets} refreshBalances={fetchBalances} onSent={(txHash) => { addToast(`Sent: ${txHash.slice(0, 12)}...`, 'success'); fetchBalances(); }} />
      <SwapModal isOpen={showSwapModal} onClose={() => setShowSwapModal(false)} userWalletAddress={user?.wallet_address} assets={assets} onSwap={(txHash) => { addToast(`Swap: ${txHash.slice(0, 12)}...`, 'success'); fetchBalances(); }} />
      <DepositModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} onDeposited={(result) => { addToast(`Purchased ${result.close_credited} CLOSE for ${result.amount} ${result.token_symbol}`, 'success'); fetchBalances(); }} />
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
                          ? { borderColor: 'var(--accent-brass)', background: 'rgba(249,115,22,0.08)' }
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
          refreshBalances={fetchBalances}
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

function Governance() {
  const { assets } = useWallet();
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [params, setParams] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProposal, setSelectedProposal] = useState(null);
  const [votingPower, setVotingPower] = useState(null);
  const [voting, setVoting] = useState(false);

  const [showNewProposal, setShowNewProposal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const [founderReason, setFounderReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const closeStaked = 0; // proposal eligibility is checked server-side against real stake_positions, not this display value

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/governance/params'),
      api.get('/governance/proposals'),
    ])
      .then(([paramsRes, proposalsRes]) => {
        setParams(paramsRes.data);
        setProposals(proposalsRes.data.proposals || []);
      })
      .catch((e) => addToast(extractErrorMessage(e, 'Failed to load governance data'), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const openProposal = (proposal) => {
    setSelectedProposal(proposal);
    setVotingPower(null);
    api.get(`/governance/proposals/${proposal.id}/my-power`)
      .then((res) => setVotingPower(res.data))
      .catch((e) => addToast(extractErrorMessage(e, 'Failed to load voting power'), 'error'));
  };

  const castVote = async (support) => {
    if (!selectedProposal) return;
    setVoting(true);
    try {
      await api.post(`/governance/proposals/${selectedProposal.id}/vote`, { support });
      addToast('Vote cast!', 'success');
      setSelectedProposal(null);
      loadData();
    } catch (e) {
      addToast(extractErrorMessage(e, 'Vote failed'), 'error');
    } finally {
      setVoting(false);
    }
  };

  const submitFounderDecision = async (decision) => {
    if (!selectedProposal) return;
    if (!founderReason.trim()) {
      addToast('A reason is required', 'error');
      return;
    }
    setSubmittingDecision(true);
    try {
      await api.post(`/governance/proposals/${selectedProposal.id}/founder-decision`, {
        decision,
        reason: founderReason.trim(),
      });
      addToast('Decision recorded', 'success');
      setSelectedProposal(null);
      setFounderReason('');
      loadData();
    } catch (e) {
      addToast(extractErrorMessage(e, 'Failed to record decision'), 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const submitProposal = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      addToast('Title and description are required', 'error');
      return;
    }
    setSubmittingProposal(true);
    try {
      await api.post('/governance/proposals', { title: newTitle.trim(), description: newDescription.trim() });
      addToast('Proposal created!', 'success');
      setShowNewProposal(false);
      setNewTitle('');
      setNewDescription('');
      loadData();
    } catch (e) {
      addToast(extractErrorMessage(e, 'Failed to create proposal'), 'error');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const statusLabel = (status) => ({
    active: 'Active',
    passed: 'Passed',
    failed: 'Failed',
    quorum_not_reached: 'Quorum not reached',
    approved: 'Founder Approved',
    rejected: 'Founder Rejected',
  }[status] || status);

  const statusColor = (status) => ({
    active: 'var(--accent-brass-bright)',
    passed: 'var(--success)',
    failed: 'var(--danger)',
    quorum_not_reached: 'var(--text-muted)',
    approved: 'var(--success)',
    rejected: 'var(--danger)',
  }[status] || 'var(--text-muted)');

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {params && (
        <div className="glass-panel rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">Requirements</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {params.min_staked_to_propose.toLocaleString()} CLOSE staked to propose · {params.voting_period_days}-day voting period · {params.quorum_percent}% quorum
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />)}
        </div>
      )}

      {!loading && (
        <>
          <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">Proposals</p>

          {proposals.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">No proposals yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {proposals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProposal(p)}
                  className="w-full text-left glass-panel rounded-2xl p-4 transition hover:border-[var(--glass-border-hover)]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-display font-bold text-base text-[var(--text-primary)] pr-3">{p.title}</p>
                    <span className="text-[10px] font-mono uppercase whitespace-nowrap px-2 py-1 rounded-full" style={{ color: statusColor(p.effective_status), background: 'rgba(255,255,255,0.05)' }}>
                      {statusLabel(p.effective_status)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-[var(--text-muted)]">
                    <span>{p.voter_count} voters</span>
                    <span>{p.vote_totals.for.toLocaleString()} for · {p.vote_totals.against.toLocaleString()} against</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { if (!user?.wallet_address) { addToast('Create a wallet first.', 'warning'); return; } setShowNewProposal(true); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold bg-gradient-to-br from-[var(--accent-brass-bright)] to-[var(--accent-brass)] text-[#20190B]"
          >
            + New Proposal
          </button>
        </>
      )}

      {showNewProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowNewProposal(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">New Proposal</h3>
              <button onClick={() => setShowNewProposal(false)} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            {params && (
              <p className="text-xs text-[var(--text-muted)]">Requires {params.min_staked_to_propose.toLocaleString()} CLOSE actively staked.</p>
            )}
            <div>
              <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Title</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input-glass w-full mt-1" placeholder="Proposal title" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Description</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="input-glass w-full mt-1 min-h-[120px]" placeholder="Explain the proposal in detail" />
            </div>
            <button onClick={submitProposal} disabled={submittingProposal} className="btn-primary w-full justify-center">
              {submittingProposal ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Submit Proposal'}
            </button>
          </div>
        </div>
      )}

      {selectedProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedProposal(null)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">{selectedProposal.title}</h3>
              <button onClick={() => setSelectedProposal(null)} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{selectedProposal.description}</p>

            <div className="flex items-center justify-between text-[11.5px] text-[var(--text-secondary)] py-2.5 border-t border-b border-dashed border-[var(--glass-border)]">
              <span>For</span>
              <span className="font-mono font-semibold text-[var(--success)]">{selectedProposal.vote_totals.for.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11.5px] text-[var(--text-secondary)] pb-2.5 border-b border-dashed border-[var(--glass-border)]">
              <span>Against</span>
              <span className="font-mono font-semibold text-[var(--danger)]">{selectedProposal.vote_totals.against.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11.5px] text-[var(--text-secondary)] pb-2.5 border-b border-dashed border-[var(--glass-border)]">
              <span>Abstain</span>
              <span className="font-mono font-semibold text-[var(--text-muted)]">{selectedProposal.vote_totals.abstain.toLocaleString()}</span>
            </div>

            {selectedProposal.founder_decision && (
              <div className="rounded-xl p-3" style={{
                background: selectedProposal.founder_decision === 'approved' ? 'rgba(52,199,89,0.08)' : 'rgba(255,69,58,0.08)',
                border: `1px solid ${selectedProposal.founder_decision === 'approved' ? 'rgba(52,199,89,0.25)' : 'rgba(255,69,58,0.25)'}`,
              }}>
                <p className="text-xs font-mono uppercase tracking-wide" style={{ color: statusColor(selectedProposal.founder_decision) }}>
                  {statusLabel(selectedProposal.founder_decision)}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{selectedProposal.founder_reason}</p>
              </div>
            )}

            {votingPower === null ? (
              <p className="text-xs text-center text-[var(--text-muted)]">Checking your voting eligibility...</p>
            ) : votingPower.already_voted ? (
              <p className="text-xs text-center text-[var(--text-muted)]">You voted "{votingPower.voted_support}" on this proposal.</p>
            ) : !votingPower.eligible ? (
              <p className="text-xs text-center text-[var(--text-muted)]">You had no active staked CLOSE when this proposal was created, so you can't vote on it.</p>
            ) : selectedProposal.status !== 'active' ? (
              <p className="text-xs text-center text-[var(--text-muted)]">Voting has closed on this proposal.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-center text-[var(--text-muted)]">Your voting weight: {votingPower.weight.toLocaleString()} CLOSE</p>
                <div className="flex gap-2">
                  <button onClick={() => castVote('for')} disabled={voting} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--success)] text-black">For</button>
                  <button onClick={() => castVote('against')} disabled={voting} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--danger)] text-white">Against</button>
                  <button onClick={() => castVote('abstain')} disabled={voting} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-[var(--glass-border)] text-[var(--text-secondary)]">Abstain</button>
                </div>
              </div>
            )}

            {user?.is_founder && selectedProposal.status !== 'active' && !selectedProposal.founder_decision && (
              <div className="space-y-2 pt-2 border-t border-dashed border-[var(--glass-border)]">
                <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">Founder Decision</p>
                <textarea
                  value={founderReason}
                  onChange={(e) => setFounderReason(e.target.value)}
                  className="input-glass w-full min-h-[80px]"
                  placeholder="Reason (shown publicly on this proposal)"
                />
                <div className="flex gap-2">
                  <button onClick={() => submitFounderDecision('approved')} disabled={submittingDecision} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--success)] text-black">Approve</button>
                  <button onClick={() => submitFounderDecision('rejected')} disabled={submittingDecision} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[var(--danger)] text-white">Reject</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WalletsTab() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [importedWallets, setImportedWallets] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null); // null = primary
  const [walletAssets, setWalletAssets] = useState([]);
  const [walletTotalUsd, setWalletTotalUsd] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendAsset, setSendAsset] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { open: openAppKit } = useAppKit();
  const { address: connectedAddress, isConnected } = useAppKitAccount();
  const [savedConnectedAddresses, setSavedConnectedAddresses] = useState([]);

  // Once a wallet connects via AppKit, persist it to os_wallets (no key
  // held - see POST /wallet/import/connected) so it shows up in the list
  // like any other owned wallet. Guarded against re-saving the same
  // address on every re-render/reconnect.
  useEffect(() => {
    if (!isConnected || !connectedAddress || !user) return;
    if (savedConnectedAddresses.includes(connectedAddress.toLowerCase())) return;
    api.post('/wallet/import/connected', { address: connectedAddress, label: 'Connected Wallet' })
      .then(() => {
        setSavedConnectedAddresses((prev) => [...prev, connectedAddress.toLowerCase()]);
        addToast('Wallet connected!', 'success');
        fetchImportedWallets();
      })
      .catch((e) => {
        const msg = e.response?.data?.detail || '';
        // Already-added is expected on reconnect after the first save -
        // still mark it saved locally so we stop retrying, but don't
        // show an error toast for what's actually a normal case.
        if (msg.includes('already added')) {
          setSavedConnectedAddresses((prev) => [...prev, connectedAddress.toLowerCase()]);
        } else {
          console.error('Failed to save connected wallet', e);
        }
      });
  }, [isConnected, connectedAddress, user]);

  const copyActiveAddress = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const fetchImportedWallets = () => {
    api.get('/wallet/import/list')
      .then((res) => setImportedWallets(res.data || []))
      .catch((e) => console.error('Failed to fetch imported wallets', e));
  };

  useEffect(() => { if (user) fetchImportedWallets(); }, [user]);

  const allWallets = user?.wallet_address
    ? [
        { id: 'primary', address: user.wallet_address, label: 'Primary', isPrimary: true },
        ...importedWallets.filter((w) => w.address.toLowerCase() !== user.wallet_address.toLowerCase()),
      ]
    : [];

  const activeAddress = selectedAddress || user?.wallet_address;
  const activeWallet = allWallets.find((w) => w.address === activeAddress);

  const fetchWalletBalance = (address) => {
    if (!address) return;
    setBalanceLoading(true);
    const params = address.toLowerCase() !== user?.wallet_address?.toLowerCase() ? { wallet_address: address } : {};
    api.get('/wallet/balance', { params })
      .then((res) => {
        const data = res.data.balances || {};
        const items = [];
        let total = 0;
        for (const [chain, chainData] of Object.entries(data)) {
          if (chain === 'close') continue;
          const native = chainData.native;
          if (native && native.balance > 0) {
            items.push({ chain, symbol: native.symbol || chain.toUpperCase(), balance: native.balance, usdValue: native.usd || 0 });
            total += native.usd || 0;
          }
          const tokens = chainData.tokens || {};
          for (const [symbol, token] of Object.entries(tokens)) {
            if (token.balance > 0) {
              items.push({ chain, symbol, balance: token.balance, usdValue: token.usd || 0, address: token.address || null });
              total += token.usd || 0;
            }
          }
        }
        setWalletAssets(items);
        setWalletTotalUsd(total);
      })
      .catch((e) => {
        console.error('Failed to fetch wallet balance', e);
        setWalletAssets([]);
        setWalletTotalUsd(0);
      })
      .finally(() => setBalanceLoading(false));
  };

  const fetchWalletHistory = (address) => {
    if (!address) return;
    setHistoryLoading(true);
    const params = { wallet_address: address };
    api.get('/wallet/transactions/history', { params })
      .then((res) => setHistory(res.data.history || []))
      .catch((e) => { console.error('Failed to fetch wallet history', e); setHistory([]); })
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    if (!activeAddress) return;
    fetchWalletBalance(activeAddress);
    fetchWalletHistory(activeAddress);
  }, [activeAddress]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">Your Wallets</p>
        <div className="flex items-center gap-3">
          <button onClick={() => openAppKit()} className="text-xs font-medium text-[var(--accent-brass-bright)]">+ Connect</button>
          <button onClick={() => setShowImportModal(true)} className="text-xs font-medium text-[var(--accent-brass-bright)]">+ Import</button>
        </div>
      </div>

      <div className="space-y-2">
        {allWallets.map((w) => (
          <button
            key={w.address}
            onClick={() => setSelectedAddress(w.isPrimary ? null : w.address)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors text-left"
            style={activeAddress === w.address
              ? { background: 'rgba(249,115,22,0.10)', borderColor: 'var(--accent-brass)' }
              : { background: 'rgba(255,255,255,0.05)', borderColor: 'var(--glass-border)' }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{w.label}{w.isPrimary ? ' (Primary)' : ''}</p>
                {w.wallet_type === 'connected' && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-[var(--text-muted)] shrink-0">Connected</span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)]">{w.address?.slice(0, 8)}...{w.address?.slice(-6)}</p>
            </div>
            {activeAddress === w.address && (
              <span className="text-[10px] font-mono uppercase text-[var(--accent-brass-bright)] shrink-0">Active</span>
            )}
          </button>
        ))}
      </div>

      {activeWallet && (
        <>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2" style={{ letterSpacing: '2px' }}>
              {activeWallet.label} Balance
            </p>
            <div className="text-3xl font-display font-bold text-[var(--text-primary)] mb-4">
              {balanceLoading ? '...' : `$${walletTotalUsd.toFixed(2)}`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (walletAssets.length === 0) { addToast('No assets to send from this wallet.', 'warning'); return; }
                  if (walletAssets.length === 1) { setSendAsset(walletAssets[0]); setShowSendModal(true); }
                  else { setShowAssetPicker(true); }
                }}
                className="btn-primary flex-1 justify-center"
              >
                <Send size={16} /> Send
              </button>
              <button onClick={() => setShowReceiveModal(true)} className="btn-secondary flex-1 justify-center">
                <ArrowDownRight size={16} /> Receive
              </button>
              <button onClick={() => setShowSwapModal(true)} className="btn-secondary flex-1 justify-center">
                <ArrowUpDown size={16} /> Swap
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)] flex items-center gap-1.5">
              <History size={12} /> Transaction History
            </p>
            {historyLoading ? (
              <div className="h-14 animate-pulse rounded-lg bg-white/5" />
            ) : history.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">No transactions for this wallet yet.</p>
            ) : (
              <div className="glass-panel rounded-xl px-1">
                {history.map((tx, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < history.length - 1 ? 'border-b border-[var(--glass-border)]' : ''}`}>
                    <div>
                      <p className="text-sm font-medium capitalize text-[var(--text-primary)]">{tx.kind}</p>
                      <p className="text-xs text-[var(--text-muted)]">{tx.amount} {tx.token_symbol || 'CLOSE'} {tx.status ? `\u00b7 ${tx.status}` : ''}</p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{tx.created ? new Date(tx.created).toLocaleDateString() : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowAssetPicker(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-sm p-5 space-y-2" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold mb-2 text-[var(--text-primary)]">Send which asset?</h3>
            {walletAssets.map((a, i) => (
              <button key={i} onClick={() => { setSendAsset(a); setShowAssetPicker(false); setShowSendModal(true); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition bg-white/5 border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]">
                <span className="text-[var(--text-primary)]">{a.symbol}</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{a.balance.toFixed(4)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowReceiveModal(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-display font-bold text-[var(--text-primary)]">Receive</h3>
              <button onClick={() => setShowReceiveModal(false)} className="btn-glass-icon w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Send only Polygon-network assets to this address. Sending from another network may result in permanent loss of funds.
            </p>
            <div className="rounded-xl p-3 bg-white/5 border border-[var(--glass-border)]">
              <p className="text-xs font-mono break-all text-[var(--text-primary)]">{activeAddress}</p>
            </div>
            <button onClick={copyActiveAddress} className="btn-primary w-full justify-center">
              {copiedAddress ? <CheckCircle size={18} /> : <Copy size={18} />} {copiedAddress ? 'Copied' : 'Copy Address'}
            </button>
          </div>
        </div>
      )}

      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        asset={sendAsset}
        assets={walletAssets}
        wallets={[]}
        defaultWalletAddress={activeWallet && !activeWallet.isPrimary ? activeWallet.address : ''}
        refreshBalances={() => fetchWalletBalance(activeAddress)}
        onSent={(txHash) => { addToast(`Sent: ${txHash.slice(0, 12)}...`, 'success'); fetchWalletBalance(activeAddress); fetchWalletHistory(activeAddress); }}
      />
      <SwapModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        userWalletAddress={activeAddress}
        assets={walletAssets}
        wallets={[]}
        defaultWalletAddress={activeWallet && !activeWallet.isPrimary ? activeWallet.address : ''}
        onSwap={(txHash) => { addToast(`Swap: ${txHash.slice(0, 12)}...`, 'success'); fetchWalletBalance(activeAddress); fetchWalletHistory(activeAddress); }}
      />
      <ImportWalletModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImported={() => { addToast('Wallet imported!', 'success'); fetchImportedWallets(); }} />
    </div>
  );
}

export default function Vault() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'staking' ? 'staking' : 'standard';
  const [tab, setTab] = useState(initialTab);
  return (
    <div className="p-4 tablet:p-6 space-y-6 max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
        <Wallet size={28} className="text-[var(--accent-brass)]" /> OS Vaults
      </h1>
      <p className="text-sm text-[var(--text-muted)]">Multi-chain non-custodial asset hub</p>
      <div className="glass-panel flex gap-1 p-1 rounded-2xl overflow-x-auto max-w-full">
        <button onClick={() => setTab('standard')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all shrink-0 whitespace-nowrap ${tab === 'standard' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>Portfolio</button>
        <button onClick={() => setTab('analytics')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all shrink-0 whitespace-nowrap flex items-center gap-2 ${tab === 'analytics' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><BarChart size={16} /> Analytics</button>
        <button onClick={() => setTab('safe')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all shrink-0 whitespace-nowrap flex items-center gap-2 ${tab === 'safe' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><ShieldCheck size={16} /> Safe</button>
        <button onClick={() => setTab('staking')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all shrink-0 whitespace-nowrap flex items-center gap-2 ${tab === 'staking' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Coins size={16} /> Staking</button>
        <button onClick={() => setTab('governance')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all shrink-0 whitespace-nowrap flex items-center gap-2 ${tab === 'governance' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Vote size={16} /> Governance</button>
        <button onClick={() => setTab('wallets')} className={`px-5 py-2 rounded-xl text-sm font-bold touch transition-all shrink-0 whitespace-nowrap flex items-center gap-2 ${tab === 'wallets' ? 'bg-[var(--accent-brass)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Wallet size={16} /> Wallets</button>
      </div>
      {tab === 'standard' && <StandardWallet />}
      {tab === 'analytics' && <WalletAnalytics />}
      {tab === 'safe' && <SafeWallet />}
      {tab === 'staking' && <Staking />}
      {tab === 'governance' && <Governance />}
      {tab === 'wallets' && <WalletsTab />}
    </div>
  );
}
