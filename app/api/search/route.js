import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fallback to text search if no OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      const supaRes = await fetch(`${supabaseUrl}/rest/v1/weekly_calls?select=*&order=call_date.desc`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      });
      
      const allSessions = await supaRes.json();
      
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
        relevant_text: r.transcript?.includes(queryLower) ? r.transcript.substring(0, 500) : null,
      }));
      
      return NextResponse.json({ results: processed, fallback: true });
    }

    // Get embedding from OpenAI
    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    });
    
    if (!embRes.ok) {
      const errorText = await embRes.text();
      console.error('OpenAI error:', errorText);
      return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }
    
    const embData = await embRes.json();
    const embedding = embData.data[0].embedding;
    const embStr = '[' + embedding.map(x => x.toFixed(8)).join(',') + ']';

    // Query Supabase
    const supaRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_weekly_calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ 
        query_embedding: embStr, 
        match_threshold: 0.0,
        match_count: 10 
      }),
    });

    if (!supaRes.ok) {
      const errorText = await supaRes.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    const results = await supaRes.json();
    
    // Handle case where results is not an array
    if (!Array.isArray(results)) {
      console.error('Unexpected response format:', results);
      return NextResponse.json({ error: 'Invalid response from database' }, { status: 500 });
    }

    const processed = results.map(r => {
      const transcript = r.transcript || '';
      
      const queryLower = query.toLowerCase();
      const transcriptLower = transcript.toLowerCase();
      const matchIndex = transcriptLower.indexOf(queryLower);
      
      let relevant_text = null;
      if (matchIndex !== -1) {
        const start = Math.max(0, matchIndex - 200);
        const end = Math.min(transcript.length, matchIndex + query.length + 300);
        relevant_text = transcript.substring(start, end);
        if (start > 0) relevant_text = '...' + relevant_text;
        if (end < transcript.length) relevant_text = relevant_text + '...';
      }
      
      return {
        id: r.id,
        call_date: r.call_date,
        title: r.title,
        similarity: Math.round(r.similarity * 100) / 100,
        summary: r.summary?.substring(0, 400) || transcript.substring(0, 400),
        preview: transcript.substring(0, 300).replace(/\n+/g, ' '),
        relevant_text: relevant_text,
      };
    });

    return NextResponse.json({ results: processed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed: ' + error.message }, { status: 500 });
  }
}