import { useState, useEffect } from 'react';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { api } from '../utils/api';

export default function Pulse() {
  const [news, setNews] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [liveTokens, setLiveTokens] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch news
  useEffect(() => {
    api.get('/market/news').then((res) => setNews(res.data)).catch(() => setNews([]));
  }, []);

  // WebSocket connection to token feed
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:8000/ws/token-feed`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to token feed');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // The API returns an object with 'limit' and 'data' array
        if (data && data.data && Array.isArray(data.data)) {
          // Prepend new tokens to the list (limit to 50)
          setLiveTokens((prev) => {
            const newTokens = data.data.filter(
              (t) => !prev.some((p) => p.tokenAddress === t.tokenAddress && p.chainId === t.chainId)
            );
            return [...newTokens, ...prev].slice(0, 50);
          });
        } else if (Array.isArray(data)) {
          // If it's a direct array, handle similarly
          setLiveTokens((prev) => {
            const newTokens = data.filter(
              (t) => !prev.some((p) => p.tokenAddress === t.tokenAddress && p.chainId === t.chainId)
            );
            return [...newTokens, ...prev].slice(0, 50);
          });
        }
      } catch (e) {
        console.error('Failed to parse token feed message', e);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from token feed');
      setWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
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
    <div className="p-4 tablet:p-6 space-y-6">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search token, address, news…"
          className="flex-1 bg-panel border border-line rounded-md px-3 py-2.5 text-[14px] text-bone placeholder-muted focus:outline-none focus:border-brass"
        />
        <button onClick={search} className="bg-brass hover:bg-brassLight text-void rounded-md px-4 touch-target press-soft">
          <Search size={16} />
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item, i) => (
            <div key={i} className="ledger-card p-3.5">
              <p className="text-[14px] text-bone font-medium">{item.name || item.symbol}</p>
              <p className="text-[11px] text-muted font-mono">{item.type}</p>
            </div>
          ))}
        </div>
      )}

      {/* Live Token Feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] text-muted font-mono uppercase tracking-wide">Live Token Feed</h2>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${wsConnected ? 'text-teal' : 'text-alert'}`}>
              {wsConnected ? '● live' : '○ disconnected'}
            </span>
            {wsConnected ? <Wifi size={14} className="text-teal" /> : <WifiOff size={14} className="text-alert" />}
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {liveTokens.length === 0 ? (
            <p className="text-muted text-[13px]">Waiting for token updates…</p>
          ) : (
            liveTokens.map((token, i) => (
              <div key={i} className="ledger-card p-3.5 flex items-start gap-3">
                {token.icon && (
                  <img src={token.icon} alt={token.tokenAddress} className="w-8 h-8 rounded-full object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-bone font-medium truncate">
                      {token.tokenAddress.slice(0, 6)}…{token.tokenAddress.slice(-4)}
                    </span>
                    <span className="text-[10px] text-muted font-mono bg-panel2 px-1.5 py-0.5 rounded-full">
                      {token.chainId}
                    </span>
                  </div>
                  {token.description && (
                    <p className="text-[12px] text-muted truncate">{token.description}</p>
                  )}
                  {token.links && token.links.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {token.links.slice(0, 3).map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brass hover:underline"
                        >
                          {link.label || link.type}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* News Pulse */}
      <div>
        <h2 className="text-[13px] text-muted font-mono uppercase tracking-wide mb-2">Market Pulse</h2>
        <div className="space-y-2">
          {news.length === 0 ? (
            <p className="text-muted text-[13px]">No stories yet.</p>
          ) : (
            news.map((a, i) => (
              <div key={i} className="ledger-card p-3.5">
                <h3 className="text-[14px] text-bone font-medium">{a.headline}</h3>
                <p className="text-[11px] text-muted font-mono mt-0.5">
                  {a.source} · {new Date(a.publishedAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}