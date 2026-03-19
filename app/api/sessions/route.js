import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Get all thoughts with higher limit and filter for DMA sessions only
    const supaRes = await fetch(
      `${supabaseUrl}/rest/v1/thoughts?select=id,content,metadata,topics,created_at&order=created_at.desc&limit=1000`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      }
    );

    const results = await supaRes.json();
    console.log(`Fetched ${results.length} total thoughts`);
    
    // Filter for DMA sessions only (Thursday official weekly Q&A)
    const dmaSessions = results.filter(r => {
      const source = r.metadata?.source;
      if (source !== 'DMA Weekly Q&A') return false;
      
      // Check if it's Thursday (day 4)
      const sessionDate = new Date(r.metadata?.date || r.created_at);
      return sessionDate.getDay() === 4; // 4 = Thursday
    });
    
    console.log(`Found ${dmaSessions.length} Thursday DMA sessions`);
    
    const sessions = dmaSessions.map(r => ({
      id: r.id,
      title: r.metadata?.title || 'Untitled Session',
      date: r.metadata?.date || r.created_at,
      has_video: !!r.metadata?.video_url,
      has_transcript: r.content && r.content.length > 100 && !r.content.includes('Transcript pending'),
      topics: r.topics || [],
    }));
    
    return NextResponse.json(
      { sessions },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
