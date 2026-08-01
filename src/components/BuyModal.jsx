import { useState } from 'react';
import { X } from 'lucide-react';

export function BuyModal({ isOpen, onClose, onBuy }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleBuy = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Buy crypto feature coming soon with MoonPay/Transak.');
      onClose();
      if (onBuy) onBuy();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Buy Crypto</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] touch"><X size={24} /></button>
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Amount (USD)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base" placeholder="100" />
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">Crypto to receive</label>
          <select className="input-base">
            <option>CLOSE</option>
            <option>OSINA</option>
            <option>USDC</option>
          </select>
        </div>
        <button onClick={handleBuy} disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Processing…' : 'Continue to Payment'}
        </button>
        {error && <p className="text-sm text-[var(--danger)] font-mono">{error}</p>}
      </div>
    </div>
  );
}
