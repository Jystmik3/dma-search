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
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ color: '#011736', fontSize: 32, marginBottom: 8 }}>📼 DMA Weekly Q&A Archive</h1>
        <p style={{ color: '#666', fontSize: 16 }}>Browse all sessions with video and transcripts</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {sessions.map((s) => (
          <a key={s.id} href={`/session/${s.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              border: '1px solid #eee', borderRadius: 8, padding: 20, cursor: 'pointer',
              transition: 'box-shadow 0.2s', height: '100%',
            }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <h3 style={{ color: '#011736', fontSize: 16, marginTop: 0, marginBottom: 8 }}>{s.title}</h3>
              <div style={{ color: '#999', fontSize: 14, marginBottom: 12 }}>{s.date}</div>
              {s.has_video && (
                <span style={{ 
                  display: 'inline-block', 
                  padding: '4px 8px', 
                  background: '#ff821f20', 
                  color: '#ff821f',
                  borderRadius: 4,
                  fontSize: 12 
                }}>
                  📹 Video
                </span>
              )}
              {s.has_transcript && (
                <span style={{ 
                  display: 'inline-block', 
                  padding: '4px 8px', 
                  background: '#01173620', 
                  color: '#011736',
                  borderRadius: 4,
                  fontSize: 12,
                  marginLeft: 8
                }}>
                  📝 Transcript
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
