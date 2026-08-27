import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003/api';
const GOOGLE_CLIENT_ID = '133012523516-vl47c0e3fn1vbop855g0pbdvhouh08or.apps.googleusercontent.com';

export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const googleButtonRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeSending, setCodeSending] = useState(false);

  useEffect(() => {
    if (!window.google || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setError('');
        try {
          await loginWithGoogle(response.credential);
          navigate('/');
        } catch (err) {
          setError(err.response?.data?.detail || 'Google sign-up failed.');
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: 320,
      text: 'signup_with',
    });
  }, []);

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setCodeSending(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'verification' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send code.');
      }
      if (data.code) {
        setVerificationCode(data.code);
      }
      setCodeSent(true);
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setCodeSending(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          verification_code: verificationCode,
          fingerprint: 'web_' + Date.now(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }
      localStorage.setItem('token', data.token);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display font-bold text-3xl text-[var(--text-primary)]">OS AI</p>
          <p className="text-sm text-[var(--text-muted)] font-mono mt-1">create your account</p>
        </div>

        <div ref={googleButtonRef} className="flex justify-center mb-4" />

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs text-[var(--text-muted)] font-mono uppercase">or</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        <form onSubmit={handleRegister} className="glass-card p-6 space-y-4">
          {error && (
            <p className="text-sm text-[var(--danger)] font-mono">{error}</p>
          )}
          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base mt-1"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Email</label>
            <div className="flex gap-2 mt-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base flex-1"
                placeholder="you@example.com"
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={codeSending || codeSent}
                className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
              >
                {codeSending ? 'Sending...' : codeSent ? 'Sent ✓' : 'Send Code'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base mt-1"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              className="input-base mt-1"
              placeholder="6-digit code"
              required
              maxLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !codeSent}
            className="btn-primary w-full justify-center text-[16px] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
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
