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
    api.get('/market/news').then((res) => setNews(res.data)).catch(() => setNews([]));
  }, []);

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
              return [...newTokens, ...prev].slice(0, 100); // longer feed
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
      <h1 className="text-4xl font-display font-bold text-[var(--color-text-primary)]">Pulse</h1>
      <div className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search token, address, news…"
          className="flex-1 bg-[var(--color-panel)] border border-[var(--color-line)] rounded-xl px-4 py-3.5 text-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-brass"
        />
        <button onClick={search} className="bg-brass hover:bg-brassLight text-void rounded-xl px-5 py-3.5 touch-target touch text-lg font-bold">
          <Search size={22} />
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item, i) => (
            <div key={i} className="glass p-4">
              <p className="text-lg text-[var(--color-text-primary)] font-bold">{item.name || item.symbol}</p>
              <p className="text-sm text-[var(--color-text-muted)] font-mono">{item.type}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm text-[var(--color-text-muted)] font-mono uppercase tracking-wide mb-3">Market Pulse</h2>
        <div className="space-y-3">
          {news.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-base">No stories yet.</p>
          ) : (
            news.map((a, i) => (
              <div key={i} className="glass p-4">
                <h3 className="text-lg text-[var(--color-text-primary)] font-bold">{a.headline}</h3>
                <p className="text-sm text-[var(--color-text-muted)] font-mono mt-1">
                  {a.source} · {new Date(a.publishedAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live token feed */}
      <div>
        <h2 className="text-sm text-[var(--color-text-muted)] font-mono uppercase tracking-wide mb-3 flex items-center gap-3">
          Live Token Feed
          <span className={`text-sm font-mono ${wsConnected ? 'text-teal' : 'text-[var(--color-text-muted)]'}`}>
            {wsConnected ? '● connected' : '○ disconnected'}
          </span>
        </h2>
        {liveTokens.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-base">Waiting for token updates…</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveTokens.map((t, i) => (
              <div key={i} className="glass p-4 flex items-center gap-4">
                {t.icon && <img src={t.icon} className="w-10 h-10 rounded-full object-cover" alt="" />}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-[var(--color-text-primary)] font-bold font-mono">{t.tokenAddress.slice(0, 6)}…{t.tokenAddress.slice(-4)}</span>
                    <span className="text-sm text-[var(--color-text-muted)] font-mono bg-[var(--color-panel)] px-3 py-1 rounded-full">{t.chainId}</span>
                  </div>
                  {t.description && <p className="text-base text-[var(--color-text-muted)] truncate font-medium">{t.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
