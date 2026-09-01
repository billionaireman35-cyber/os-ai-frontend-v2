import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003/api';
const GOOGLE_CLIENT_ID = '133012523516-vl47c0e3fn1vbop855g0pbdvhouh08or.apps.googleusercontent.com';

export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const googleButtonRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set once registration succeeds - switches the whole page into the
  // "save your recovery phrase" step instead of navigating away
  // immediately. The phrase is only ever returned by the API this one
  // time (see auth.py /register) - if the user leaves without seeing
  // it, their account has no password-recovery path at all.
  const [recoveryPhrase, setRecoveryPhrase] = useState(null);
  const [pendingToken, setPendingToken] = useState(null);
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!window.google || !googleButtonRef.current || recoveryPhrase) return;

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
  }, [recoveryPhrase]);

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
          fingerprint: 'web_' + Date.now(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }
      // Hold the token and show the recovery phrase before actually
      // logging the user in - this is the only time it's ever shown.
      setPendingToken(data.token);
      if (data.recovery_phrase) {
        setRecoveryPhrase(data.recovery_phrase);
      } else {
        localStorage.setItem('token', data.token);
        navigate('/chat');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPhrase = () => {
    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishSignup = () => {
    localStorage.setItem('token', pendingToken);
    navigate('/chat');
  };

  if (recoveryPhrase) {
    const words = recoveryPhrase.trim().split(/\s+/);
    return (
      <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent-brass)]/12 text-[var(--accent-brass-bright)] flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={20} />
            </div>
            <p className="text-xl font-display font-bold text-[var(--text-primary)]">Save your recovery phrase</p>
            <p className="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
              This is the <strong className="text-[var(--text-secondary)]">only</strong> way to reset your password.
              It's shown once and never again — write it down or save it somewhere safe.
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {words.map((word, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] rounded-lg px-2.5 py-2"
                >
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{i + 1}</span>
                  <span className="text-[13px] text-[var(--text-primary)] font-mono">{word}</span>
                </div>
              ))}
            </div>
            <button
              onClick={copyPhrase}
              className="btn-secondary w-full justify-center text-[13.5px]"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy phrase'}
            </button>
          </div>

          <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={phraseConfirmed}
              onChange={(e) => setPhraseConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              I've saved my recovery phrase somewhere safe. I understand OS AI cannot recover it for me if I lose it.
            </span>
          </label>

          <button
            onClick={finishSignup}
            disabled={!phraseConfirmed}
            className="btn-primary w-full justify-center text-[15px] mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to OS AI
          </button>
        </div>
      </div>
    );
  }

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
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base mt-1"
              placeholder="you@example.com"
              required
            />
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
          <button
            type="submit"
            disabled={loading}
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
