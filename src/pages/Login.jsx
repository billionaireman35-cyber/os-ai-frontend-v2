import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="min-h-screen w-full bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display font-semibold text-2xl text-bone">OS AI</p>
          <p className="text-[13px] text-muted font-mono mt-1">sign in to OS AI</p>
        </div>

        <form onSubmit={handleSubmit} className="ledger-card p-6 space-y-4">
          <div>
            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
              placeholder="you@domain.com"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[12px] text-alert font-mono">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-brass hover:bg-brassLight disabled:opacity-50 text-void text-[14px] font-semibold rounded-md py-2.5 press-soft touch-target"
          >
            <Fingerprint size={16} />
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[13px] text-muted mt-5">
          New here?{' '}
          <Link to="/register" className="text-brass hover:text-brassLight font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
