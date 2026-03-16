'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setExpanded(null);
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
        <h1 style={{ color: '#011736', fontSize: 32, marginBottom: 8 }}>&#x1F50D; DMA Weekly Q&amp;A Search</h1>
        <p style={{ color: '#666', fontSize: 16 }}>Search 60+ Thursday Q&amp;A transcripts (August 2024 &ndash; present)</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transcripts... e.g. LiDAR equipment pricing" style={{ flex: 1, padding: '12px 16px', fontSize: 16, border: '2px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <button type="submit" disabled={loading} style={{ padding: '12px 24px', fontSize: 16, backgroundColor: '#011736', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer', fontWeight: 600, minWidth: 120 }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          <p style={{ color: '#666', marginBottom: 16 }}>{results.length} results for &ldquo;{query}&rdquo;</p>
          {results.map((r) => (
            <div key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 16, borderLeft: '4px solid ' + (r.similarity > 0.6 ? '#011736' : r.similarity > 0.4 ? '#ff821f' : '#999') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <strong style={{ color: '#011736', fontSize: 18 }}>{r.title}</strong>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ color: '#ff821f', fontWeight: 600, fontSize: 14 }}>{Math.round(r.similarity * 100)}% match</span>
                  {r.report_url && (
                    <a href={r.report_url} target="_blank" rel="noopener noreferrer" style={{ color: '#083964', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>&#x1F517; Full Transcript</a>
                  )}
                </div>
              </div>
              <div style={{ color: '#999', fontSize: 14, marginBottom: 12 }}>{r.call_date}</div>
              <div style={{ color: '#444', lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-wrap', marginBottom: 8 }}>
                {expanded === r.id ? r.full_transcript : r.preview}
                {expanded !== r.id && '...'}
              </div>
              {r.has_more && (
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ background: 'none', border: 'none', color: '#083964', cursor: 'pointer', fontSize: 14, padding: 0, fontWeight: 600 }}>
                  {expanded === r.id ? '&#x25B2; Show less' : '&#x25BC; Show more'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !loading && (
        <p style={{ color: '#999', textAlign: 'center' }}>No results found. Try different keywords.</p>
      )}

      <div style={{ textAlign: 'center', color: '#999', fontSize: 14, marginTop: 60, borderTop: '1px solid #eee', paddingTop: 20, paddingBottom: 40 }}>
        <p>Powered by Supabase + OpenAI</p>
      </div>
    </div>
  );
}