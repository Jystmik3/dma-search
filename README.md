# DMA Weekly Q&A Search

Semantic search for DMA Weekly Q&A transcripts (August 2024 - present).

## Setup

1. Copy `.env.example` to `.env.local`
2. Add your API keys:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run: `npm install && npm run dev`

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repo=Jystmik3/dma-search)

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + pgvector)
- **Search:** OpenAI embeddings + cosine similarity
- **Hosting:** Vercel