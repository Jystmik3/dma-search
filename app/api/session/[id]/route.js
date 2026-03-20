import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/weekly_calls?id=eq.${encodeURIComponent(id)}&select=id,call_date,day_of_week,title,transcript,summary,topics,key_takeaways,drive_file_id,video_url,embedding`,
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

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const r = rows[0];

    // drive_file_id is a Google Docs document (meeting notes + recording link inside).
    // Use /document/d/ so it opens as a Google Doc, not a Drive file preview.
    const docsUrl = r.drive_file_id
      ? `https://docs.google.com/document/d/${r.drive_file_id}`
      : null;

    const session = {
      id: r.id,
      title: r.title || `DMA Q&A – ${r.call_date}`,
      call_date: r.call_date,
      day_of_week: r.day_of_week,
      content: r.transcript || '',
      summary: r.summary || null,
      topics: r.topics || [],
      key_takeaways: r.key_takeaways || null,
      has_embedding: !!r.embedding,
      video_url: r.video_url || null,
      metadata: {
        title: r.title || `DMA Q&A – ${r.call_date}`,
        date: r.call_date,
        docs_url: docsUrl,
        drive_file_id: r.drive_file_id || null,
      },
    };

    return NextResponse.json(session);
  } catch (error) {
    console.error('[/api/session/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
