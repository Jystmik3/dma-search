import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  try {
    // ── Paginated fetch: 100 rows at a time until all records are retrieved ──
    // Filters server-side for day_of_week = Thursday to avoid JS timezone bugs.
    let allSessions = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/weekly_calls` +
        `?select=id,call_date,day_of_week,title,summary,drive_file_id,video_url,topics,transcript` +
        `&day_of_week=eq.Thursday` +
        `&order=call_date.asc` +
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
      allSessions = allSessions.concat(rows);

      if (rows.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    // ── Map each row to a clean session object ────────────────────────────
    const sessions = allSessions.map(r => ({
      id: r.id,
      title: r.title || `DMA Q&A – ${r.call_date}`,
      date: r.call_date,
      day_of_week: r.day_of_week,
      summary: r.summary || null,
      topics: r.topics || [],
      // Google Drive embed URL for the video player (from video_url column)
      video_url: r.video_url || null,
      drive_file_id: r.drive_file_id || null,
      has_video: !!r.video_url,
      has_transcript: !!(
        r.transcript &&
        r.transcript.length > 100 &&
        !r.transcript.includes('Transcript pending')
      ),
    }));

    return NextResponse.json(
      { sessions, count: sessions.length },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('[/api/sessions] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
