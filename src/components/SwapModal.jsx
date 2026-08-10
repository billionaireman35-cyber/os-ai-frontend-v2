import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowUpDown } from 'lucide-react';
import { api } from '../utils/api';

export function SwapModal({ isOpen, onClose, onSwap }) {
  const [fromToken, setFromToken] = useState('MATIC');
  const [toToken, setToToken] = useState('CLOSE');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);

  const tokens = ['MATIC', 'CLOSE', 'OSINA', 'USDC', 'WETH', 'DAI'];

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    const fetchQuote = async () => {
      setLoading(true);
      setError(null);
      try {
        const tokenMap = {
          MATIC: '0x0000000000000000000000000000000000001010',
          CLOSE: '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8',
          OSINA: '0xbaf280b74c264a911b41341a26508eac9e74fd4f',
          USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
          DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        };
        const fromAddr = tokenMap[fromToken] || tokenMap.MATIC;
        const toAddr = tokenMap[toToken] || tokenMap.CLOSE;
        const amountWei = (parseFloat(amount) * 1e18).toString();
        const res = await api.get(`/swap/quote?chain=polygon&fromTokenAddress=${fromAddr}&toTokenAddress=${toAddr}&amount=${amountWei}`);
        setQuote(res.data);
      } catch (e) {
        setError(e.response?.data?.detail || 'Failed to get quote');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [amount, fromToken, toToken]);

  const handleSwap = async () => {
    if (!quote) return;
    setExecuting(true);
    setError(null);
    try {
      const tokenMap = {
        MATIC: '0x0000000000000000000000000000000000001010',
        CLOSE: '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8',
        OSINA: '0xbaf280b74c264a911b41341a26508eac9e74fd4f',
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      };
      const fromAddr = tokenMap[fromToken];
      const toAddr = tokenMap[toToken];
      const amountWei = (parseFloat(amount) * 1e18).toString();
      const res = await api.post('/swap/swap', {
        chain: 'polygon',
        fromTokenAddress: fromAddr,
        toTokenAddress: toAddr,
        amount: amountWei,
        fromAddress: '',
        slippage: 1.0,
      });
      onSwap?.(res.data.tx_hash || 'swap_executed');
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || 'Swap execution failed');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  const outputAmount = quote?.toAmount ? (parseInt(quote.toAmount) / 1e18).toFixed(4) : '—';
  const fee = quote?.gasPrice ? (parseInt(quote.gasPrice) / 1e18 * 1e9).toFixed(6) : '0.0001';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ArrowUpDown size={24} className="text-[#d4af37]" /> Swap Tokens
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={24} /></button>
        </div>

        <div>
          <label className="text-sm text-[var(--text-muted)] font-mono uppercase tracking-wide">From</label>
          <div className="flex gap-2 mt-1">
            <select value={fromToken} onChange={(e) => setFromToken(e.target.value)} className="input-base flex-1">
              {tokens.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
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
          <select value={toToken} onChange={(e) => setToToken(e.target.value)} className="input-base w-full">
            {tokens.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {loading && <div className="text-sm text-[var(--text-muted)]">Getting quote...</div>}

        {quote && (
          <div className="glass-card p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Output</span>
              <span className="text-[var(--text-primary)] font-mono">{outputAmount} {toToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Fee</span>
              <span className="text-[var(--text-muted)]">${fee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Slippage</span>
              <span className="text-[var(--text-muted)]">0.5%</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)] font-mono">{error}</p>}

        <button
          onClick={handleSwap}
          disabled={!quote || executing || loading}
          className="btn-primary w-full justify-center gap-2"
          style={{ background: '#d4af37', color: 'black' }}
        >
          {executing ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Swap'}
        </button>
        <button onClick={onClose} className="btn-secondary w-full justify-center">Cancel</button>
      </div>
    </div>
  );
}
