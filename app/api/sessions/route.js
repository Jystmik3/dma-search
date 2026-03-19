import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supaRes = await fetch(`${supabaseUrl}/rest/v1/thoughts?select=id,content,metadata,topics,created_at&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });

    const results = await supaRes.json();
    
    const sessions = results.map(r => ({
      id: r.id,
      title: r.metadata?.title || 'Untitled Session',
      date: r.metadata?.date || r.created_at,
      has_video: !!r.metadata?.video_url,
      has_transcript: r.content && !r.content.includes('Transcript pending'),
      topics: r.topics || [],
    }));
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
