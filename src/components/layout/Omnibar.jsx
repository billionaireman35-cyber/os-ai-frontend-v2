import { FuelGauge } from '../ui/FuelGauge';
import { UserProfileDropdown } from '../ui/UserProfileDropdown';
import { Bell, Circle } from 'lucide-react';
import { WalletConnectButton } from '../components/WalletConnectButton';

// Inside the header, near the bell icon:
<WalletConnectButton />

export function Omnibar() {
  return (
    <div className="shrink-0">
      <header className="h-14 border-b border-line flex items-center justify-between px-4 tablet:px-5 bg-void">
        <div className="hidden tablet:flex flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search tokens, addresses, news…"
            className="w-full bg-panel border border-line rounded-md px-3 py-1.5 text-[13px] text-bone placeholder-muted focus:outline-none focus:border-brass"
          />
        </div>
        <div className="flex-1 tablet:hidden" />
        <div className="flex items-center gap-3">
          <div className="hidden tablet:flex items-center gap-2 text-[11px] font-mono px-2.5 py-1 rounded-full bg-teal/10 text-teal">
            <Circle size={7} fill="currentColor" strokeWidth={0} className="animate-pulse" />
            connected
          </div>
          <FuelGauge />
          <button className="touch-target text-muted hover:text-bone relative">
            <Bell size={19} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-alert rounded-full" />
          </button>
          <UserProfileDropdown />
        </div>
      </header>
    </div>
  );
}