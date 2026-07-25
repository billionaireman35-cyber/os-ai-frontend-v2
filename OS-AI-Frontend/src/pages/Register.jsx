import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, name, code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-void flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display font-semibold text-2xl text-bone">OS AI</p>
          <p className="text-[13px] text-muted font-mono mt-1">create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="ledger-card p-6 space-y-4">
          <div>
            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
              placeholder="Your name"
            />
          </div>
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
          <div>
            <label className="text-[11px] text-muted font-mono uppercase tracking-wide">Verification code</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
              placeholder="sent to your email"
            />
          </div>

          {error && <p className="text-[12px] text-alert font-mono">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-brass hover:bg-brassLight disabled:opacity-50 text-void text-[14px] font-semibold rounded-md py-2.5 press-soft touch-target"
          >
            <Fingerprint size={16} />
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-[13px] text-muted mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-brass hover:text-brassLight font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
