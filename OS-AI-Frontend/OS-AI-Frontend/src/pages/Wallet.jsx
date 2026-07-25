import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { GlassCard } from '../components/ui/GlassCard';

export default function Wallet() {
  const { balances, totalUsd, loading } = useWallet();
  const [selectedChain, setSelectedChain] = useState('all');

  if (loading) return <div className="text-center py-10">Loading...</div>;

  const filtered = selectedChain === 'all' ? balances : balances.filter(b => b.chain === selectedChain);

  return (
    <div className="space-y-6">
      <div className="flex flex-col tablet:flex-row justify-between items-start tablet:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vault</h1>
          <p className="text-gray-400">Total Portfolio Value</p>
          <p className="text-3xl font-mono">${totalUsd.toFixed(2)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'polygon', 'ethereum', 'bsc', 'btc', 'arbitrum', 'base'].map((chain) => (
            <button
              key={chain}
              onClick={() => setSelectedChain(chain)}
              className={`px-4 py-2 rounded-full text-sm touch-target ${selectedChain === chain ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}
            >
              {chain.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 tablet:grid-cols-2 landscape:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="text-gray-400 col-span-full">No assets found.</p>
        ) : (
          filtered.map((asset, idx) => (
            <GlassCard key={idx} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{asset.symbol}</p>
                  <p className="text-sm text-gray-400">{asset.balance}</p>
                </div>
                <p className="font-mono">${asset.usdValue.toFixed(2)}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">Send</button>
                <button className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">Swap</button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
