import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-[var(--text-muted)] font-mono">Loading OS AI…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
