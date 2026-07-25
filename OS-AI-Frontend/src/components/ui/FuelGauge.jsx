import { useAuth } from '../../context/AuthContext';

export function FuelGauge() {
  const { user } = useAuth();
  const balance = user?.close_balance ?? 0;
  const tier = user?.stake_tier || 'guest';
  const max = 500;
  const percent = Math.min((balance / max) * 100, 100);
  const color = percent > 70 ? 'bg-teal' : percent > 30 ? 'bg-brass' : 'bg-alert';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden tablet:block text-[11px] font-mono text-muted">
        <span className="text-bone">{balance}</span> CLOSE
      </div>
      <div className="w-20 tablet:w-28 h-1.5 bg-line rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-line text-muted capitalize">
        {tier}
      </div>
    </div>
  );
}
