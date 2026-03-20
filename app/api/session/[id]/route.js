import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supaRes = await fetch(`${supabaseUrl}/rest/v1/weekly_calls?id=eq.${id}&select=*`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    const results = await supaRes.json();
    
    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const r = results[0];
    
    const session = {
      id: r.id,
      content: r.transcript,
      summary: r.summary,
      topics: r.topics,
      metadata: {
        title: r.title,
        date: r.call_date,
        video_url: r.drive_file_id ? `https://drive.google.com/file/d/${r.drive_file_id}` : null,
        transcript_url: r.drive_file_id ? `https://docs.google.com/document/d/${r.drive_file_id}` : null,
      },
      call_date: r.call_date,
      drive_file_id: r.drive_file_id,
      key_takeaways: r.key_takeaways,
    };
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}