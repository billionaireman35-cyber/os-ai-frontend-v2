import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, TrendingDown, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export default function Pulse() {
  const [tokens, setTokens] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState([]);

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

  useEffect(() => {
    fetchTokens();
    fetchNews();
    const interval = setInterval(fetchTokens, 60000);
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
  };

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatChange = (change) => {
    if (change === undefined || change === null) return '0.00%';
    return change.toFixed(2) + '%';
  };

  return (
    <div className="p-4 space-y-6 bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-full">
      {/* Header */}
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

      {/* Search */}
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

      {error && (
        <div className="glass-card p-4 text-sm text-yellow-400 border border-yellow-500/30 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={handleRefresh} className="underline text-white/70 hover:text-white">Retry</button>
        </div>
      )}

      {/* Token Feed */}
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
            {filteredTokens.map((token, idx) => (
              <div
                key={idx}
                className="glass-card px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {token.image ? (
                    <img src={token.image} alt={token.symbol} className="w-9 h-9 rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--accent-brass)]/15 text-[var(--accent-brass)] font-bold text-sm">
                      {token.symbol?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-[var(--text-primary)] text-sm">{token.symbol?.toUpperCase()}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate max-w-[140px]">{token.name}</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="text-sm text-[var(--accent-brass)]">${formatPrice(token.current_price)}</p>
                  <p className={`text-xs flex items-center justify-end gap-1 mt-0.5 ${token.price_change_percentage_24h >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {token.price_change_percentage_24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {formatChange(token.price_change_percentage_24h)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* News Feed */}
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
    </div>
  );
}
