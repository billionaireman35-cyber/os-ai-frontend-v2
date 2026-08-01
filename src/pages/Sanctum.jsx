import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sanctum() {
  const { user } = useAuth();
  if (user?.stake_tier !== 'founder' && !user?.is_founder) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-4 tablet:p-6 space-y-6">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Founder Sanctum</h1>
      <div className="grid grid-cols-2 landscape:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase">Total burned</p>
          <p className="text-2xl font-mono text-[var(--accent-brass)]">1.2B CLOSE</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase">Active users</p>
          <p className="text-2xl font-mono text-[var(--text-primary)]">3,451</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase">Swap fees</p>
          <p className="text-2xl font-mono text-[var(--text-primary)]">$12,430</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-[var(--text-muted)] font-mono uppercase">Treasury</p>
          <p className="text-2xl font-mono text-[var(--text-primary)]">4.2M CLOSE</p>
        </div>
      </div>
      <div className="glass-card p-5 border-[var(--accent-teal)]/25">
        <p className="text-sm text-[var(--accent-teal)] font-mono uppercase tracking-wide">Live deflation</p>
        <p className="text-3xl font-mono text-[var(--text-primary)] mt-1">2,345 CLOSE burned today</p>
      </div>
    </div>
  );
}
