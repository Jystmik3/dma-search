import { NextResponse } from 'next/server';

function extractTranscript(full) {
  if (!full) return { preview: '', full: '', hasMore: false };

  // Gemini Notes format has two possible starting points:
  // 1. "Notes\nDate\nTitle" header
  // 2. "Summary" section
  // 3. "Details" section with timestamps like 00:00:00)
  // 4. Raw transcript with timestamps like 0:00 - Speaker

  let text = full;

  // Try to find "Details" section start (Gemini Notes format)
  const detailsIdx = full.indexOf('\nDetails\n');
  if (detailsIdx !== -1) {
    text = full.substring(detailsIdx + 9).trim();
    // Clean up markdown-like formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
    text = text.replace(/\n\s*\n/g, '\n\n'); // Normalize blank lines
  } else {
    // Try to find raw transcript start (timestamp pattern)
    const lines = full.split('\n');
    let startIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^\d{1,2}:\d{2}[:\s]/.test(lines[i].trim())) {
        startIdx = i;
        break;
      }
    }
    if (startIdx > 0) {
      text = lines.slice(startIdx).join('\n').trim();
    }
  }

  const preview = text.substring(0, 400).replace(/\n/g, ' ');
  const fullText = text.substring(0, 3000);

  return { preview, full: fullText, hasMore: text.length > 3000 };
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