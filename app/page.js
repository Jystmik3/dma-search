'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#011736', fontSize: 32, marginBottom: 8 }}>🔍 DMA Weekly Q&A Search</h1>
        <p style={{ color: '#666', fontSize: 16 }}>Search through DMA Weekly Q&A transcripts (August 2024 – present)</p>
        <a href="/browse" style={{ display: 'inline-block', marginTop: 16, color: '#ff821f', textDecoration: 'none', fontSize: 14 }}>
          📼 Browse all sessions →
        </a>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcripts... e.g. 'LiDAR equipment pricing'"
          style={{
            flex: 1, padding: '12px 16px', fontSize: 16, border: '2px solid #ddd',
            borderRadius: 8, outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = '#ff821f'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px', fontSize: 16, backgroundColor: '#011736', color: '#fff',
            border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          <p style={{ color: '#666', marginBottom: 16 }}>{results.length} results for "{query}"</p>
          {results.map((r) => (
            <a key={r.id} href={`/session/${r.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 16,
                borderLeft: `4px solid ${r.similarity > 0.6 ? '#011736' : r.similarity > 0.4 ? '#ff821f' : '#999'}`,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: '#011736', fontSize: 18 }}>{r.title}</strong>
                  <span style={{ color: '#ff821f', fontWeight: 600, fontSize: 14 }}>{Math.round(r.similarity * 100)}% match</span>
                </div>
                <div style={{ color: '#999', fontSize: 14, marginBottom: 8 }}>{r.call_date}</div>
                <p style={{ color: '#444', lineHeight: 1.6 }}>{r.preview}...</p>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#999', fontSize: 14, marginTop: 60, borderTop: '1px solid #eee', paddingTop: 20 }}>
        <p>Powered by Supabase + OpenAI</p>
      </div>
    </div>
  );
}
