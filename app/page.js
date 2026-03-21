'use client';
import { useState } from 'react';

const BRAND = '#011736';
const ACCENT = '#ff821f';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searched, setSearched] = useState(false);
  const [meta, setMeta] = useState(null);

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
        setResults([]);
      } else {
        setResults(data.results || []);
        setMeta({ total_searched: data.total_searched, count: data.count });
      }
    } catch (err) {
      setError('Search failed: ' + err.message);
    }

    setLoading(false);
    setSearched(true);
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const matchColor = (sim) => {
    if (sim > 0.7) return BRAND;
    if (sim > 0.5) return ACCENT;
    return '#888';
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      {searched ? (
        /* Compact header after search */
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <img src="/molle.png" alt="Molle" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
          <h1 style={{ color: BRAND, fontSize: 20, margin: 0, fontWeight: 700 }}>DMA Q&amp;A Search</h1>
        </div>
      ) : (
        /* Full hero before search */
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: BRAND, fontSize: 32, marginTop: 0, marginBottom: 8, fontWeight: 700 }}>
            Ask Molle
          </h1>
          <p style={{ color: '#555', fontSize: 15, margin: '0 0 4px', lineHeight: 1.5 }}>
            Search every Thursday DMA Weekly Q&amp;A session — transcripts, summaries, and recordings all in one place.
          </p>
          <p style={{ color: '#888', fontSize: 13, margin: '0 0 24px' }}>
            Aug 2024 – present ·{' '}
            <a href="/browse" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>
              📼 Browse all sessions →
            </a>
          </p>
        </div>
      )}

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: searched ? 0 : 32 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'LiDAR equipment pricing' or 'contract negotiation'"
          style={{
            flex: 1, padding: '12px 16px', fontSize: 16,
            border: '2px solid #ddd', borderRadius: 8, outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = ACCENT)}
          onBlur={(e) => (e.target.style.borderColor = '#ddd')}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 28px', fontSize: 16,
            backgroundColor: BRAND, color: '#fff',
            border: 'none', borderRadius: 8,
            cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Molle image — shown only before search */}
      {!searched && (
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <img
            src="/molle.png"
            alt="Molle — DMA Search mascot"
            style={{ width: 340, height: 'auto', borderRadius: 20, display: 'inline-block' }}
          />
          <p style={{ color: '#aaa', fontSize: 12, margin: '10px 0 0', fontStyle: 'italic' }}>
            Molle knows where it&apos;s at!
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: 16, background: '#ffebee', borderRadius: 8, marginBottom: 20, color: '#c62828', marginTop: 20 }}>
          ❌ {error}
        </div>
      )}

      {/* Meta info */}
      {searched && !error && (
        <p style={{ color: '#888', fontSize: 14, marginBottom: 16, marginTop: 16 }}>
          {results.length === 0
            ? `No results found across ${meta?.total_searched || '?'} sessions for "${query}"`
            : `${results.length} result${results.length !== 1 ? 's' : ''} across ${meta?.total_searched || '?'} sessions for "${query}"`}
        </p>
      )}

      {/* Results */}
      {results.map((r) => (
        <div
          key={r.id}
          style={{
            border: '1px solid #eee', borderRadius: 10, padding: 22,
            marginBottom: 18, borderLeft: `4px solid ${matchColor(r.similarity)}`,
            background: '#fff',
          }}
        >
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
            <div>
              <strong style={{ color: BRAND, fontSize: 17, display: 'block', marginBottom: 4 }}>
                {r.title}
              </strong>
              <span style={{ color: ACCENT, fontWeight: 600, fontSize: 13 }}>
                {Math.round(r.similarity * 100)}% match
              </span>
              {r.has_video && (
                <span style={{ marginLeft: 10, fontSize: 13, color: '#555' }}>· 📹 Has video</span>
              )}
            </div>
            <a
              href={`/session/${r.id}`}
              style={{
                color: BRAND, textDecoration: 'none', fontSize: 13,
                padding: '5px 12px', border: `1px solid ${BRAND}`, borderRadius: 6,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              View session →
            </a>
          </div>

          <div style={{ color: '#999', fontSize: 13, marginBottom: 10 }}>
            📅 {r.call_date}
          </div>

          {/* Summary */}
          {r.summary && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: BRAND, fontWeight: 600, fontSize: 13 }}>📝 Summary</span>
              <p style={{ color: '#444', lineHeight: 1.6, margin: '6px 0 0', fontSize: 14 }}>{r.summary}</p>
            </div>
          )}

          {/* Preview */}
          {r.preview && (
            <p style={{ color: '#555', lineHeight: 1.6, margin: 0, fontSize: 14 }}>{r.preview}…</p>
          )}

          {/* Relevant snippet */}
          {r.relevant_text && (
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => toggleExpand(r.id)}
                style={{ background: 'none', border: 'none', color: BRAND, cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 600 }}
              >
                {expandedId === r.id ? '▲ Hide' : '▼ Show'} matching section
              </button>
              {expandedId === r.id && (
                <div style={{ marginTop: 10, padding: 16, background: '#f7f9fc', borderRadius: 8, border: '1px solid #e8edf5' }}>
                  <pre style={{
                    margin: 0, whiteSpace: 'pre-wrap',
                    fontFamily: 'system-ui, sans-serif', fontSize: 13, lineHeight: 1.7, color: '#333',
                  }}>
                    {r.relevant_text}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 60, borderTop: '1px solid #eee', paddingTop: 20 }}>
        DMA Weekly Q&amp;A · Powered by Supabase
      </div>
    </div>
  );
}
