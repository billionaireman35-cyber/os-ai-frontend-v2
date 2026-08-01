import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Wallet() {
  const { wallet, setWallet } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const connectMockWallet = () => {
    setWallet({
      connected: true,
      address: '0x8A14...3B92',
      chain: 'Polygon',
      balance: '1,240.50'
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <WalletIcon className="text-[#d4af37]" size={24} /> OS Vault
          </h1>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Multi-chain non-custodial asset hub</p>
        </div>
        {!wallet.connected ? (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl text-xs md:text-sm hover:bg-[#b5942f] transition-all"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-[#111111] border border-[#d4af37]/30 rounded-xl text-xs font-mono text-[#d4af37]">
            {wallet.address}
          </div>
        )}
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Total Balance</span>
        <h2 className="text-3xl font-extrabold text-white mt-1">
          ${wallet.connected ? wallet.balance : '0.00'} <span className="text-[#d4af37] text-lg font-normal">USD</span>
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex flex-col items-center gap-2 bg-[#111111] border border-white/10 p-4 rounded-xl hover:border-[#d4af37]/40 transition-all text-white">
          <ArrowUpRight size={20} className="text-red-400" />
          <span className="text-xs font-medium">Send</span>
        </button>
        <button className="flex flex-col items-center gap-2 bg-[#111111] border border-white/10 p-4 rounded-xl hover:border-[#d4af37]/40 transition-all text-white">
          <ArrowDownLeft size={20} className="text-emerald-400" />
          <span className="text-xs font-medium">Receive</span>
        </button>
        <button className="flex flex-col items-center gap-2 bg-[#111111] border border-white/10 p-4 rounded-xl hover:border-[#d4af37]/40 transition-all text-white">
          <RefreshCw size={20} className="text-blue-400" />
          <span className="text-xs font-medium">Swap</span>
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Select Provider</h3>
            <button
              onClick={connectMockWallet}
              className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4af37] text-left text-sm text-white"
            >
              <span>🦊</span> MetaMask
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="w-full py-2 bg-white/5 text-gray-400 text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
