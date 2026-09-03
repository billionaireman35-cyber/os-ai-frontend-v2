import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { OsAiMark } from '../ui/OsAiMark';
import { usePushSubscription } from '../../hooks/usePushSubscription';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  usePushSubscription(user);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center">
        <OsAiMark size={64} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
