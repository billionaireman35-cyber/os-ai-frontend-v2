import { useState } from 'react';
import { X } from 'lucide-react';

export function SwapModal({ isOpen, onClose, onSwap }) {
  const [fromToken, setFromToken] = useState('MATIC');
  const [toToken, setToToken] = useState('CLOSE');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const getQuote = () => {
    setLoading(true);
    setTimeout(() => {
      setQuote({ amount_out: amount * 0.98, fee_usd: 0.01, slippage: 0.5 });
      setLoading(false);
    }, 500);
  };

  const executeSwap = () => {
    alert('Swap executed (mock)');
    onClose();
    if (onSwap) onSwap('0xmock');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Swap Tokens</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch"><X size={24} /></button>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">From</label>
          <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} className="input-base">
            <option>MATIC</option>
            <option>CLOSE</option>
            <option>OSINA</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">To</label>
          <select value={toToken} onChange={(e) => setToToken(e.target.value)} className="input-base">
            <option>CLOSE</option>
            <option>MATIC</option>
            <option>OSINA</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base" placeholder="0.0" />
        </div>
        {quote && (
          <div className="glass-card p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Output</span>
              <span className="text-[var(--text-primary)] font-mono">{quote.amount_out} {toToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Fee</span>
              <span className="text-[var(--accent-brass)] font-mono">${quote.fee_usd}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Slippage</span>
              <span className="text-[var(--text-primary)] font-mono">{quote.slippage}%</span>
            </div>
            <button onClick={executeSwap} className="btn-primary w-full justify-center mt-2">Confirm Swap</button>
          </div>
        )}
        {!quote && (
          <button onClick={getQuote} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Getting quote…' : 'Get Quote'}
          </button>
        )}
        {error && <p className="text-sm text-[var(--danger)] font-mono">{error}</p>}
      </div>
    </div>
  );
}
