import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivacyTerms() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="p-4 tablet:p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Privacy & Terms</h1>
      <div className="glass-card p-6 space-y-4">
        <div>
          <h2 className="text-[var(--accent-brass)] font-semibold text-lg">Privacy Policy</h2>
          <p className="text-[var(--text-primary)] text-base leading-relaxed mt-1">
            OS AI respects your privacy. We only store data necessary for account management, wallet functionality, and AI memory (with your consent).
            Your private keys are encrypted locally and never leave your device. No third-party sharing without explicit permission.
          </p>
        </div>
        <div>
          <h2 className="text-[var(--accent-brass)] font-semibold text-lg">Terms of Service</h2>
          <p className="text-[var(--text-primary)] text-base leading-relaxed mt-1">
            By using OS AI you agree to the terms outlined in the OS AI Terms of Service. You are responsible for your wallet security and transactions.
            CLOSEAI Technologies is not liable for losses due to user error or smart contract risks.
          </p>
        </div>
        <p className="text-[var(--text-muted)] text-sm font-mono">Last updated: July 2026</p>
      </div>
    </div>
  );
}
