'use client';

import { useEffect, useState } from 'react';

export default function BrowsePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#011736', fontSize: 32, marginBottom: 8 }}>📼 DMA Weekly Q&A Archive</h1>
        <p style={{ color: '#666', fontSize: 16 }}>Browse all Thursday sessions with video and transcripts</p>
        <a href="/" style={{ display: 'inline-block', marginTop: 16, color: '#ff821f', textDecoration: 'none', fontSize: 14 }}>
          🔍 Search transcripts →
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {sessions.map((s) => (
          <div key={s.id} style={{
            border: '1px solid #eee', borderRadius: 8, padding: 20,
            transition: 'box-shadow 0.2s', height: '100%', background: '#fff'
          }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
            <h3 style={{ color: '#011736', fontSize: 16, marginTop: 0, marginBottom: 8 }}>{s.title}</h3>
            <div style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>{s.date} • Thursday Q&A</div>
            
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {s.video_link && (
                <a 
                  href={s.video_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    background: '#ff821f20',
                    color: '#ff821f',
                    borderRadius: 6,
                    fontSize: 13,
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  ▶️ Video
                </a>
              )}
              {s.transcript_link && (
                <a 
                  href={s.transcript_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    background: '#01173620',
                    color: '#011736',
                    borderRadius: 6,
                    fontSize: 13,
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  📄 Transcript
                </a>
              )}
              <a 
                href={`/session/${s.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  color: '#666',
                  borderRadius: 6,
                  fontSize: 13,
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                🔗 Details
              </a>
            </div>
            
            {s.topics && s.topics.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                <span style={{ fontSize: 12, color: '#999' }}>Topics: </span>
                {s.topics.map(t => (
                  <span key={t} style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    background: '#f5f5f5', 
                    color: '#666',
                    borderRadius: 12,
                    fontSize: 11,
                    marginRight: 6
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}