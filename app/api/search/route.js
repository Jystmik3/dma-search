import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Always use text search fallback (reliable)
    const supaRes = await fetch(`${supabaseUrl}/rest/v1/weekly_calls?select=*&order=call_date.desc`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    
    if (!supaRes.ok) {
      const errorText = await supaRes.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }
    
    const allSessions = await supaRes.json();
    
    if (!Array.isArray(allSessions)) {
      console.error('Unexpected response:', allSessions);
      return NextResponse.json({ error: 'Invalid database response' }, { status: 500 });
    }
    
    const queryLower = query.toLowerCase();
    const matches = allSessions.filter(r => {
      const text = `${r.title} ${r.summary} ${r.transcript}`.toLowerCase();
      return text.includes(queryLower);
    }).slice(0, 10);
    
    const processed = matches.map(r => ({
      id: r.id,
      call_date: r.call_date,
      title: r.title,
      similarity: 0.5,
      summary: r.summary?.substring(0, 400) || '',
      preview: r.transcript?.substring(0, 300) || '',
      relevant_text: r.transcript?.includes(queryLower) ? 
        (() => {
          const idx = r.transcript.toLowerCase().indexOf(queryLower);
          const start = Math.max(0, idx - 100);
          const end = Math.min(r.transcript.length, idx + query.length + 200);
          let text = r.transcript.substring(start, end);
          if (start > 0) text = '...' + text;
          if (end < r.transcript.length) text = text + '...';
          return text;
        })() : null,
    }));
    
    return NextResponse.json({ results: processed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed: ' + error.message }, { status: 500 });
  }
}