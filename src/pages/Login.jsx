import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OsAiMark } from '../components/ui/OsAiMark';

const GOOGLE_CLIENT_ID =
  '133012523516-vl47c0e3fn1vbop855g0pbdvhouh08or.apps.googleusercontent.com';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Login failed. Check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!window.google || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setError(null);

        try {
          await loginWithGoogle(response.credential);
          navigate('/');
        } catch (err) {
          setError(
            err.response?.data?.detail ||
              'Google sign-in failed.'
          );
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: 360,
      text: 'continue_with',
      shape: 'rectangular',
    });
  }, [loginWithGoogle, navigate]);

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

            <div className="auth-kicker">PRIVATE INTELLIGENCE</div>

            <h1>Welcome back.</h1>

            <p>
              Sign in to continue your intelligence,
              workspace and digital services.
            </p>
          </div>

          <div className="auth-switch">
            <div className="auth-switch-active">Log in</div>

            <Link to="/register" className="auth-switch-link">
              Create account
            </Link>
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

          <div className="auth-divider">
            <span />
            <b>or continue with email</b>
            <span />
          </div>

          {!showEmailForm ? (
            <button
              type="button"
              className="auth-email-trigger"
              onClick={() => setShowEmailForm(true)}
            >
              <span className="auth-email-trigger-left">
                <Mail size={17} />
                <span>Continue with email</span>
              </span>
              <ArrowRight size={17} />
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>

                <div className="auth-input-wrap">
                  <Mail size={17} />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password">Password</label>

                  <Link to="/recover-password">
                    Forgot password?
                  </Link>
                </div>

                <div className="auth-input-wrap">
                  <LockKeyhole size={17} />

                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="auth-primary-button"
              >
                {submitting ? (
                  <>
                    <span className="auth-spinner" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    Sign in securely
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-security-note">
            <LockKeyhole size={14} />
            <span>Your session is protected by OS AI security.</span>
          </div>
        </section>

        <p className="auth-footer">
          New to OS AI?{' '}
          <Link to="/register">Create your account</Link>
        </p>

        <p className="auth-legal">
          By continuing, you agree to use OS AI responsibly.
        </p>
      </div>
    </main>
  );
}
