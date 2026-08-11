import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sanctum() {
  const { user } = useAuth();
  return (
    <div className="p-6 text-[var(--text-primary)]">
      <h1 className="text-2xl font-bold">Sanctum</h1>
      <p className="text-sm text-[var(--text-muted)] mt-2">Founder-only area</p>
      {user?.is_founder ? (
        <div className="mt-4 glass-card p-4 border border-[#d4af37]/30">
          <p>Welcome, Founder 👑</p>
          <p>CLOSE Balance: {user.close_balance}</p>
        </div>
      ) : (
        <div className="mt-4 text-yellow-400">Access denied. You must be a founder.</div>
      )}
    </div>
  );
}
