import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setCodeError('Please enter a valid email address first.');
      return;
    }
    setSendingCode(true);
    setCodeError(null);
    try {
      await api.post('/auth/send-code', { email, purpose: 'verification' });
      setCodeSent(true);
      setCodeSuccess(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setCodeError(err.response?.data?.detail || 'Failed to send code. Try again.');
      setCodeSent(false);
    } finally {
      setSendingCode(false);
    }
  };

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
    <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display font-bold text-3xl text-[var(--text-primary)]">OS AI</p>
          <p className="text-sm text-[var(--text-muted)] font-mono mt-1">create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base mt-1"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Email</label>
            <div className="flex gap-2 mt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base flex-1"
                placeholder="you@domain.com"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="btn-secondary whitespace-nowrap text-sm"
              >
                {sendingCode ? 'Sending…' : countdown > 0 ? `${countdown}s` : 'Send Code'}
              </button>
            </div>
            {codeError && <p className="text-xs text-[var(--danger)] mt-1">{codeError}</p>}
            {codeSuccess && (
              <p className="text-xs text-[var(--success)] mt-1">
                ✅ Code sent to {email}. Check your inbox (and spam folder).
              </p>
            )}
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

          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Verification code</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-base mt-1"
              placeholder="6-digit code"
            />
          </div>

          {error && <p className="text-sm text-[var(--danger)] font-mono">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center text-[16px]"
          >
            <Fingerprint size={18} />
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent-indigo)] hover:text-[var(--accent-hover)] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
