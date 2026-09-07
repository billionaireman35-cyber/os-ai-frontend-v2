import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePushSubscription } from '../../hooks/usePushSubscription';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  usePushSubscription(user);

  if (loading) {
    return (
      <div className="startup-screen startup-splash">
        <div className="startup-center">
          <div className="startup-logo-shell startup-logo-large">
            <svg
              width="82"
              height="82"
              viewBox="0 0 100 100"
              fill="none"
              aria-label="OS AI"
            >
              <path
                d="M 50 18 L 82 78 L 18 78 Z"
                fill="none"
                stroke="#F97316"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    const welcomeSeen =
      localStorage.getItem('os-ai-welcome-seen') === '1';

    return (
      <Navigate
        to={welcomeSeen ? '/login' : '/welcome'}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}
