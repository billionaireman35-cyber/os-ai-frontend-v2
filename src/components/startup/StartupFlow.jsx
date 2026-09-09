import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OsAiMark } from '../ui/OsAiMark';
import { useAuth } from '../../context/AuthContext';

const WELCOME_SEEN_KEY = 'os-ai-welcome-seen';

export function StartupFlow() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState('splash');

  useEffect(() => {
    if (loading) return;

    if (user) {
      navigate('/', { replace: true });
      return;
    }

    const seen = localStorage.getItem(WELCOME_SEEN_KEY) === '1';

    if (seen) {
      navigate('/login', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setPhase('welcome');
    }, 1800);

    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  if (loading || user) {
    return (
      <div className="startup-screen startup-splash">
        <div className="startup-center">
          <div className="startup-logo-shell startup-logo-large">
            <OsAiMark size={82} />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'splash') {
    return (
      <div className="startup-screen startup-splash">

        <div className="startup-center">
          <div className="startup-logo-shell startup-logo-large">
            <OsAiMark size={116} />
          </div>

          <div className="startup-wordmark">OS AI</div>

          <div className="startup-loading">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="startup-footer">
          Intelligence · Infrastructure · Utility
        </div>
      </div>
    );
  }

  const enterApp = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    navigate('/login', { replace: true });
  };

  return (
    <div className="startup-screen startup-welcome">

      <div className="welcome-content">
        <div className="welcome-brand">
          <div className="startup-logo-shell">
            <OsAiMark size={48} />
          </div>
          <span>OS AI</span>
        </div>

        <div className="welcome-copy">
          <div className="welcome-eyebrow">
            THE OS AI ECOSYSTEM
          </div>

          <h1>
            Intelligence,
            <br />
            <span>connected.</span>
          </h1>

          <p className="welcome-lead">
            Intelligence, digital services, and your digital economy —
            connected in one place.
          </p>

          <div className="welcome-features">

            <div className="welcome-feature">
              <div className="welcome-feature-icon">
                <OsAiMark size={22} />
              </div>

              <div>
                <strong>OS AI</strong>
                <p>
                  AI intelligence and digital services built for your
                  everyday world.
                </p>
              </div>
            </div>

            <div className="welcome-feature">
              <div className="welcome-feature-icon">
                ◇
              </div>

              <div>
                <strong>OS Vault</strong>
                <p>
                  Your non-custodial digital wallet for managing assets
                  and transactions.
                </p>
              </div>
            </div>

            <div className="welcome-feature">
              <div className="welcome-feature-icon">
                C
              </div>

              <div>
                <strong>CLOSE</strong>
                <p>
                  The native digital asset powering utility across the
                  OS AI ecosystem.
                </p>
              </div>
            </div>

          </div>

          <button
            type="button"
            className="welcome-button"
            onClick={enterApp}
          >
            <span>Get Started</span>
            <span className="welcome-arrow">→</span>
          </button>

          <div className="welcome-note">
            Built around intelligence, utility and user ownership.
          </div>
        </div>
      </div>
    </div>
  );
}
