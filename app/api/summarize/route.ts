import { NextRequest, NextResponse } from 'next/server';
import { askPerplexity } from '@/lib/llm/perplexity';
import { keepOfficial } from '@/lib/retrieval/source-filter';
import { fivePartSummaryMD } from './lenses';
import { getSessionIndex } from '@/lib/utils';
import { embed } from '@/lib/llm/openai';
import { topK } from '@/lib/retrieval/vector';

const SYSTEM = 'Tu produis un résumé en 5 parties (Faits / Questions / Raisonnement / Dispositif / Références clés). Cite uniquement des URL officielles.';

export async function POST(req: NextRequest) {
  const { identifier, useUploaded } = await req.json();
  try {
    if (identifier) {
      const q = `Donne un résumé détaillé de ${identifier} avec paragraphes clés.`;
      const { text, citations } = await askPerplexity(q, SYSTEM);
      const official = keepOfficial(citations);
      const md = fivePartSummaryMD(identifier, {
        facts: [text.split('\n')[0] ?? text],
        issues: ['(voir texte)'],
        reasoning: ['(voir texte)'],
        holding: ['(voir texte)'],
        cites: official.map((u)=>`[${u}](${u})`)
      });
      return NextResponse.json({ markdown: md, sources: official });
    }
    if (useUploaded) {
      const idx = getSessionIndex();
      if (!idx || idx.chunks.length===0) return NextResponse.json({ error: 'no document uploaded' }, { status: 400 });
      const [qEmb] = await embed(['Résumé global du document']);
      const ctx = topK(idx, qEmb, 10);
      const title = 'Document téléchargé';
      const md = fivePartSummaryMD(title, {
        facts: ctx.slice(0,3).map(c=>`(p.${c.page}) ${c.text.slice(0,200)}…`),
        issues: ['(déduites du contexte)'],
        reasoning: ctx.slice(3,6).map(c=>`(p.${c.page}) ${c.text.slice(0,200)}…`),
        holding: ['(synthèse hypothétique selon le document)'],
        cites: ctx.map(c=>`(p.${c.page})`)
      });
      return NextResponse.json({ markdown: md });
    }
    return NextResponse.json({ error: 'provide identifier or useUploaded' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 });
  }
}
