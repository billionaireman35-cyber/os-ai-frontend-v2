import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003/api';

export default function RecoverPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recovery_phrase: recoveryPhrase.trim(),
          new_password: newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Password recovery failed.');
      }
      setDone(true);
    } catch (err) {
      setError(err.message || 'Password recovery failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">Password reset</p>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Your password has been changed. You've been signed out of all other sessions.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full justify-center text-[16px]"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display font-bold text-3xl text-[var(--text-primary)]">Reset password</p>
          <p className="text-sm text-[var(--text-muted)] font-mono mt-1">enter your recovery phrase</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && (
            <p className="text-sm text-[var(--danger)] font-mono">{error}</p>
          )}
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
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">Recovery Phrase</label>
            <textarea
              value={recoveryPhrase}
              onChange={(e) => setRecoveryPhrase(e.target.value)}
              className="input-base mt-1 min-h-[80px]"
              placeholder="Enter your 12-word recovery phrase, separated by spaces"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wide">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-5">
          Remembered your password?{' '}
          <Link to="/login" className="text-[var(--accent-indigo)] hover:text-[var(--accent-hover)] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
