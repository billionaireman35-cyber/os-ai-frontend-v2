import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint, Mail } from 'lucide-react';
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

  // Verification code states
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
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 flex-1 bg-panel2 border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
                placeholder="you@domain.com"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="mt-1 px-3 py-2.5 bg-brass/20 hover:bg-brass/30 text-brass text-[12px] font-medium rounded-md disabled:opacity-50 transition-colors touch-target"
              >
                {sendingCode ? 'Sending…' : countdown > 0 ? `${countdown}s` : 'Send Code'}
              </button>
            </div>
            {codeError && <p className="text-[11px] text-alert mt-1">{codeError}</p>}
            {codeSuccess && (
              <p className="text-[11px] text-teal mt-1">
                ✅ Code sent to {email}. Check your inbox (and spam folder).
              </p>
            )}
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
              placeholder="6-digit code"
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