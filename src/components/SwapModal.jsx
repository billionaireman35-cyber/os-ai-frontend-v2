import { useState, useEffect } from 'react';
import { X, ArrowUpDown, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { ethers } from 'ethers';
import { TOKENS } from '../utils/tokens';
import { signSend, broadcastTx } from '../utils/ethers';

export function SwapModal({ isOpen, onClose, onSwap }) {
  const [chain, setChain] = useState('polygon');
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [step, setStep] = useState('input'); // 'input' | 'quote' | 'confirm' | 'done'

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const tokens = TOKENS[chain] || [];
      if (tokens.length > 0) {
        setFromToken(tokens[0].address);
        setToToken(tokens[1]?.address || tokens[0].address);
      }
      setAmount('');
      setQuote(null);
      setError(null);
      setTxHash(null);
      setStep('input');
    }
  }, [isOpen, chain]);

  const getSymbol = (address) => {
    const tokens = TOKENS[chain] || [];
    const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
    return token ? token.symbol : address.slice(0, 6);
  };

  const getDecimals = (address) => {
    const tokens = TOKENS[chain] || [];
    const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
    return token ? token.decimals : 18;
  };

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const decimals = getDecimals(fromToken);
      const amountInWei = ethers.utils.parseUnits(amount, decimals).toString();
      const res = await api.post('/swap/quote', {
        from_token: fromToken,
        to_token: toToken,
        amount: parseFloat(amount),
        chain,
        slippage: 0.5,
      });
      setQuote(res.data);
      setStep('quote');
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote) return;
    const password = prompt('Enter your wallet password to sign the swap:');
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      // Get encrypted seed
      const seedRes = await api.get('/wallet/seed');
      const encryptedSeed = seedRes.data.encrypted_seed;

      // Build transaction from 1inch
      const buildRes = await api.post('/swap/build', {
        chain,
        from_address: seedRes.data.address, // we need wallet address
        quote: quote.quote,
      });

      const txData = buildRes.data;
      // Sign and broadcast
      const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_POLYGON_RPC);
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedSeed, password);
      const signer = wallet.connect(provider);
      const tx = {
        to: txData.to,
        data: txData.data,
        value: txData.value || '0x0',
        gasLimit: txData.gas,
        gasPrice: txData.gasPrice,
      };
      const signedTx = await signer.signTransaction(tx);
      const broadcastRes = await broadcastTx(signedTx, chain);
      setTxHash(broadcastRes.tx_hash);
      setStep('done');
      onSwap?.(broadcastRes.tx_hash);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (e) {
      setError(e.message || 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tokens = TOKENS[chain] || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-panel2)] border border-[var(--color-line)] rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[16px] font-display text-[var(--color-text-primary)]">Swap Tokens</h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] touch-target">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Chain</label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] mt-1"
          >
            <option value="polygon">Polygon</option>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="base">Base</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">From</label>
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] mt-1"
          >
            {tokens.map((t) => (
              <option key={t.address} value={t.address}>{t.symbol}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">To</label>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] mt-1"
          >
            {tokens.map((t) => (
              <option key={t.address} value={t.address}>{t.symbol}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] mt-1 focus:outline-none focus:border-brass"
            placeholder="0.0"
          />
        </div>

        {step === 'input' && (
          <button
            onClick={getQuote}
            disabled={loading}
            className="w-full bg-brass hover:bg-brassLight disabled:opacity-50 text-void font-semibold rounded-md py-2.5 press-soft touch-target"
          >
            {loading ? 'Getting quote…' : 'Get Quote'}
          </button>
        )}

        {step === 'quote' && quote && (
          <div className="ledger-card p-3 space-y-1 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Output</span>
              <span className="text-[var(--color-text-primary)] font-mono">
                {quote.amount_out} {getSymbol(toToken)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Fee</span>
              <span className="text-brass font-mono">${quote.fee_usd.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Slippage</span>
              <span className="text-[var(--color-text-primary)] font-mono">{quote.slippage}%</span>
            </div>
            <button
              onClick={executeSwap}
              disabled={loading}
              className="w-full bg-brass hover:bg-brassLight disabled:opacity-50 text-void font-semibold rounded-md py-2.5 press-soft touch-target mt-2"
            >
              {loading ? 'Swapping…' : 'Confirm Swap'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-2">
            <p className="text-[var(--color-success)] text-[14px] font-medium">✅ Swap executed!</p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-mono break-all">Tx: {txHash}</p>
          </div>
        )}

        {error && <p className="text-[12px] text-[var(--color-danger)] font-mono">{error}</p>}
      </div>
    </div>
  );
}
