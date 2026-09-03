import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OsAiMark } from '../components/ui/OsAiMark';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!window.google || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: '133012523516-vl47c0e3fn1vbop855g0pbdvhouh08or.apps.googleusercontent.com',
      callback: async (response) => {
        setError(null);
        try {
          await loginWithGoogle(response.credential);
          navigate('/');
        } catch (err) {
          setError(err.response?.data?.detail || 'Google sign-in failed.');
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: 320,
      text: 'continue_with',
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <OsAiMark size={48} animated={false} />
          </div>
          <p className="text-2xl font-display font-bold text-[var(--text-primary)]">Welcome back.</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed max-w-[300px] mx-auto">
            Sign back in to pick up right where you left off.
          </p>
        </div>

        {error && (
          <p className="text-sm text-[var(--danger)] font-mono text-center mb-3">{error}</p>
        )}

        <div ref={googleButtonRef} className="flex justify-center" />

        {!showEmailForm && (
          <p className="text-center text-sm text-[var(--text-muted)] mt-5">
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="text-[var(--accent-indigo)] hover:text-[var(--accent-hover)] font-medium"
            >
              Sign in with email instead
            </button>
          </p>
        )}

        {showEmailForm && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--border-color)]" />
              <span className="text-xs text-[var(--text-muted)] font-mono uppercase">or</span>
              <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base mt-1"
                  placeholder="you@domain.com"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base mt-1"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center text-[16px]"
              >
                <Fingerprint size={18} />
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="text-center text-xs">
                <Link to="/recover-password" className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  Forgot password?
                </Link>
              </p>
            </form>
          </>
        )}

        <p className="text-center text-sm text-[var(--text-muted)] mt-5">
          New here?{' '}
          <Link to="/register" className="text-[var(--accent-indigo)] hover:text-[var(--accent-hover)] font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
