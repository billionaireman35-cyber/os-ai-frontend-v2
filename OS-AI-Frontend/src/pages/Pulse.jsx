import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../utils/api';

export default function Pulse() {
  const [news, setNews] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get('/market/news').then((res) => setNews(res.data)).catch(() => setNews([]));
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
