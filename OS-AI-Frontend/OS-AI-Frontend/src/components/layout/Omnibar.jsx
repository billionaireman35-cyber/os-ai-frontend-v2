import { useAuth } from '../../context/AuthContext';
import { FuelGauge } from '../ui/FuelGauge';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export function Omnibar() {
  const { user } = useAuth();
  return (
    <header className="h-16 tablet:h-20 border-b border-white/5 flex items-center px-4 tablet:px-6 gap-4 bg-[#0B0D12]/80 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">OS AI</span>
        <span className="text-[10px] text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">v2</span>
      </div>
      <div className="hidden tablet:flex flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search tokens, news, addresses..."
          className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>
      <div className="flex-1 tablet:flex-none" />
      <FuelGauge />
      <button className="touch-target text-gray-400 hover:text-white relative">
        <BellIcon className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center">3</span>
      </button>
      <button className="touch-target text-gray-400 hover:text-white">
        <UserCircleIcon className="h-8 w-8" />
      </button>
    </header>
  );
}
