import { FuelGauge } from '../ui/FuelGauge';
import { UserProfileDropdown } from '../ui/UserProfileDropdown';
import { Bell, Circle } from 'lucide-react';

export function Omnibar() {
  return (
    <div className="shrink-0">
      <header className="h-14 border-b border-[var(--color-line)] flex items-center justify-between px-4 tablet:px-5 bg-[var(--color-bg)]">
        <div className="flex-1 tablet:hidden" />
        <div className="flex items-center gap-3">
          <FuelGauge />
          <button className="touch-target text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] relative">
            <Bell size={19} />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-[var(--color-danger)] rounded-full" />
          </button>
          <UserProfileDropdown />
        </div>
      </header>
    </div>
  );
}
