import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Copy,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OsAiMark } from '../components/ui/OsAiMark';

const GOOGLE_CLIENT_ID =
  '133012523516-vl47c0e3fn1vbop855g0pbdvhouh08or.apps.googleusercontent.com';

export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const googleButtonRef = useRef(null);

  const [error, setError] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!window.google || !googleButtonRef.current || recoveryPhrase) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setError('');

        try {
          const data = await loginWithGoogle(response.credential);

          if (data?.recovery_phrase) {
            setPendingToken(data.token);
            setRecoveryPhrase(data.recovery_phrase);
          } else {
            navigate('/');
          }
        } catch (err) {
          setError(
            err.response?.data?.detail ||
              'Google sign-up failed.'
          );
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: 360,
      text: 'signup_with',
      shape: 'rectangular',
    });
  }, [recoveryPhrase, loginWithGoogle, navigate]);

  const copyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(recoveryPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Unable to copy the recovery phrase.');
    }
  };

  const finishSignup = () => {
    localStorage.setItem('token', pendingToken);
    navigate('/chat');
  };

  if (recoveryPhrase) {
    const words = recoveryPhrase.trim().split(/\s+/);

    return (
      <main className="auth-page">
        <div className="auth-background">
          <div className="auth-orb auth-orb-one" />
          <div className="auth-orb auth-orb-two" />
          <div className="auth-grid" />
        </div>

        <div className="auth-shell recovery-shell">
          <div className="auth-brand">
            <span className="auth-brand-mark">
              <OsAiMark size={34} animated={false} />
            </span>
            <span>OS AI</span>
          </div>

          <section className="auth-card recovery-card">
            <div className="auth-card-glow" />

            <div className="auth-header">
              <div className="recovery-icon">
                <ShieldAlert size={22} />
              </div>

              <div className="auth-kicker">SECURITY SETUP</div>

              <h1>Protect your account.</h1>

              <p>
                Your recovery phrase is shown once. Save it
                somewhere private and secure before continuing.
              </p>
            </div>

            <div className="recovery-warning">
              <LockKeyhole size={16} />
              <span>
                Anyone with this phrase may be able to recover
                access to your account.
              </span>
            </div>

            <div className="recovery-phrase">
              {words.map((word, i) => (
                <div className="recovery-word" key={i}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <strong>{word}</strong>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={copyPhrase}
              className="auth-secondary-button"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? 'Recovery phrase copied' : 'Copy recovery phrase'}
            </button>

            <label className="recovery-confirm">
              <input
                type="checkbox"
                checked={phraseConfirmed}
                onChange={(e) =>
                  setPhraseConfirmed(e.target.checked)
                }
              />

              <span className="recovery-checkbox">
                {phraseConfirmed && <Check size={12} />}
              </span>

              <span>
                I've saved my recovery phrase somewhere safe.
                I understand OS AI cannot recover it for me if
                I lose it.
              </span>
            </label>

            <button
              type="button"
              onClick={finishSignup}
              disabled={!phraseConfirmed}
              className="auth-primary-button"
            >
              <ShieldCheck size={18} />
              Continue to OS AI
              <ArrowRight size={17} />
            </button>
          </section>

          <p className="auth-legal">
            Keep your recovery phrase private. OS AI will never
            ask you to share it.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-background">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-grid" />
      </div>

      <div className="auth-shell">
        <Link to="/welcome" className="auth-brand">
          <span className="auth-brand-mark">
            <OsAiMark size={34} animated={false} />
          </span>
          <span>OS AI</span>
        </Link>

        <section className="auth-card">
          <div className="auth-card-glow" />

          <div className="auth-header">
            <div className="auth-icon">
              <ShieldCheck size={21} />
            </div>

            <div className="auth-kicker">JOIN THE ECOSYSTEM</div>

            <h1>Create your account.</h1>

            <p>
              Start with OS AI and unlock your connected
              intelligence experience.
            </p>
          </div>

          <div className="auth-switch">
            <Link to="/login" className="auth-switch-link">
              Log in
            </Link>

            <div className="auth-switch-active">
              Create account
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span />
              <p>{error}</p>
            </div>
          )}

          <div className="google-auth-wrap">
            <div ref={googleButtonRef} className="google-auth-button" />
          </div>

          <div className="auth-benefits">
            <div>
              <ShieldCheck size={15} />
              <span>Secure account setup</span>
            </div>

            <div>
              <LockKeyhole size={15} />
              <span>Privacy-focused by design</span>
            </div>
          </div>
        </section>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>

        <p className="auth-legal">
          By creating an account, you agree to use OS AI
          responsibly.
        </p>
      </div>
    </main>
  );
}
