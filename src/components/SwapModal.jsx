import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowUpDown } from 'lucide-react';
import { api } from '../utils/api';
import { Modal } from './ui/Modal';
import { Dropdown } from './ui/Dropdown';

const TOKEN_MAP = {
  MATIC: '0x0000000000000000000000000000000000001010',
  CLOSE: '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8',
  OSINA: '0xbaf280b74c264a911b41341a26508eac9e74fd4f',
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
};

export function SwapModal({ isOpen, onClose, onSwap, userWalletAddress, assets, wallets = [], defaultWalletAddress = '' }) {
  const [fromWallet, setFromWallet] = useState(defaultWalletAddress);
  const [fromToken, setFromToken] = useState('MATIC');
  const [toToken, setToToken] = useState('CLOSE');
  const [amount, setAmount] = useState('');
  const [routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const tokens = ['MATIC', 'CLOSE', 'OSINA', 'USDC', 'WETH', 'DAI'];

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setRouteSummary(null);
      return;
    }
    const fetchQuote = async () => {
      setLoading(true);
      setError(null);
      try {
        const fromAddr = TOKEN_MAP[fromToken] || TOKEN_MAP.MATIC;
        const toAddr = TOKEN_MAP[toToken] || TOKEN_MAP.CLOSE;
        const amountWei = (parseFloat(amount) * 1e18).toString();
        const res = await api.get(`/swap/quote?chain=polygon&fromTokenAddress=${fromAddr}&toTokenAddress=${toAddr}&amount=${amountWei}`);
        setRouteSummary(res.data.routeSummary);
      } catch (e) {
        setError(e.response?.data?.detail || 'Failed to get quote');
        setRouteSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [amount, fromToken, toToken]);

  // Step 1 of execution: build the encoded calldata for the current route,
  // then open the password modal to sign+broadcast it.
  const handleConfirmSwap = () => {
    if (!routeSummary) return;
    setError(null);
    setShowPasswordModal(true);
  };

  // Step 2: called with the password once the user confirms in the modal.
  const handleSignAndExecute = async (password) => {
    setExecuting(true);
    setError(null);
    try {
      const buildRes = await api.post('/swap/swap', {
        chain: 'polygon',
        routeSummary,
        fromAddress: fromWallet || userWalletAddress,
      });
      const { to, data, value } = buildRes.data;

      const execRes = await api.post('/swap/execute', {
        chain: 'polygon',
        to,
        data,
        value,
        password,
        wallet_address: fromWallet || undefined,
      });

      onSwap?.(execRes.data.tx_hash);
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Swap execution failed');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  const MIN_GAS_POL = 0.01;
  const polAsset = (assets || []).find((a) => a.chain === 'polygon' && a.symbol === 'POL');
  const polBalance = polAsset ? polAsset.balance : 0;
  const insufficientGas = !fromWallet && polBalance < MIN_GAS_POL;

  const outputAmount = routeSummary?.amountOut ? (parseInt(routeSummary.amountOut) / 1e18).toFixed(4) : '—';
  const outputUsd = routeSummary?.amountOutUsd ? parseFloat(routeSummary.amountOutUsd).toFixed(2) : null;
  const gasUsd = routeSummary?.gasUsd ? parseFloat(routeSummary.gasUsd).toFixed(4) : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ArrowUpDown size={24} className="text-[var(--accent-brass)]" /> Swap Tokens
            </h3>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={24} /></button>
          </div>

          {wallets.length > 0 && (
            <div>
              <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Swap From</label>
              <select
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
                className="input-base w-full mt-1"
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

          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">From</label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1">
                <Dropdown value={fromToken} onChange={setFromToken} options={tokens} />
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base w-32" placeholder="0.0" min="0" step="0.001" />
            </div>
          </div>

          <div className="flex justify-center">
            <button onClick={() => { setFromToken(toToken); setToToken(fromToken); }} className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]">
              <ArrowUpDown size={20} />
            </button>
          </div>

          <div>
            <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">To</label>
            <Dropdown value={toToken} onChange={setToToken} options={tokens} />
          </div>

          {loading && <div className="text-sm text-[var(--text-muted)]">Getting quote...</div>}

          {routeSummary && (
            <div className="glass-card p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Output</span>
                <span className="text-[var(--text-primary)] font-mono">
                  {outputAmount} {toToken}{outputUsd ? ` (~$${outputUsd})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Est. gas</span>
                <span className="text-[var(--text-muted)]">{gasUsd ? `$${gasUsd}` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Slippage</span>
                <span className="text-[var(--text-muted)]">0.5%</span>
              </div>
            </div>
          )}

          {insufficientGas && (
            <p className="text-sm font-mono" style={{ color: 'var(--accent-brass)' }}>
              ⚠️ Low POL balance ({polBalance.toFixed(4)} POL) - you need at least {MIN_GAS_POL} POL to cover gas for this swap.
            </p>
          )}
          {error && <p className="text-sm text-[var(--danger)] font-mono">{String(error)}</p>}

          <button
            onClick={handleConfirmSwap}
            disabled={!routeSummary || executing || loading || insufficientGas}
            className="btn-primary w-full justify-center gap-2"
            style={{ background: 'var(--accent-brass)', color: 'black' }}
          >
            {executing ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Swap'}
          </button>
          <button onClick={onClose} className="btn-secondary w-full justify-center">Cancel</button>
        </div>
      </div>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Confirm Swap"
        message={`Enter your wallet password to swap ${amount} ${fromToken} for ${toToken}.`}
        inputType="password"
        inputPlaceholder="Enter password"
        onConfirm={handleSignAndExecute}
        confirmText="Swap"
        cancelText="Cancel"
      />
    </>
  );
}
