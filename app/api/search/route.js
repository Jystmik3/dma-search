import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const queryLower = query.toLowerCase().trim();

    // ── Paginated fetch of all Thursday sessions ─────────────────────────
    // Fetches 100 records at a time to ensure all sessions are searched.
    let allSessions = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/weekly_calls` +
        `?select=id,call_date,title,summary,transcript,drive_file_id,video_url,topics` +
        `&day_of_week=eq.Thursday` +
        `&order=call_date.desc` +
        `&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase error ${res.status}: ${err}`);
      }

      const rows = await res.json();

      if (!Array.isArray(rows)) {
        throw new Error('Unexpected response from database');
      }

      allSessions = allSessions.concat(rows);

      if (rows.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    // ── Full-text search across title + summary + transcript ─────────────
    const matches = allSessions
      .filter(r => {
        const searchable = [
          r.title || '',
          r.summary || '',
          r.transcript || '',
        ].join(' ').toLowerCase();
        return searchable.includes(queryLower);
      })
      .slice(0, 15); // Return top 15 matches

    // ── Shape results ────────────────────────────────────────────────────
    const results = matches.map(r => {
      const transcript = r.transcript || '';
      const transcriptLower = transcript.toLowerCase();

      // Find the most relevant snippet around the match
      let relevantText = null;
      const matchIdx = transcriptLower.indexOf(queryLower);
      if (matchIdx !== -1) {
        const start = Math.max(0, matchIdx - 150);
        const end = Math.min(transcript.length, matchIdx + query.length + 300);
        let snippet = transcript.substring(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < transcript.length) snippet = snippet + '...';
        relevantText = snippet;
      }

      // Calculate a simple relevance score
      const titleMatch = (r.title || '').toLowerCase().includes(queryLower) ? 0.3 : 0;
      const summaryMatch = (r.summary || '').toLowerCase().includes(queryLower) ? 0.2 : 0;
      const transcriptMatches = (transcript.match(new RegExp(queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      const transcriptScore = Math.min(0.5, transcriptMatches * 0.05);
      const similarity = Math.min(1, 0.4 + titleMatch + summaryMatch + transcriptScore);

      return {
        id: r.id,
        title: r.title || `DMA Q&A – ${r.call_date}`,
        call_date: r.call_date,
        similarity,
        summary: (r.summary || '').substring(0, 400),
        preview: transcript.substring(0, 300),
        relevant_text: relevantText,
        has_video: !!r.video_url,
        video_url: r.video_url || null,
        topics: r.topics || [],
      };
    });

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      results,
      count: results.length,
      total_searched: allSessions.length,
      query,
    });
  } catch (error) {
    console.error('[/api/search] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
