import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';

export default function Sanctum() {
  const { user } = useAuth();
  if (user?.stake_tier !== 'founder' && !user?.is_founder) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Founder Sanctum</h1>
      <div className="grid grid-cols-2 landscape:grid-cols-4 gap-4">
        <GlassCard title="Total Burned" value="1.2B CLOSE" />
        <GlassCard title="Active Users" value="3,451" />
        <GlassCard title="Swap Fees" value="$12,430" />
        <GlassCard title="Treasury" value="4.2M CLOSE" />
      </div>
      <div className="p-6 glass-soft border border-purple-500/30">
        <p className="text-purple-300 text-sm">🔥 LIVE DEFLATION</p>
        <p className="text-4xl font-mono">2,345 CLOSE burned today</p>
      </div>
    </div>
  );
}
