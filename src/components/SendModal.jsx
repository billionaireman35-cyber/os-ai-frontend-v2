import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SUPPORTED_TOKENS = [
  { symbol: 'CLOSE', address: null, chain: 'polygon', decimals: 18 },
  { symbol: 'MATIC', address: null, chain: 'polygon', decimals: 18 },
  { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', chain: 'polygon', decimals: 6 },
  { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', chain: 'polygon', decimals: 18 },
  // Add more tokens as needed
];

export default function SendModal({ isOpen, onClose, onSuccess }) {
  const { user, token } = useAuth();
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user || !isOpen) return;
    const fetchBalance = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/wallet/balance?chain=${selectedToken.chain}&address=${user.wallet_address}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        // The backend returns { balances: { polygon: 0.123, ... } }
        // We need to map to the token symbol; for simplicity, assume we have a map.
        // We'll just show the balance for the chain, but we can refine later.
        const bal = data.balances?.[selectedToken.chain] || 0;
        setBalance(bal);
      } catch (e) {
        setBalance(0);
      }
    };
    fetchBalance();
  }, [selectedToken, user, token, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!toAddress || !amount || !password) {
      toast.error('Please fill all fields');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          chain: selectedToken.chain,
          to_address: toAddress,
          amount: parseFloat(amount),
          token_address: selectedToken.address,  // null for native
          password: password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Transaction sent! Hash: ${data.tx_hash.slice(0, 10)}...`);
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(data.detail || 'Transaction failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Send Token</h2>
        <form onSubmit={handleSend}>
          <div className="mb-4">
            <label className="block text-sm font-medium">Token</label>
            <select
              value={selectedToken.symbol}
              onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value) || SUPPORTED_TOKENS[0])}
              className="w-full p-2 border rounded dark:bg-gray-800"
            >
              {SUPPORTED_TOKENS.map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.symbol} ({t.chain})</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">Balance: {balance} {selectedToken.symbol}</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Recipient Address</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800"
              placeholder="0x..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Amount</label>
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800"
              placeholder="0.0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Wallet Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-800"
              placeholder="••••••••"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
