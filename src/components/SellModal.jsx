import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export function SellModal({ isOpen, onClose, onSell }) {
  const [currency, setCurrency] = useState('eth');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSell = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/moonpay/sell', {
        currency_code: currency,
        crypto_amount: parseFloat(cryptoAmount) || undefined,
      });
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
        onSell?.();
        onClose();
      } else {
        throw new Error('No URL returned from MoonPay');
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to initiate sell');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Sell Crypto</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={24} /></button>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-base">
            <option value="eth">Ethereum (ETH)</option>
            <option value="polygon">Polygon (POL)</option>
            <option value="bnb">BNB</option>
            <option value="usdc">USDC</option>
            <option value="usdt">USDT</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount (Crypto)</label>
          <input type="number" value={cryptoAmount} onChange={(e) => setCryptoAmount(e.target.value)} className="input-base" placeholder="0.0" step="0.01" min="0" />
        </div>
        {error && <p className="text-sm text-[var(--danger)] font-mono">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSell} disabled={loading} className="btn-primary flex-1 justify-center" style={{ backgroundColor: 'var(--danger)', hover: 'var(--danger-dark)' }}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sell with MoonPay'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  );
}
