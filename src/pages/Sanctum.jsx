import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';

export default function Sanctum() {
  const { user } = useAuth();
  if (user?.stake_tier !== 'founder' && !user?.is_founder) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-text-primary)]">Founder Sanctum</h1>
      <div className="grid grid-cols-2 landscape:grid-cols-4 gap-3">
        <GlassCard title="Total burned" value="1.2B CLOSE" accent />
        <GlassCard title="Active users" value="3,451" />
        <GlassCard title="Swap fees" value="$12,430" />
        <GlassCard title="Treasury" value="4.2M CLOSE" />
      </div>
      <div className="ledger-card p-5 border-teal/25">
        <p className="text-teal text-[12px] font-mono uppercase tracking-wide">Live deflation</p>
        <p className="text-3xl font-mono text-[var(--color-text-primary)] mt-1">2,345 CLOSE burned today</p>
      </div>
    </div>
  );
}
