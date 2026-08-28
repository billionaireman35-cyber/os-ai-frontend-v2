import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { Dropdown } from './ui/Dropdown';

export function BuyModal({ isOpen, onClose, onBuy }) {
  const [currency, setCurrency] = useState('eth');
  const [fiatAmount, setFiatAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/moonpay/buy', {
        currency_code: currency,
        fiat_amount: fiatAmount,
      });
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
        onBuy?.();
        onClose();
      } else {
        throw new Error('No URL returned from MoonPay');
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Failed to initiate buy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Buy Crypto</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={24} /></button>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Currency</label>
          <Dropdown
            value={currency}
            onChange={setCurrency}
            options={[
              { value: 'eth', label: 'Ethereum (ETH)' },
              { value: 'polygon', label: 'Polygon (POL)' },
              { value: 'bnb', label: 'BNB' },
              { value: 'usdc', label: 'USDC' },
              { value: 'usdt', label: 'USDT' },
            ]}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount (USD)</label>
          <input type="number" value={fiatAmount} onChange={(e) => setFiatAmount(parseFloat(e.target.value))} className="input-base" min={10} step={5} />
        </div>
        {error && <p className="text-sm text-[var(--danger)] font-mono">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleBuy} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Buy with MoonPay'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        </div>
      </div>
    </div>
  );
}
