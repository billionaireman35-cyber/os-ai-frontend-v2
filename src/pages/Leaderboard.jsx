import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Trophy, Loader2 } from 'lucide-react';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userTotal, setUserTotal] = useState(0);
  const [userReward, setUserReward] = useState(0);
  const [pool, setPool] = useState(0);
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/leaderboard/monthly?limit=150');
        setLeaderboard(res.data.leaderboard || []);
        setUserRank(res.data.user_rank);
        setUserTotal(res.data.user_total_burned || 0);
        setUserReward(res.data.user_reward || 0);
        setPool(res.data.pool || 0);
        setMonth(res.data.month || '');
        setError(null);
      } catch (e) {
        console.error('Leaderboard error:', e);
        const msg = e.response?.data?.detail || e.message || 'Could not load leaderboard';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-primary)]">
        <Loader2 size={32} className="animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-yellow-400">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 underline text-[#d4af37]">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-full">
      <div className="flex items-center gap-3">
        <Trophy size={32} className="text-[#d4af37]" />
        <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        {month} – Top 150 CLOSE burners share {pool} CLOSE reward pool
      </p>
      {user && (
        <div className="glass-card p-4 border border-[#d4af37]/30 flex items-center justify-between">
          <div>
            <p className="font-bold">{user.name || 'You'}</p>
            <p className="text-sm text-[var(--text-muted)]">Your rank</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono text-[#d4af37]">#{userRank || '—'}</p>
            <p className="text-sm text-[var(--text-muted)]">{userTotal} CLOSE burned</p>
            {userRank && userRank <= 150 && (
              <p className="text-xs text-green-400">🏆 Reward: {userReward} CLOSE</p>
            )}
          </div>
        </div>
      )}
      {leaderboard.length === 0 ? (
        <div className="text-center text-[var(--text-muted)] py-10">No burns yet. Be the first!</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((item) => (
            <div key={item.user_id} className="glass-card p-3 flex items-center justify-between border border-[var(--border-color)] hover:border-[#d4af37]/30 transition-all rounded-xl">
              <div className="flex items-center gap-3">
                <span className="w-8 text-center text-xl">
                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '#'}
                </span>
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.total_burned} CLOSE burned</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[#d4af37]">{item.total_burned} CLOSE</p>
                {item.reward > 0 && <p className="text-xs text-green-400">🏆 +{item.reward} CLOSE</p>}
                <p className="text-xs text-[var(--text-muted)]">#{item.rank}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
