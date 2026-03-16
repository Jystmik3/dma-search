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
    setLoading(true); setExpanded(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Render with highlighted text
  const renderHighlighted = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <mark key={i} style={{ backgroundColor: '#fff3cd', padding: '2px 4px', borderRadius: 3 }}>{p.slice(2, -2)}</mark>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#011736', fontSize: 32, marginBottom: 8 }}>&#x1F50D; DMA Weekly Q&amp;A</h1>
        <p style={{ color: '#666', fontSize: 16 }}>Search 60+ Thursday transcripts (Aug 2024 - present)</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. setting out ground control points" style={{ flex: 1, padding: '12px 16px', fontSize: 16, border: '2px solid #ddd', borderRadius: 8, outline: 'none' }} />
        <button type="submit" disabled={loading} style={{ padding: '12px 24px', fontSize: 16, backgroundColor: '#011736', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, minWidth: 100 }}>
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && <p style={{ color: '#666', marginBottom: 16 }}>{results.length} results for &ldquo;{query}&rdquo;</p>}

      {results.map(r => (
        <div key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 20, marginBottom: 16, borderLeft: '4px solid ' + (r.similarity > 0.6 ? '#011736' : r.similarity > 0.4 ? '#ff821f' : '#999') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ color: '#011736', fontSize: 18 }}>{r.title}</strong>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: '#ff821f', fontWeight: 600 }}>{Math.round(r.similarity * 100)}%</span>
              <a href={r.report_url} target="_blank" rel="noopener noreferrer" style={{ color: '#083964', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>&#x1F517; Full</a>
            </div>
          </div>
          <div style={{ color: '#999', fontSize: 14, marginBottom: 12 }}>{r.call_date}</div>
          <div style={{ color: '#444', lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-wrap' }}>
            {renderHighlighted(expanded === r.id ? r.full_transcript : r.preview)}
            {expanded !== r.id && r.has_more && '...'}
          </div>
          {r.has_more && (
            <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{ background: 'none', border: 'none', color: '#083964', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 8 }}>
              {expanded === r.id ? 'Show less' : '\u25BC Show relevant section'}
            </button>
          )}
        </div>
      ))}

      {results.length === 0 && query && !loading && <p style={{ color: '#999', textAlign: 'center' }}>No results found.</p>}

      <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 60, borderTop: '1px solid #eee', paddingTop: 20, paddingBottom: 40 }}>
        DMA Weekly Q&amp;A Search &bull; Supabase + OpenAI
      </div>
    </div>
  );
}