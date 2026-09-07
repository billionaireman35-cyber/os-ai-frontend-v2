import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Trophy, Loader2, Medal } from 'lucide-react';

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
      <div className="os-leaderboard-page os-leaderboard-loading">
        <div className="os-leaderboard-loading-mark">
          <Loader2 size={28} className="animate-spin" />
        </div>
        <p>Loading this month’s rankings</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="os-leaderboard-page os-leaderboard-state">
        <div className="glass-card os-leaderboard-error-card">
          <div className="os-leaderboard-state-icon">!</div>
          <div>
            <p className="os-leaderboard-state-title">Leaderboard unavailable</p>
            <p className="os-leaderboard-state-copy">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-glass os-leaderboard-retry"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="os-leaderboard-page p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-full">
      <div className="os-leaderboard-shell">

        <header className="os-leaderboard-header">
          <div className="os-leaderboard-heading">
            <div className="os-leaderboard-kicker">
              <span className="os-leaderboard-kicker-line" />
              MONTHLY RECOGNITION
            </div>

            <div className="os-leaderboard-title-row">
              <div className="os-leaderboard-title-icon">
                <Trophy size={22} />
              </div>
              <div>
                <h1 className="os-leaderboard-title">Leaderboard</h1>
                <p className="os-leaderboard-subtitle">
                  Burn with purpose. Rise with every move.
                </p>
              </div>
            </div>
          </div>

          <div className="os-leaderboard-cycle">
            <span className="os-leaderboard-cycle-label">CURRENT CYCLE</span>
            <strong>{month || 'Monthly'}</strong>
            <span className="os-leaderboard-cycle-dot" />
          </div>
        </header>

        <section className="os-leaderboard-reward-hero">
          <div>
            <span className="os-leaderboard-hero-label">MONTHLY REWARD POOL</span>
            <div className="os-leaderboard-pool-value">
              {pool}
              <span>CLOSE</span>
            </div>
            <p>
              The top 150 CLOSE burners share this month’s reward pool.
            </p>
          </div>

          <div className="os-leaderboard-hero-side">
            <div className="os-leaderboard-hero-orbit">
              <Medal size={25} />
            </div>
            <span>TOP 150</span>
            <small>REWARDED</small>
          </div>
        </section>

        {user && (
          <section className="os-leaderboard-your-position glass-card">
            <div className="os-leaderboard-user-main">
              <div className="os-leaderboard-user-avatar">
                {(user.name || 'Y').charAt(0).toUpperCase()}
              </div>

              <div className="os-leaderboard-user-copy">
                <span className="os-leaderboard-user-label">YOUR POSITION</span>
                <strong>{user.name || 'You'}</strong>
                <span>{userTotal} CLOSE burned this cycle</span>
              </div>
            </div>

            <div className="os-leaderboard-user-stats">
              <div>
                <span>RANK</span>
                <strong>#{userRank || '—'}</strong>
              </div>

              {userRank && userRank <= 150 && (
                <div className="os-leaderboard-user-reward">
                  <span>REWARD</span>
                  <strong>+{userReward} CLOSE</strong>
                </div>
              )}
            </div>
          </section>
        )}

        {leaderboard.length === 0 ? (
          <section className="glass-card os-leaderboard-empty">
            <div className="os-leaderboard-empty-icon">
              <Trophy size={24} />
            </div>
            <h2>The board is waiting.</h2>
            <p>No burns recorded yet. Be the first to make your mark.</p>
          </section>
        ) : (
          <>
            {top3.length > 0 && (
              <section className="os-leaderboard-podium-section">
                <div className="os-leaderboard-section-heading">
                  <div>
                    <span>01</span>
                    <div>
                      <h2>Top Burners</h2>
                      <p>The leaders of this cycle.</p>
                    </div>
                  </div>
                  <span className="os-leaderboard-section-meta">TOP 3</span>
                </div>

                <div className="os-leaderboard-podium">
                  {podiumOrder.map((entry) => {
                    const place = entry.rank;
                    const isFirst = place === 1;
                    const isSecond = place === 2;
                    const isThird = place === 3;

                    return (
                      <div
                        key={entry.user_id}
                        className={`os-leaderboard-podium-slot ${
                          isFirst ? 'is-first' : ''
                        } ${isSecond ? 'is-second' : ''} ${
                          isThird ? 'is-third' : ''
                        }`}
                      >
                        <div className="os-leaderboard-podium-rank">
                          {isFirst ? <Trophy size={15} /> : <span>#{place}</span>}
                        </div>

                        <div className="os-leaderboard-podium-avatar">
                          {(entry.name || '?').charAt(0).toUpperCase()}
                        </div>

                        <strong>{entry.name}</strong>
                        <span className="os-leaderboard-podium-burn">
                          {entry.total_burned} CLOSE
                        </span>

                        {entry.reward > 0 && (
                          <span className="os-leaderboard-podium-reward">
                            +{entry.reward} CLOSE
                          </span>
                        )}

                        <div className="os-leaderboard-podium-bar">
                          <span>{place}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="os-leaderboard-rankings-section">
                <div className="os-leaderboard-section-heading">
                  <div>
                    <span>02</span>
                    <div>
                      <h2>Full Rankings</h2>
                      <p>Every position in the current cycle.</p>
                    </div>
                  </div>
                  <span className="os-leaderboard-section-meta">
                    {leaderboard.length} ENTRIES
                  </span>
                </div>

                <div className="os-leaderboard-list">
                  {rest.map((item) => {
                    const isCurrentUser =
                      user && item.user_id === user.id;

                    return (
                      <div
                        key={item.user_id}
                        className={`glass-card os-leaderboard-row ${
                          isCurrentUser ? 'is-current-user' : ''
                        }`}
                      >
                        <div className="os-leaderboard-row-rank">
                          #{item.rank}
                        </div>

                        <div className="os-leaderboard-row-avatar">
                          {(item.name || '?').charAt(0).toUpperCase()}
                        </div>

                        <div className="os-leaderboard-row-identity">
                          <strong>{item.name}</strong>
                          <span>{item.total_burned} CLOSE burned</span>
                        </div>

                        <div className="os-leaderboard-row-value">
                          <strong>{item.total_burned}</strong>
                          <span>CLOSE</span>
                        </div>

                        {item.reward > 0 && (
                          <div className="os-leaderboard-row-reward">
                            +{item.reward} CLOSE
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        <footer className="os-leaderboard-footer">
          <span>OS AI</span>
          <span>•</span>
          <span>CLOSE ECOSYSTEM</span>
          <span>•</span>
          <span>UTILITY OVER HYPE</span>
        </footer>
      </div>
    </div>
  );

}
