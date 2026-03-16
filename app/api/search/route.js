import { NextResponse } from 'next/server';

function findRelevantSection(full, query) {
  if (!full || !query) return { preview: '', full: '', hasMore: false };

  let text = full;
  const detailsIdx = full.indexOf('\nDetails\n');
  if (detailsIdx !== -1) {
    text = full.substring(detailsIdx + 9).trim();
  }
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

  const sections = text.split(/(\d{2}:\d{2}:\d{2}\))?/);
  const queryWords = (query || '').toLowerCase().split(/\s+/);

  let bestSection = '';
  let bestScore = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section || !section.trim()) continue;
    const lower = section.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (!word) continue;
      const idx = lower.indexOf(word);
      if (idx !== -1) {
        score += 1;
        const nearby = lower.substring(Math.max(0, idx - 100), Math.min(lower.length, idx + 100));
        for (const other of queryWords) {
          if (other && other !== word && nearby.includes(other)) score += 2;
        }
      }
    }
    if (score > bestScore && section.trim().length > 50) {
      bestScore = score;
      bestSection = section.trim();
    }
  }

  const result = bestScore > 0 ? bestSection : text.substring(0, 2000);

  let highlighted = result;
  for (const word of queryWords) {
    if (!word) continue;
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    highlighted = highlighted.replace(regex, '**$1**');
  }

  return {
    preview: highlighted.substring(0, 400).replace(/\n/g, ' '),
    full: highlighted.substring(0, 3000),
    hasMore: highlighted.length > 3000 || text.length > 3000,
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
    if (!embData?.data?.[0]?.embedding) {
      return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
    }
    const embedding = embData.data[0].embedding;
    const embStr = '[' + embedding.map(x => x.toFixed(8)).join(',') + ']';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const supaRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({ query_embedding: embStr, match_count: 5 }),
    });
    const results = await supaRes.json();
    if (!Array.isArray(results)) {
      return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
    }

    const trimmed = results.map(r => {
      const { preview, full, hasMore } = findRelevantSection(r?.transcript || '', query);
      return {
        id: r.id,
        call_date: r.call_date,
        title: r.title,
        similarity: Math.round((r.similarity || 0) * 100) / 100,
        preview,
        full_transcript: full,
        has_more: hasMore,
        report_url: r.drive_file_id ? `https://drive.google.com/file/d/${r.drive_file_id}/view` : null,
      };
    });

    return NextResponse.json({ results: trimmed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: error?.message || 'Search failed' });
  }
}