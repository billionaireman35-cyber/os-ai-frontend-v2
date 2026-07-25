import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function Pulse() {
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    api.get('/market/news').then(res => setNews(res.data)).catch(console.error);
  }, []);

  const handleSearch = async () => {
    if (searchQuery.length > 2) {
      const res = await api.get(`/market/search?q=${searchQuery}`);
      setSearchResults(res.data.results || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search token, address, news..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button onClick={handleSearch} className="bg-purple-500 px-6 py-3 rounded-full touch-target">
          Search
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((item, i) => (
            <div key={i} className="p-4 glass-soft">
              <p className="font-medium">{item.name || item.symbol}</p>
              <p className="text-sm text-gray-400">{item.type}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Market Pulse</h2>
        <div className="space-y-3">
          {news.map((article, i) => (
            <div key={i} className="p-4 glass-soft">
              <h3 className="font-medium">{article.headline}</h3>
              <p className="text-sm text-gray-400">{article.source} • {new Date(article.publishedAt).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
