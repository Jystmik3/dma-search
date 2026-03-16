import { NextResponse } from 'next/server';

function findRelevantSection(full, query) {
  if (!full) return { preview: '', full: '', hasMore: false };

  // Extract Details section
  let text = full;
  const detailsIdx = full.indexOf('\nDetails\n');
  if (detailsIdx !== -1) {
    text = full.substring(detailsIdx + 9).trim();
  }
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

  // Split into logical sections (by timestamp or paragraph)
  const sections = text.split(/(\d{2}:\d{2}:\d{2}\))?/);
  const queryWords = query.toLowerCase().split(/\s+/);

  // Find most relevant section
  let bestSection = '';
  let bestScore = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const lower = section.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      const idx = lower.indexOf(word);
      if (idx !== -1) {
        score += 1;
        // Bonus for proximity to other query words
        const nearby = lower.substring(Math.max(0, idx - 100), Math.min(lower.length, idx + 100));
        for (const other of queryWords) {
          if (other !== word && nearby.includes(other)) score += 2;
        }
      }
    }
    if (score > bestScore && section.trim().length > 50) {
      bestScore = score;
      bestSection = section.trim();
    }
  }

  // If no good section match, just use the beginning
  const result = bestScore > 0 ? bestSection : text.substring(0, 2000);

  // Highlight query words
  let highlighted = result;
  for (const word of queryWords) {
    const regex = new RegExp(`(${word})`, 'gi');
    highlighted = highlighted.replace(regex, '**$1**');
  }

  return {
    preview: highlighted.substring(0, 300).replace(/\n/g, ' '),
    full: highlighted.substring(0, 3000),
    hasMore: highlighted.length > 3000 || text.length > 3000,
    hasRelevance: bestScore > 0,
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
      const { preview, full, hasMore } = findRelevantSection(r.transcript || '', query);
      return {
        id: r.id, call_date: r.call_date, title: r.title,
        similarity: Math.round(r.similarity * 100) / 100,
        preview, full_transcript: full, has_more: hasMore,
        report_url: r.drive_file_id ? `https://drive.google.com/file/d/${r.drive_file_id}/view` : null,
      };
    });

    return NextResponse.json({ results: trimmed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}