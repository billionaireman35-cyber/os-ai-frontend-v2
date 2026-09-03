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
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-white/[0.08] rounded-[28px] w-full max-w-md p-5 sm:p-7 space-y-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="absolute -top-24 -right-20 w-48 h-48 rounded-full bg-violet-500/[0.08] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -left-20 w-52 h-52 rounded-full bg-[var(--accent-brass)]/[0.05] blur-3xl pointer-events-none" />

          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-500/[0.10] border border-violet-400/[0.18] flex items-center justify-center">
                <ArrowUpDown size={21} className="text-violet-300" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
                  OS VAULT
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-[var(--text-primary)]">
                  Swap assets
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.05] active:scale-95 transition-all duration-200"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <p className="relative text-sm text-[var(--text-muted)] -mt-2">
            Exchange assets securely from your OS Vault.
          </p>

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

          <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                You pay
              </label>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Polygon
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Dropdown value={fromToken} onChange={setFromToken} options={tokens} />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-[45%] min-h-12 bg-transparent border-0 outline-none text-right text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] placeholder:text-white/20 focus:ring-0"
                placeholder="0.0"
                min="0"
                step="0.001"
              />
            </div>
          </div>

          <div className="relative flex justify-center -my-1 z-10">
            <button
              onClick={() => { setFromToken(toToken); setToToken(fromToken); }}
              className="w-11 h-11 rounded-2xl border border-white/[0.10] bg-[var(--bg-secondary)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex items-center justify-center text-violet-300 hover:bg-white/[0.05] hover:-translate-y-px active:scale-95 transition-all duration-200"
              aria-label="Reverse swap"
            >
              <ArrowUpDown size={19} />
            </button>
          </div>

          <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                You receive
              </label>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Estimated
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Dropdown value={toToken} onChange={setToToken} options={tokens} />
              </div>
              <div className="w-[45%] text-right text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] truncate">
                {routeSummary ? outputAmount : '—'}
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-2 px-1 text-xs text-[var(--text-muted)]">
              <Loader2 size={14} className="animate-spin" />
              Finding the best route…
            </div>
          )}

          {routeSummary && (
            <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Estimated output</span>
                <span className="text-[var(--text-primary)] font-mono">
                  {outputAmount} {toToken}{outputUsd ? ` (~$${outputUsd})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Est. gas</span>
                <span className="text-[var(--text-muted)]">{gasUsd ? `$${gasUsd}` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Max slippage</span>
                <span className="text-[var(--text-muted)]">0.5%</span>
              </div>
            </div>
          )}

          {insufficientGas && (
            <div className="rounded-xl border border-[var(--accent-brass)]/20 bg-[var(--accent-brass)]/[0.06] px-4 py-3 text-xs leading-relaxed text-[var(--accent-brass)]">
              Low POL balance ({polBalance.toFixed(4)} POL). You need at least {MIN_GAS_POL} POL to cover gas for this swap.
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/[0.06] px-4 py-3 text-xs leading-relaxed text-[var(--danger)]">
              {String(error)}
            </div>
          )}

          <div className="space-y-2 pt-1">
          <button
            onClick={handleConfirmSwap}
            disabled={!routeSummary || executing || loading || insufficientGas}
            className="w-full min-h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brass)]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ background: 'var(--accent-brass)', color: 'black' }}
          >
            {executing ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Swapping…
              </>
            ) : (
              <>
                <ArrowUpDown size={18} />
                Review swap
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full min-h-10 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.035] active:scale-[0.985] transition-all duration-200"
          >
            Cancel
          </button>
        </div>
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
