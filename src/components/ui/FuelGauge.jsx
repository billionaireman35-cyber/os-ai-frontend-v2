import { useAuth } from '../../context/AuthContext';

export function FuelGauge() {
  const { user } = useAuth();
  const balance = user?.close_balance || 0;
  const tier = user?.stake_tier || 'guest';
  const max = 500;

  const percent = Math.min((balance / max) * 100, 100);
  const color = percent > 70 ? 'bg-green-500' : percent > 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="hidden tablet:block text-xs text-gray-400">
        <span className="font-mono">{balance}</span> CLOSE
      </div>
      <div className="w-24 tablet:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </div>
    </div>
  );
}
