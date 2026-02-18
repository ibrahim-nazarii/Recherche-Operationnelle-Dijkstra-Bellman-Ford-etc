import { NextRequest, NextResponse } from 'next/server';
import { askPerplexity } from '@/lib/llm/perplexity';
import { keepOfficial } from '@/lib/retrieval/source-filter';

const SYSTEM = 'Tu retournes des liens officiels récents (EUR-Lex, Légifrance, HUDOC, CURIA) pour les thèmes demandés, sous forme de liste.';

export async function POST(req: NextRequest) {
  const { topics } = await req.json();
  const q = `Dernières publications officielles sur: ${topics?.join(', ')}`;
  try {
    const { text, citations } = await askPerplexity(q, SYSTEM);
    const official = keepOfficial(citations);
    const hits = official.map(u => ({ url: u }));
    return NextResponse.json({ hits, note: text.slice(0,200) + '…' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 });
  }
}
