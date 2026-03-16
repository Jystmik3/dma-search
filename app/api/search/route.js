import { NextResponse } from 'next/server';

const STOP_WORDS = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','can','may','might','shall','must','to','of','in','for','on','with','at','by','from','as','into','through','during','before','after','above','below','between','out','off','over','under','again','further','then','once','here','there','when','where','why','how','all','each','every','both','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','because','but','and','or','if','while','about','up','what','which','who','whom','this','that','these','those','i','me','my','we','our','you','your','he','him','his','she','her','it','its','they','them','their','am','been','get','got','also','like','think','know','well','right','go','going','go','went','one','two','thing','things','way','want','need','gonna','yeah','yes','oh','uh','um','said','say','says','told','asked','still','even','much','many','lot','really','okay','ok','sure','hey','hello','hi','thank','thanks','please','yeah','yep','yup','nope','nah','gonna','gotta','wanna','kinda','sorta','dont','dont','isnt','wasnt','doesnt','didnt','wont','wouldnt','couldnt','shouldnt','havent','hasnt','hadnt','arent','werent','was','were','its','doing','going','being','having','making','getting','putting','take','took','taken','come','came','see','saw','seen','look','looked','give','gave','given','use','used','find','found','tell','told','try','tried','keep','kept','let','seem','set','let','put','say','said']);

function findRelevantSection(full, query) {
  if (!full || !query) return { preview: '', full: '', hasMore: false };

  let text = full;
  const detailsIdx = full.indexOf('\nDetails\n');
  if (detailsIdx !== -1) text = full.substring(detailsIdx + 9).trim();
  text = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/');

  const queryWords = (query || '').toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const matches = [];
  for (const word of queryWords) {
    let idx = 0;
    const lower = text.toLowerCase();
    while ((idx = lower.indexOf(word, idx)) !== -1) {
      matches.push({ pos: idx, word });
      idx += word.length;
    }
  }

  let relevantText;
  if (matches.length === 0) {
    relevantText = text.substring(0, 2000);
  } else {
    matches.sort((a, b) => a.pos - b.pos);
    let bestStart = 0, bestDensity = 0;
    for (let i = 0; i < matches.length; i++) {
      const windowStart = Math.max(0, matches[i].pos - 200);
      const windowEnd = Math.min(text.length, windowStart + 2000);
      const windowMatches = matches.filter(m => m.pos >= windowStart && m.pos <= windowEnd);
      if (windowMatches.length > bestDensity) {
        bestDensity = windowMatches.length;
        bestStart = windowStart;
      }
    }
    let end = bestStart + 2000;
    while (end < text.length && text[end] !== '.' && text[end] !== '\n') end++;
    relevantText = text.substring(bestStart, Math.min(end + 1, text.length));
  }

  let highlighted = relevantText;
  for (const word of queryWords) {
    const regex = new RegExp(`\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\b`, 'gi');
    highlighted = highlighted.replace(regex, '**$1**');
  }

  return {
    preview: highlighted.substring(0, 300).replace(/\n/g, ' '),
    full: highlighted.substring(0, 3000),
    hasMore: highlighted.length > 300,
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
        drive_file_id: r.drive_file_id || null,
      };
    });
    return NextResponse.json({ results: trimmed });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: error?.message || 'Search failed' });
  }
}