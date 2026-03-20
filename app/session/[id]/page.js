'use client';
import { useEffect, useState } from 'react';

const BRAND = '#011736';
const ACCENT = '#ff821f';

export default function SessionPage({ params }) {
  const { id } = params;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/session/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setSession(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: 'system-ui, sans-serif', color: '#888' }}>
        Loading session…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ color: '#c62828', marginBottom: 16 }}>❌ {error || 'Session not found'}</div>
        <a href="/browse" style={{ color: ACCENT }}>← Back to sessions</a>
      </div>
    );
  }

  // drive_file_id is a Google Docs document (meeting notes)
  const driveFileId = session.metadata?.drive_file_id;
  const docsUrl = driveFileId ? `https://docs.google.com/document/d/${driveFileId}` : null;
  // video_url is the Google Drive video embed URL
  const videoUrl = session.video_url || null;

  const content = session.content || '';
  const hasFullTranscript = content.length > 500 && !content.includes('Transcript pending');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, fontSize: 14 }}>
        <a href="/" style={{ color: BRAND, textDecoration: 'none' }}>← Search</a>
        <span style={{ color: '#ccc' }}>|</span>
        <a href="/browse" style={{ color: BRAND, textDecoration: 'none' }}>📼 Browse all</a>
      </div>

      {/* Title */}
      <h1 style={{ color: BRAND, fontSize: 26, marginTop: 0, marginBottom: 6, fontWeight: 700 }}>
        {session.title}
      </h1>
      <div style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>
        📅 {session.call_date} · DMA Weekly Q&amp;A
      </div>

      {/* Main grid: left panel + transcript */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 28,
        alignItems: 'start',
      }}>

        {/* ── Left panel: Recording + Summary + Topics ── */}
        <div>

          {/* Recording card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ color: BRAND, fontSize: 17, margin: 0 }}>📹 Recording</h2>
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: ACCENT, fontSize: 13, textDecoration: 'none', fontWeight: 600, padding: '5px 12px', border: `1px solid ${ACCENT}`, borderRadius: 6 }}
              >
                ↗ Meeting Notes
              </a>
            )}
          </div>
          {videoUrl ? (
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8edf5' }}>
              <iframe
                src={videoUrl}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ background: '#f5f7fa', borderRadius: 10, border: '1px solid #e8edf5', padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
              <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>No recording available for this session.</p>
            </div>
          )}

          {/* Summary */}
          {session.summary && (
            <div style={{ marginTop: 24, padding: 18, background: '#f7f9fc', borderRadius: 10, border: '1px solid #e8edf5' }}>
              <h3 style={{ margin: '0 0 10px', color: BRAND, fontSize: 15 }}>📝 Summary</h3>
              <p style={{ margin: 0, color: '#444', lineHeight: 1.7, fontSize: 14 }}>{session.summary}</p>
            </div>
          )}

          {/* Topics */}
          {session.topics && session.topics.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <span style={{ color: BRAND, fontWeight: 600, fontSize: 13 }}>Topics: </span>
              {session.topics.map(t => (
                <span key={t} style={{
                  display: 'inline-block', padding: '3px 10px',
                  background: `${ACCENT}20`, color: ACCENT, borderRadius: 12,
                  fontSize: 12, marginRight: 6, marginTop: 4,
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Key takeaways */}
          {session.key_takeaways && (
            <div style={{ marginTop: 20, padding: 18, background: `${BRAND}08`, borderRadius: 10, border: `1px solid ${BRAND}20` }}>
              <h3 style={{ margin: '0 0 10px', color: BRAND, fontSize: 15 }}>🎯 Key Takeaways</h3>
              <p style={{ margin: 0, color: '#333', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {session.key_takeaways}
              </p>
            </div>
          )}
        </div>

        {/* ── Transcript ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ color: BRAND, fontSize: 17, margin: 0 }}>📄 Transcript</h2>
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: ACCENT, fontSize: 13, textDecoration: 'none',
                  fontWeight: 600, padding: '5px 12px',
                  border: `1px solid ${ACCENT}`, borderRadius: 6,
                }}
              >
                ↗ Open in Google Docs
              </a>
            )}
          </div>

          <div style={{
            maxHeight: 600, overflowY: 'auto',
            padding: 20, background: '#f9fafb',
            borderRadius: 10, border: '1px solid #e8edf5',
          }}>
            {hasFullTranscript ? (
              <pre style={{
                whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8,
                color: '#333', fontFamily: 'system-ui, sans-serif', margin: 0,
              }}>
                {content}
              </pre>
            ) : (
              <div style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: 40 }}>
                {content.includes('Transcript pending')
                  ? '⏳ Transcript not yet available for this session.'
                  : content || 'No transcript available.'}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
