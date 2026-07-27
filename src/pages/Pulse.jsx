import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../utils/api';

export default function Pulse() {
  const [news, setNews] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveTokens, setLiveTokens] = useState([]);

  useEffect(() => {
    // Fetch news
    api.get('/market/news').then((res) => setNews(res.data)).catch(() => setNews([]));
  }, []);

  // WebSocket for live token feed (DexScreener)
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:8000/ws/token-feed`;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setWsConnected(true);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.data && Array.isArray(data.data)) {
            setLiveTokens((prev) => {
              const newTokens = data.data.filter(
                (t) => !prev.some((p) => p.tokenAddress === t.tokenAddress && p.chainId === t.chainId)
              );
              return [...newTokens, ...prev].slice(0, 50);
            });
          }
        } catch (e) { /* ignore */ }
      };
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch (e) {
      console.warn('WebSocket not available, token feed disabled');
    }
    return () => { if (ws) ws.close(); };
  }, []);

  const search = async () => {
    if (query.length < 3) return;
    try {
      const res = await api.get(`/market/search`, { params: { q: query } });
      setResults(res.data.results || []);
    } catch {
      setResults([]);
    }
  };

  return (
    <div className="p-4 tablet:p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-display text-[var(--color-text-primary)]">Pulse</h1>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search token, address, news…"
          className="flex-1 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-md px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass"
        />
        <button onClick={search} className="bg-brass hover:bg-brassLight text-void rounded-md px-4 touch-target press-soft">
          <Search size={16} />
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item, i) => (
            <div key={i} className="ledger-card p-3.5">
              <p className="text-[14px] text-[var(--color-text-primary)] font-medium">{item.name || item.symbol}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{item.type}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-[13px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide mb-2">Market Pulse</h2>
        <div className="space-y-2">
          {news.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-[13px]">No stories yet.</p>
          ) : (
            news.map((a, i) => (
              <div key={i} className="ledger-card p-3.5">
                <h3 className="text-[14px] text-[var(--color-text-primary)] font-medium">{a.headline}</h3>
                <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">
                  {a.source} · {new Date(a.publishedAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live token feed */}
      <div>
        <h2 className="text-[13px] text-[var(--color-text-muted)] font-mono uppercase tracking-wide mb-2 flex items-center gap-2">
          Live Token Feed
          <span className={`text-[10px] font-mono ${wsConnected ? 'text-teal' : 'text-[var(--color-text-muted)]'}`}>
            {wsConnected ? '● connected' : '○ disconnected'}
          </span>
        </h2>
        {liveTokens.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-[13px]">Waiting for token updates…</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {liveTokens.slice(0, 10).map((t, i) => (
              <div key={i} className="ledger-card p-3.5 flex items-center gap-3">
                {t.icon && <img src={t.icon} className="w-6 h-6 rounded-full object-cover" alt="" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[var(--color-text-primary)] font-mono">{t.tokenAddress.slice(0, 6)}…{t.tokenAddress.slice(-4)}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono bg-[var(--color-panel)] px-1.5 py-0.5 rounded-full">{t.chainId}</span>
                  </div>
                  {t.description && <p className="text-[11px] text-[var(--color-text-muted)] truncate">{t.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
