import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Trophy, Loader2, Medal } from 'lucide-react';

const PODIUM_STYLES = {
  1: {
    avatarBorder: 'border-[#FFD700]',
    avatarBg: 'bg-[#FFD700]/10',
    avatarText: 'text-[#FFD700]',
    barBg: 'bg-gradient-to-b from-[#FFD700]/20 to-[#FFD700]/5',
    barBorder: 'border-[#FFD700]/35',
    barText: 'text-[#FFD700]',
    height: 'h-24',
  },
  2: {
    avatarBorder: 'border-[#C7CDD6]',
    avatarBg: 'bg-[#C7CDD6]/10',
    avatarText: 'text-[#C7CDD6]',
    barBg: 'bg-gradient-to-b from-[#C7CDD6]/16 to-[#C7CDD6]/4',
    barBorder: 'border-[#C7CDD6]/30',
    barText: 'text-[#C7CDD6]',
    height: 'h-16',
  },
  3: {
    avatarBorder: 'border-[#D69A5C]',
    avatarBg: 'bg-[#D69A5C]/10',
    avatarText: 'text-[#D69A5C]',
    barBg: 'bg-gradient-to-b from-[#D69A5C]/18 to-[#D69A5C]/4',
    barBorder: 'border-[#D69A5C]/32',
    barText: 'text-[#D69A5C]',
    height: 'h-12',
  },
};

function PodiumSlot({ entry, place }) {
  const style = PODIUM_STYLES[place];
  return (
    <div className="flex-1 text-center">
      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-base border-2 ${style.avatarBorder} ${style.avatarBg} ${style.avatarText}`}>
        {entry.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <p className="text-xs font-semibold text-[var(--text-primary)] truncate px-1">{entry.name}</p>
      <p className="text-[10px] text-[var(--text-muted)] font-mono">{entry.total_burned} CLOSE</p>
      <div className={`rounded-t-xl mt-2 flex items-start justify-center pt-1.5 font-display font-bold border ${style.barBg} ${style.barBorder} ${style.barText} ${style.height}`}>
        {place}
      </div>
    </div>
  );
}

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
        <Loader2 size={32} className="animate-spin text-[var(--accent-brass)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-yellow-400">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 underline text-[var(--accent-brass)]">Retry</button>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  // Podium is displayed 2nd-1st-3rd left to right, so 1st sits tallest
  // in the center - reorder only for that visual, ranking order elsewhere
  // (userRank, the "Full Rankings" list) is untouched.
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="p-4 space-y-6 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-full">
      <div className="flex items-center gap-3">
        <Trophy size={30} className="text-[var(--accent-brass)]" />
        <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
      </div>
      <p className="text-sm text-[var(--text-muted)] -mt-4">
        {month} – Top 150 CLOSE burners share {pool} CLOSE reward pool
      </p>

      {user && (
        <div className="rounded-2xl p-4 flex items-center justify-between bg-gradient-to-br from-[var(--accent-brass)]/15 to-[var(--accent-brass)]/[0.02] border border-[var(--accent-brass)]/30">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Your Rank</p>
            <p className="font-bold text-[var(--text-primary)] mt-0.5">{user.name || 'You'}</p>
            <p className="text-sm text-[var(--text-secondary)]">{userTotal} CLOSE burned</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-bold text-[var(--accent-brass-bright)]">#{userRank || '—'}</p>
            {userRank && userRank <= 150 && (
              <p className="text-xs text-[var(--success)] mt-0.5">🏆 +{userReward} CLOSE</p>
            )}
          </div>
        </div>
      )}

      {leaderboard.length === 0 ? (
        <div className="text-center text-[var(--text-muted)] py-10">No burns yet. Be the first!</div>
      ) : (
        <>
          {top3.length > 0 && (
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3">Top Burners</h2>
              <div className="flex items-end gap-2">
                {podiumOrder.map((entry) => (
                  <PodiumSlot key={entry.user_id} entry={entry} place={entry.rank} />
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3">Full Rankings</h2>
              <div className="space-y-2">
                {rest.map((item) => (
                  <div key={item.user_id} className="glass-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center text-sm font-mono text-[var(--text-muted)]">#{item.rank}</span>
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.total_burned} CLOSE burned</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-[var(--accent-brass)]">{item.total_burned} CLOSE</p>
                      {item.reward > 0 && <p className="text-xs text-[var(--success)]">🏆 +{item.reward} CLOSE</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
