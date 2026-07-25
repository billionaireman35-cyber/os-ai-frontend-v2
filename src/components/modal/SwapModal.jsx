import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';
import { ethers } from 'ethers';
import { signSend, broadcastTx } from '../../utils/ethers';

// Token list – we'll maintain for each chain
// Polygon tokens
const TOKENS = {
  polygon: [
    { symbol: 'MATIC', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, native: true },
    { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { symbol: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
    { symbol: 'CLOSE', address: '0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8', decimals: 18 },
    { symbol: 'OSINA', address: '0xbaf280b74c264a911b41341a26508eac9e74fd4f', decimals: 18 },
  ],
  ethereum: [
    { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, native: true },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  ],
  bsc: [
    { symbol: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, native: true },
    { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 6 },
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 6 },
  ],
  arbitrum: [
    { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, native: true },
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  ],
  base: [
    { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, native: true },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  ],
};

export function SwapModal({ isOpen, onClose, onSwap }) {
  const [fromToken, setFromToken] = useState('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'); // native
  const [toToken, setToToken] = useState('0x3c6833cFDdED80fE76474a3Cb2Cc050Daec91fe8'); // CLOSE
  const [amount, setAmount] = useState('');
  const [chain, setChain] = useState('polygon');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const getTokenSymbol = (address, chain) => {
    const tokens = TOKENS[chain] || [];
    const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
    return token ? token.symbol : address.slice(0, 6);
  };

  const getTokenDecimals = (address, chain) => {
    const tokens = TOKENS[chain] || [];
    const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
    return token ? token.decimals : 18;
  };

  const fetchQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const res = await api.post('/swap/quote', {
        from_token: fromToken,
        to_token: toToken,
        amount: parseFloat(amount),
        chain,
        slippage: 0.5,
      });
      setQuote(res.data);
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
        from_address: seedRes.data.address, // we need to get wallet address from user
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-panel2 border border-line rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[16px] font-display text-bone">Swap Tokens</h3>
          <button onClick={onClose} className="text-muted hover:text-bone touch-target">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Chain</label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
          >
            <option value="polygon">Polygon</option>
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="base">Base</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] text-muted font-mono uppercase tracking-wide">From</label>
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
          >
            {TOKENS[chain]?.map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-muted font-mono uppercase tracking-wide">To</label>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone"
          >
            {TOKENS[chain]?.map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
            placeholder="0.0"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchQuote}
            disabled={loading}
            className="flex-1 bg-brass/20 hover:bg-brass/30 text-brass text-[13px] font-semibold rounded-md py-2.5 press-soft touch-target"
          >
            {loading ? 'Loading…' : 'Get Quote'}
          </button>
        </div>

        {quote && (
          <div className="ledger-card p-3 space-y-1 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted">Output</span>
              <span className="text-bone">{quote.amount_out} {getTokenSymbol(toToken, chain)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fee</span>
              <span className="text-brass">${quote.fee_usd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Slippage</span>
              <span className="text-bone">{quote.slippage}%</span>
            </div>
            <button
              onClick={executeSwap}
              disabled={loading}
              className="w-full bg-brass hover:bg-brassLight disabled:opacity-50 text-void font-semibold rounded-md py-2.5 press-soft touch-target mt-2"
            >
              {loading ? 'Swapping…' : 'Swap'}
            </button>
          </div>
        )}

        {error && <p className="text-[12px] text-alert font-mono">{error}</p>}
        {txHash && <p className="text-[12px] text-teal font-mono">✅ Tx: {txHash}</p>}
      </div>
    </div>
  );
}