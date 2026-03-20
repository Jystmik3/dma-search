'use client';

import { useEffect, useState } from 'react';

export default function SessionPage({ params }) {
  const { id } = params;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/session/${id}`)
      .then(r => r.json())
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>;
  if (!session) return <div style={{ textAlign: 'center', padding: 60 }}>Session not found</div>;

  const transcriptUrl = session.metadata?.transcript_url;
  const content = session.content || '';
  const hasFullTranscript = content && content.length > 500 && !content.includes('Transcript pending');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/browse" style={{ color: '#011736', textDecoration: 'none', fontSize: 14 }}>← Browse all sessions</a>
        <a href="/" style={{ color: '#ff821f', textDecoration: 'none', fontSize: 14 }}>🔍 Search →</a>
      </div>
      
      <h1 style={{ color: '#011736', fontSize: 28, marginTop: 20, marginBottom: 8 }}>
        {session.metadata?.title || 'DMA Session'}
      </h1>
      <div style={{ color: '#666', marginBottom: 24 }}>
        {session.metadata?.date} • DMA Weekly Q&A
      </div>

      {session.summary && (
        <div style={{ background: '#f9f9f9', padding: 20, borderRadius: 8, marginBottom: 24, border: '1px solid #eee' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#011736', fontSize: 16 }}>📝 Summary</h3>
          <p style={{ margin: 0, color: '#444', lineHeight: 1.6 }}>{session.summary}</p>
        </div>
      )}

      {transcriptUrl && (
        <a href={transcriptUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#011736', color: '#fff', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 600, marginBottom: 24 }}
        >
          📄 Open Full Transcript
        </a>
      )}

      <div style={{ padding: 20, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#011736', fontSize: 16 }}>📝 Transcript</h3>
        {hasFullTranscript ? (
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: '#444', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
            {content}
          </pre>
        ) : transcriptUrl ? (
          <div style={{ color: '#666', fontSize: 14 }}>
            <p>Full transcript available via Google Docs.</p>
            <a href={transcriptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ff821f', fontSize: 14 }}>Open Full Transcript →</a>
          </div>
        ) : (
          <div style={{ color: '#999', fontSize: 14 }}>Transcript not yet available.</div>
        )}
      </div>

      {session.topics && session.topics.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <strong style={{ color: '#011736', fontSize: 14 }}>🏷️ Topics: </strong>
          {session.topics.map(t => (
            <span key={t} style={{ display: 'inline-block', padding: '4px 12px', background: '#ff821f20', color: '#ff821f', borderRadius: 12, fontSize: 12, marginRight: 8 }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}