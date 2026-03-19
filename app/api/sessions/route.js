import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Get all thoughts and filter for Thursday DMA sessions only
    const supaRes = await fetch(
      `${supabaseUrl}/rest/v1/thoughts?select=id,content,metadata,topics,created_at&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      }
    );

    const results = await supaRes.json();
    
    // Filter for DMA sessions on Thursdays only (official weekly Q&A)
    const thursdaySessions = results.filter(r => {
      const source = r.metadata?.source;
      const isDMA = source && (source === 'DMA Weekly Q&A' || source.includes('DMA'));
      if (!isDMA) return false;
      
      // Check if it's Thursday (day 4)
      const sessionDate = new Date(r.metadata?.date || r.created_at);
      return sessionDate.getDay() === 4; // 4 = Thursday
    });
    
    const sessions = thursdaySessions.map(r => ({
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
