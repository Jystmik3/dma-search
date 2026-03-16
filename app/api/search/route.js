import { NextResponse } from 'next/server';

function extractTranscript(full) {
  if (!full) return { preview: '', full: '' };
  
  // Find where actual conversation starts (timestamp pattern like "0:00" or "1:12")
  const lines = full.split('\n');
  let transcriptStart = 0;
  let summaryEnd = 0;
  
  for (let i = 0; i < lines.length; i++) {
    // Look for timestamp lines like "0:00 - Speaker" or "1:12 - Speaker"
    if (/^\d+:\d+\s*-/.test(lines[i].trim())) {
      transcriptStart = i;
      break;
    }
    // Track where summary ends
    if (lines[i].trim() === '' && i > 5) {
      summaryEnd = i;
    }
  }
  
  // Get transcript portion (skip header + summary)
  const transcriptLines = lines.slice(transcriptStart);
  const transcript = transcriptLines.join('\n').trim();
  
  return {
    preview: transcript.substring(0, 300),
    full: transcript.substring(0, 3000),
    hasMore: transcript.length > 3000,
  };
}

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    });
    const embData = await embRes.json();
    const embedding = embData.data[0].embedding;
    const embStr = '[' + embedding.map(x => x.toFixed(8)).join(',') + ']';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supaRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({ query_embedding: embStr, match_count: 5 }),
    });
    const results = await supaRes.json();

    const trimmed = results.map(r => {
      const { preview, full, hasMore } = extractTranscript(r.transcript || '');
      return {
        id: r.id,
        call_date: r.call_date,
        title: r.title,
        similarity: Math.round(r.similarity * 100) / 100,
        preview,
        full_transcript: full,
        has_more: hasMore,
        report_url: r.drive_file_id ? `https://drive.google.com/file/d/${r.drive_file_id}/view` : null,
      };
    });

    return NextResponse.json({ results: trimmed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}