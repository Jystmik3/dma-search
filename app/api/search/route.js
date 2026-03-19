import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
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
    const embData = await embRes.json();
    const embedding = embData.data[0].embedding;
    const embStr = '[' + embedding.map(x => x.toFixed(8)).join(',') + ']';

    // Query Supabase match_calls function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supaRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ query_embedding: embStr, match_count: 10 }),
    });

    const results = await supaRes.json();

    // Filter for Thursday DMA sessions only
    const thursdayResults = results.filter(r => {
      const sessionDate = new Date(r.call_date);
      return sessionDate.getDay() === 4; // 4 = Thursday
    });

    // Process results with summary and relevant text
    const processed = thursdayResults.map(r => {
      const transcript = r.transcript || '';
      
      // Extract summary (first 500 chars or first paragraph)
      const summaryMatch = transcript.match(/Summary[\s\S]*?(?=\n\n|Details|$)/i);
      const summary = summaryMatch ? summaryMatch[0].substring(0, 400) : transcript.substring(0, 400);
      
      // Find relevant section around query match (simple text search)
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
        summary: summary.replace(/\n+/g, ' ').trim(),
        preview: transcript.substring(0, 300).replace(/\n+/g, ' '),
        relevant_text: relevant_text,
      };
    });

    return NextResponse.json({ results: processed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
