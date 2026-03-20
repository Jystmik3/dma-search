import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    let allResults = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore && offset < 2000) {
      const supaRes = await fetch(
        `${supabaseUrl}/rest/v1/weekly_calls?select=*&order=call_date.desc&limit=${limit}&offset=${offset}`,
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

      if (!supaRes.ok) {
        const errorText = await supaRes.text();
        console.error('Supabase error:', errorText);
        break;
      }

      const results = await supaRes.json();
      allResults = allResults.concat(results);
      
      if (results.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
    
    console.log(`Fetched ${allResults.length} total sessions from Supabase`);
    
    const dmaSessions = allResults.filter(r => {
      const sessionDate = new Date(r.call_date);
      return sessionDate.getDay() === 4;
    });
    
    console.log(`Found ${dmaSessions.length} Thursday DMA sessions`);
    
    const sessions = dmaSessions.map(r => ({
      id: r.id,
      title: r.title || 'Untitled Session',
      date: r.call_date,
      has_video: !!r.drive_file_id,
      has_transcript: r.transcript && r.transcript.length > 100 && !r.transcript.includes('Transcript pending'),
      transcript_link: r.drive_file_id ? `https://docs.google.com/document/d/${r.drive_file_id}` : null,
      video_link: r.drive_file_id ? `https://drive.google.com/file/d/${r.drive_file_id}` : null,
      topics: r.topics || [],
    }));
    
    return NextResponse.json(
      { sessions, count: sessions.length },
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