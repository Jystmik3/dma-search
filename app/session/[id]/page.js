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

  const videoUrl = session.metadata?.video_url;
  const videoId = videoUrl ? videoUrl.match(/\/d\/(.*?)(\/|\?|$)/)?.[1] : null;
  const embedUrl = videoId ? `https://drive.google.com/file/d/${videoId}/preview` : null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <a href="/" style={{ color: '#011736', textDecoration: 'none', fontSize: 14 }}>← Back to Search</a>
      
      <h1 style={{ color: '#011736', fontSize: 28, marginTop: 20, marginBottom: 8 }}>
        {session.metadata?.title || 'DMA Session'}
      </h1>
      <div style={{ color: '#666', marginBottom: 24 }}>
        {session.metadata?.date} • DMA Weekly Q&A
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Video Player */}
        <div>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="400"
              style={{ border: '1px solid #ddd', borderRadius: 8 }}
              allow="autoplay; fullscreen"
            />
          ) : (
            <div style={{ 
              height: 400, 
              background: '#f5f5f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: 8,
              color: '#999'
            }}>
              No video available
            </div>
          )}
          {videoUrl && (
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-block', 
                marginTop: 12, 
                color: '#ff821f',
                fontSize: 14 
              }}
            >
              Open in Google Drive ↗
            </a>
          )}
        </div>

        {/* Transcript */}
        <div style={{ 
          maxHeight: 450, 
          overflow: 'auto', 
          padding: 20, 
          background: '#f9f9f9', 
          borderRadius: 8,
          border: '1px solid #eee'
        }}>
          <h3 style={{ marginTop: 0, color: '#011736', fontSize: 18 }}>Transcript</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            fontSize: 14, 
            lineHeight: 1.7,
            color: '#444',
            fontFamily: 'system-ui, sans-serif'
          }}>
            {session.content || 'Transcript not yet available'}
          </pre>
        </div>
      </div>

      {/* Topics */}
      {session.topics && session.topics.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <strong style={{ color: '#011736', fontSize: 14 }}>Topics: </strong>
          {session.topics.map(t => (
            <span key={t} style={{ 
              display: 'inline-block', 
              padding: '4px 12px', 
              background: '#ff821f20', 
              color: '#ff821f',
              borderRadius: 12,
              fontSize: 12,
              marginRight: 8
            }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
