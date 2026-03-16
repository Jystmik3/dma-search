import { NextResponse } from 'next/server';

function findRelevantSection(full, query) {
  if (!full || !query) return { preview: '', full: '', hasMore: false };

  let text = full;
  const detailsIdx = full.indexOf('\nDetails\n');
  if (detailsIdx !== -1) text = full.substring(detailsIdx + 9).trim();
  text = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/');

  const queryWords = (query || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // Find ALL matching positions
  const matches = [];
  for (const word of queryWords) {
    let idx = 0;
    const lower = text.toLowerCase();
    while ((idx = lower.indexOf(word, idx)) !== -1) {
      matches.push(idx);
      idx += word.length;
    }
  }

  if (matches.length === 0) {
    return { preview: text.substring(0, 400), full: text.substring(0, 3000), hasMore: text.length > 3000 };
  }

  // Find the densest cluster of matches
  matches.sort((a, b) => a - b);
  let bestStart = 0, bestEnd = text.length, bestDensity = 0;
  
  for (let i = 0; i < matches.length; i++) {
    // Look at a 1500-char window starting from each match
    const windowStart = Math.max(0, matches[i] - 200);
    const windowEnd = Math.min(text.length, windowStart + 1500);
    const windowMatches = matches.filter(m => m >= windowStart && m <= windowEnd);
    if (windowMatches.length > bestDensity) {
      bestDensity = windowMatches.length;
      bestStart = windowStart;
      // Expand to include full sentences
      let end = windowEnd;
      while (end < text.length && text[end] !== '.' && text[end] !== '\n') end++;
      bestEnd = Math.min(end + 1, text.length);
    }
  }

  const relevantSection = text.substring(bestStart, bestEnd);

  // Highlight query words
  let highlighted = relevantSection;
  for (const word of queryWords) {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlighted = highlighted.replace(regex, '**$1**');
  }

  return {
    preview: highlighted.substring(0, 400).replace(/\n/g, ' '),
    full: highlighted.substring(0, 3000),
    hasMore: highlighted.length > 3000,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const query = body?.query || '';
    if (!query) return NextResponse.json({ results: [] });

    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    });
    const embData = await embRes.json();
    if (!embData?.data?.[0]?.embedding) return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
    const embStr = '[' + embData.data[0].embedding.map(x => x.toFixed(8)).join(',') + ']';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return NextResponse.json({ error: 'Config missing' }, { status: 500 });

    const supaRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({ query_embedding: embStr, match_count: 5 }),
    });
    const results = await supaRes.json();
    if (!Array.isArray(results)) return NextResponse.json({ error: 'DB query failed' }, { status: 500 });

    const trimmed = results.map(r => {
      const { preview, full, hasMore } = findRelevantSection(r?.transcript || '', query);
      return {
        id: r.id, call_date: r.call_date, title: r.title,
        similarity: Math.round((r.similarity || 0) * 100) / 100,
        summary: r.summary || '',
        preview, full_transcript: full, has_more: hasMore,
        report_url: r.drive_file_id ? `https://drive.google.com/file/d/${r.drive_file_id}/view` : null,
      };
    });
    return NextResponse.json({ results: trimmed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: error?.message || 'Search failed' });
  }
}