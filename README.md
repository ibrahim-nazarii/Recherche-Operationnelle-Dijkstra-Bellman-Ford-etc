# FR/EU Legal Prototype (Phase‑1 demo)

A small Next.js app that simulates the Phase‑1 experience: public legal Q&A (FR/EU/ECHR) with official citations, document upload + private Q&A, summarization, and basic drafting.

## Quick start

```bash
pnpm install
cp .env.example .env # put your keys
pnpm dev
```

Open http://localhost:3000

### Environment

- `PERPLEXITY_API_KEY` for public Q&A with citations.
- `OPENAI_API_KEY` for embeddings and private‑doc Q&A / drafting.

### Notes

- Session data (uploaded docs, embeddings) is stored in memory and may reset on restart.
- Public Q&A only returns answers when an **official URL** (EUR‑Lex, Légifrance, HUDOC, CURIA) is present in citations.
