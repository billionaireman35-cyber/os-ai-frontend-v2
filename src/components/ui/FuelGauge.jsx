import { useAuth } from '../../context/AuthContext';

export function FuelGauge() {
  const { user } = useAuth();
  const balance = user?.close_balance || 0;
  const tier = user?.stake_tier || 'guest';
  const max = 500;
  const percent = Math.min((balance / max) * 100, 100);
  const color = percent > 70 ? 'bg-success' : percent > 30 ? 'bg-brass' : 'bg-danger';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden tablet:block text-xs text-[var(--color-text-muted)]">
        <span className="font-mono">{balance}</span> CLOSE
      </div>
      <div className="w-24 tablet:w-32 h-2 bg-[var(--color-line)] rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-panel)] border border-[var(--color-line)] text-[var(--color-text-secondary)]">
        {tier === 'none' ? 'Guest' : tier.charAt(0).toUpperCase() + tier.slice(1)}
      </div>
    </div>
  );
}
