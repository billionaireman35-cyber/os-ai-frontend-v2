import { useState, useEffect } from 'react';
import { X, CreditCard, Wallet } from 'lucide-react';
import { api } from '../utils/api';

export function BuyModal({ isOpen, onClose, onBuy }) {
  const [amount, setAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [cryptoCurrency, setCryptoCurrency] = useState('CLOSE');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [widgetUrl, setWidgetUrl] = useState(null);

  const fiatOptions = ['USD', 'EUR', 'GBP', 'NGN'];
  const cryptoOptions = ['CLOSE', 'OSINA', 'USDC', 'USDT', 'MATIC', 'ETH'];

  const generateMoonPayUrl = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build the MoonPay widget URL (base)
      const baseUrl = 'https://buy.moonpay.com';
      const params = new URLSearchParams({
        apiKey: import.meta.env.VITE_MOONPAY_PUBLIC_KEY || 'pk_live_...',
        currencyCode: cryptoCurrency,
        fiatCurrency: fiatCurrency,
        fiatAmount: amount,
        paymentMethod: paymentMethod,
        walletAddress: '', // will be filled later
        walletAddresses: JSON.stringify({
          [cryptoCurrency]: '', // need user's wallet address
        }),
      });

      // Get the user's wallet address
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;
      // We need the wallet address – we can get it from the user object
      // For now, we'll fetch the user's wallet address from the backend.
      const meRes = await api.get('/auth/me');
      const walletAddress = meRes.data.wallet_address;

      if (!walletAddress) {
        throw new Error('No wallet found. Please create a wallet first.');
      }

      // Update the URL with the wallet address
      params.set('walletAddress', walletAddress);
      params.set('walletAddresses', JSON.stringify({
        [cryptoCurrency]: walletAddress,
      }));

      // Get the signature from the backend
      const signedUrl = `${baseUrl}?${params.toString()}`;
      const signRes = await api.post('/wallet/moonpay-sign', { url: signedUrl });
      const signature = signRes.data.signature;

      // Final URL with signature
      const finalUrl = `${signedUrl}&signature=${signature}`;
      setWidgetUrl(finalUrl);
    } catch (e) {
      setError(e.message || 'Failed to generate payment link');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-panel2)] border border-[var(--color-line)] rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display text-[var(--color-text-primary)]">Buy Crypto</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] touch-target">
            <X size={24} />
          </button>
        </div>

        {!widgetUrl ? (
          // Form
          <div className="space-y-4">
            <div>
              <label className="text-[14px] font-medium text-[var(--color-text-muted)]">Fiat Currency</label>
              <select
                value={fiatCurrency}
                onChange={(e) => setFiatCurrency(e.target.value)}
                className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl px-4 py-3.5 text-[16px] text-[var(--color-text-primary)] mt-1"
              >
                {fiatOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[14px] font-medium text-[var(--color-text-muted)]">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl px-4 py-3.5 text-[16px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] mt-1"
              />
            </div>

            <div>
              <label className="text-[14px] font-medium text-[var(--color-text-muted)]">Crypto to receive</label>
              <select
                value={cryptoCurrency}
                onChange={(e) => setCryptoCurrency(e.target.value)}
                className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl px-4 py-3.5 text-[16px] text-[var(--color-text-primary)] mt-1"
              >
                {cryptoOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[14px] font-medium text-[var(--color-text-muted)]">Payment Method</label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 border rounded-xl py-3.5 text-[16px] ${
                    paymentMethod === 'card' ? 'border-brass bg-brass/10 text-brass' : 'border-[var(--color-line)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <CreditCard size={18} /> Card
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex items-center justify-center gap-2 border rounded-xl py-3.5 text-[16px] ${
                    paymentMethod === 'bank' ? 'border-brass bg-brass/10 text-brass' : 'border-[var(--color-line)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <Wallet size={18} /> Bank Transfer
                </button>
              </div>
            </div>

            {error && <p className="text-[14px] text-[var(--color-danger)] font-mono">{error}</p>}

            <button
              onClick={generateMoonPayUrl}
              disabled={loading}
              className="w-full bg-brass hover:bg-brassLight disabled:opacity-50 text-void font-semibold rounded-xl py-3.5 press-soft touch-target text-[16px]"
            >
              {loading ? 'Generating...' : 'Continue to Payment'}
            </button>
          </div>
        ) : (
          // MoonPay Widget (iframe)
          <div className="relative w-full h-[600px]">
            <iframe
              src={widgetUrl}
              className="w-full h-full rounded-xl border-0"
              allow="payment"
            />
          </div>
        )}
      </div>
    </div>
  );
}
