import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';

function Sparkline({ prices, isUp }) {
  if (!prices || prices.length < 2) {
    return (
      <svg width="56" height="24">
        <line x1="0" y1="12" x2="56" y2="12" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2,3" />
      </svg>
    );
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * 56;
      const y = 24 - ((p - min) / range) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const color = isUp ? 'var(--success)' : 'var(--danger)';
  return (
    <svg width="56" height="24">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MarketPulseStrip({ aggregate }) {
  if (!aggregate) return null;
  const { sentiment_pct, market_cap_change_percentage_24h, gainers, losers } = aggregate;
  const capUp = (market_cap_change_percentage_24h ?? 0) >= 0;

  return (
    <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden mb-5 border border-[var(--glass-border)] bg-[var(--glass-border)]">
      <div className="bg-[var(--glass-bg-raised)] backdrop-blur-xl px-3 py-3.5">
        <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Sentiment</div>
        <div className={`font-mono text-base font-semibold ${sentiment_pct == null ? 'text-[var(--text-muted)]' : sentiment_pct >= 50 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {sentiment_pct == null ? '—' : `${sentiment_pct}% Bull`}
        </div>
        {sentiment_pct != null && (
          <div className="h-1 rounded-full bg-[var(--bg-tertiary)] mt-2 flex overflow-hidden">
            <div className="h-full bg-[var(--success)]" style={{ width: `${sentiment_pct}%` }} />
            <div className="h-full bg-[var(--danger)]" style={{ width: `${100 - sentiment_pct}%` }} />
          </div>
        )}
      </div>
      <div className="bg-[var(--glass-bg-raised)] backdrop-blur-xl px-3 py-3.5">
        <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Mkt Cap 24h</div>
        <div className={`font-mono text-base font-semibold ${capUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {market_cap_change_percentage_24h == null ? '—' : `${capUp ? '+' : ''}${market_cap_change_percentage_24h.toFixed(2)}%`}
        </div>
      </div>
      <div className="bg-[var(--glass-bg-raised)] backdrop-blur-xl px-3 py-3.5">
        <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Movers</div>
        <div className="font-mono text-base font-semibold">
          <span className="text-[var(--success)]">{gainers ?? '—'}↑</span>
          <span className="text-[var(--text-muted)]"> / </span>
          <span className="text-[var(--danger)]">{losers ?? '—'}↓</span>
        </div>
      </div>
    </div>
  );
}

function TokenDetailModal({ token, detail, loading, notFound, onClose }) {
  if (!token) return null;
  const isUp = (token.price_change_percentage_24h ?? 0) >= 0;
  const isPinned = !!token.is_pinned;

  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-black/55 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[480px] mx-auto rounded-t-[20px] border border-[var(--glass-border)] border-t-[var(--border-bright)] bg-[var(--bg-secondary)] px-5 pt-4.5 pb-8 animate-slide-up">
        <div className="w-9 h-1 rounded-full bg-[var(--border-bright)] mx-auto mb-4.5" />

        <div className="flex items-center gap-3 mb-4.5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold shrink-0"
            style={
              isPinned
                ? { background: 'linear-gradient(135deg, var(--accent-brass-bright), var(--accent-brass-dim))', color: '#14120C' }
                : { background: 'rgba(201,169,97,0.12)', color: 'var(--accent-brass)', border: '1px solid var(--glass-border)' }
            }
          >
            {token.symbol?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-display text-[19px] font-bold text-[var(--text-primary)]">{token.name}</div>
            <div className="font-mono text-[10.5px] text-[var(--text-muted)] mt-0.5">
              {isPinned ? 'CLOSE · on-chain' : token.symbol?.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="font-mono text-[27px] font-semibold text-[var(--accent-brass)] mb-0.5">
          ${formatPrice(token.current_price)}
        </div>
        <div className={`font-mono text-[11px] font-semibold flex items-center gap-1 ${isUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isUp ? '+' : ''}{(token.price_change_percentage_24h ?? 0).toFixed(2)}% · 24h
        </div>

        {isPinned ? (
          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-dashed border-[var(--glass-border)] rounded-[10px] px-3.5 py-3 mt-4 leading-relaxed">
            Priced from on-chain liquidity, not a CoinGecko listing — there's no detail page for CLOSE yet.
          </div>
        ) : loading ? (
          <div className="text-xs text-[var(--text-muted)] mt-4">Loading details…</div>
        ) : notFound ? (
          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-dashed border-[var(--glass-border)] rounded-[10px] px-3.5 py-3 mt-4 leading-relaxed">
            Detail data isn't available for this token right now.
          </div>
        ) : detail ? (
          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-[10px] px-3.5 py-3 mt-4 leading-relaxed space-y-1">
            {detail.market_data?.market_cap?.usd != null && (
              <div>Market cap: <span className="text-[var(--text-primary)] font-mono">${Number(detail.market_data.market_cap.usd).toLocaleString()}</span></div>
            )}
            {detail.market_data?.ath?.usd != null && (
              <div>All-time high: <span className="text-[var(--text-primary)] font-mono">${Number(detail.market_data.ath.usd).toLocaleString()}</span></div>
            )}
            {detail.links?.homepage?.[0] && (
              <a href={detail.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-brass)] hover:underline inline-flex items-center gap-1 mt-1">
                Website <ExternalLink size={11} />
              </a>
            )}
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="block w-full text-center mt-4.5 py-2.5 bg-transparent border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function formatPrice(price) {
  if (!price) return '0.00';
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatChange(change) {
  if (change === undefined || change === null) return '0.00%';
  return change.toFixed(2) + '%';
}

export default function Pulse() {
  const [tokens, setTokens] = useState([]);
  const [news, setNews] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState([]);

  const [selectedToken, setSelectedToken] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailNotFound, setDetailNotFound] = useState(false);

  const fetchTokens = async () => {
    setLoadingTokens(true);
    setError(null);
    try {
      const res = await api.get('/market/top-tokens?limit=20');
      setTokens(res.data?.tokens || []);
      setFilteredTokens(res.data?.tokens || []);
    } catch (e) {
      console.error('Failed to fetch tokens:', e);
      setError('Could not load token data');
      setTokens([]);
      setFilteredTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await api.get('/market/news?limit=5');
      setNews(res.data?.news || []);
    } catch (e) {
      console.error('Failed to fetch news:', e);
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchAggregate = async () => {
    try {
      const res = await api.get('/market/aggregate');
      setAggregate(res.data?.aggregate || null);
    } catch (e) {
      console.error('Failed to fetch market aggregate:', e);
      setAggregate(null);
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchNews();
    fetchAggregate();
    const interval = setInterval(() => { fetchTokens(); fetchAggregate(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredTokens(tokens);
      return;
    }
    const filtered = tokens.filter(token =>
      token.symbol?.toLowerCase().includes(q) ||
      token.name?.toLowerCase().includes(q)
    );
    setFilteredTokens(filtered);
  }, [searchQuery, tokens]);

  const handleRefresh = () => {
    fetchTokens();
    fetchNews();
    fetchAggregate();
  };

  const handleSelectToken = async (token) => {
    setSelectedToken(token);
    setDetail(null);
    setDetailNotFound(false);

    if (token.is_pinned) return;

    setDetailLoading(true);
    try {
      const res = await api.get(`/market/token/${token.id}`);
      setDetail(res.data || null);
    } catch (e) {
      console.error('Failed to fetch token detail:', e);
      setDetailNotFound(true);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Market Pulse</h1>
        <button
          onClick={handleRefresh}
          className="btn-glass-icon w-9 h-9 text-[var(--accent-brass)]"
          aria-label="Refresh"
        >
          <RefreshCw size={17} className={loadingTokens || loadingNews ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="input-glass flex items-center gap-3 focus-within:border-[var(--accent-brass)] focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.15)]">
        <Search size={18} className="text-[var(--text-muted)] shrink-0" />
        <input
          type="text"
          placeholder="Search token, address, news..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full"
        />
      </div>

      <MarketPulseStrip aggregate={aggregate} />

      {error && (
        <div className="glass-card p-4 text-sm text-yellow-400 border border-yellow-500/30 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={handleRefresh} className="underline text-white/70 hover:text-white">Retry</button>
        </div>
      )}

      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
          Live Token Feed
          <span
            className={`w-2 h-2 rounded-full ${
              loadingTokens ? 'animate-pulse bg-yellow-400' : 'bg-[var(--success)] shadow-[0_0_8px_var(--success)]'
            }`}
          />
        </h2>
        {loadingTokens && tokens.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card px-4 py-3 animate-pulse h-16" />
            ))}
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-8">
            {searchQuery ? 'No tokens match your search.' : 'No token data available.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTokens.map((token, idx) => {
              const isUp = (token.price_change_percentage_24h ?? 0) >= 0;
              const isPinned = !!token.is_pinned;
              return (
                <div
                  key={token.id || idx}
                  onClick={() => handleSelectToken(token)}
                  className={`glass-card px-4 py-3 flex items-center justify-between cursor-pointer ${
                    isPinned ? 'border-[var(--border-bright)]' : ''
                  }`}
                  style={isPinned ? { background: 'linear-gradient(135deg, rgba(201,169,97,0.09), var(--glass-bg))' } : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {token.image ? (
                      <img src={token.image} alt={token.symbol} className="w-9 h-9 rounded-full shrink-0" />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={
                          isPinned
                            ? { background: 'linear-gradient(135deg, var(--accent-brass-bright), var(--accent-brass-dim))', color: '#14120C' }
                            : { background: 'rgba(201,169,97,0.15)', color: 'var(--accent-brass)' }
                        }
                      >
                        {token.symbol?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text-primary)] text-sm truncate">{token.symbol?.toUpperCase()}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[110px]">
                        {isPinned ? 'On-chain · Polygon' : token.name}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 px-2">
                    <Sparkline prices={token.sparkline_in_7d?.price} isUp={isUp} />
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <p className="text-sm text-[var(--accent-brass)]">${formatPrice(token.current_price)}</p>
                    <p className={`text-xs flex items-center justify-end gap-1 mt-0.5 ${isUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {formatChange(token.price_change_percentage_24h)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--text-muted)] mb-3">Market Stories</h2>
        {loadingNews && news.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card px-4 py-3 animate-pulse h-16" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-8">No stories available.</div>
        ) : (
          <div className="space-y-3">
            {news.map((item, idx) => (
              <div
                key={idx}
                className="glass-card px-4 py-3 flex items-start gap-3"
              >
                {item.image ? (
                  <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl shrink-0 bg-gradient-to-br from-[var(--accent-brass)]/25 to-[var(--accent-indigo)]/15" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-primary)] font-medium text-sm line-clamp-2">{item.title}</p>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-brass)] hover:underline flex items-center gap-1">
                      Read more <ExternalLink size={11} />
                    </a>
                    <span className="text-xs text-[var(--text-muted)]">
                      · {item.source} · {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TokenDetailModal
        token={selectedToken}
        detail={detail}
        loading={detailLoading}
        notFound={detailNotFound}
        onClose={() => setSelectedToken(null)}
      />
    </div>
  );
}
