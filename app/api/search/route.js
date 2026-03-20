import { NextResponse } from 'next/server';

// Temporarily hardcoded for debugging
const SUPABASE_URL = 'https://lbxotveawzzncgnodnfs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieG90dmVhd3p6bmNnbm9kbmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNjY1NjUsImV4cCI6MjA1NjY0MjU2NX0.4WYOieWm6eXv3QvLx7X7X7X7X7X7X7X7X7X7X7X7X7X7'; // Truncated for security

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Use hardcoded values
    const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/weekly_calls?select=*&order=call_date.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    
    if (!supaRes.ok) {
      const errorText = await supaRes.text();
      console.error('Supabase error:', supaRes.status, errorText);
      return NextResponse.json({ 
        error: 'Database query failed', 
        status: supaRes.status,
        details: errorText 
      }, { status: 500 });
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
    
    return NextResponse.json({ results: processed, count: processed.length });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed: ' + error.message }, { status: 500 });
  }
}