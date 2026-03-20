'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setExpandedId(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results || []);
      }
    } catch (err) {
      setError('Search failed: ' + err.message);
    }
    setLoading(false);
  };

  const toggleExpand = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
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

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
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

      {error && (
        <div style={{ padding: 16, background: '#ffebee', borderRadius: 8, marginBottom: 20, color: '#c62828' }}>
          ❌ Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p style={{ color: '#666', marginBottom: 16 }}>{results.length} results for "{query}"</p>
          {results.map((r) => (
            <div key={r.id} style={{
              border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 16,
              borderLeft: `4px solid ${r.similarity > 0.6 ? '#011736' : r.similarity > 0.4 ? '#ff821f' : '#999'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <strong style={{ color: '#011736', fontSize: 18, display: 'block', marginBottom: 4 }}>{r.title}</strong>
                  <span style={{ color: '#ff821f', fontWeight: 600, fontSize: 14 }}>{Math.round(r.similarity * 100)}% match</span>
                </div>
                <a href={`/session/${r.id}`}
                  style={{ color: '#011736', textDecoration: 'none', fontSize: 14, padding: '4px 12px', border: '1px solid #011736', borderRadius: 4 }}
                >
                  🔗 Full
                </a>
              </div>
              <div style={{ color: '#999', fontSize: 14, marginBottom: 12 }}>{r.call_date}</div>
              
              {r.summary && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: '#011736', fontWeight: 600, fontSize: 14 }}>📝 Summary</span>
                  <p style={{ color: '#444', lineHeight: 1.6, margin: '8px 0 0 0' }}>{r.summary}</p>
                </div>
              )}
              
              <p style={{ color: '#444', lineHeight: 1.6, margin: 0 }}>{r.preview}...</p>
              
              {r.relevant_text && (
                <div style={{ marginTop: 12 }}>
                  <button onClick={(e) => toggleExpand(r.id, e)}
                    style={{ background: 'none', border: 'none', color: '#011736', cursor: 'pointer', fontSize: 14 }}
                  >
                    {expandedId === r.id ? '▲ Hide' : '▼ Show'} relevant section
                  </button>
                  
                  {expandedId === r.id && (
                    <div style={{ marginTop: 12, padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#444' }}>
                        {r.relevant_text}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#999', fontSize: 14, marginTop: 60, borderTop: '1px solid #eee', paddingTop: 20 }}>
        <p>Powered by Supabase + OpenAI</p>
      </div>
    </div>
  );
}