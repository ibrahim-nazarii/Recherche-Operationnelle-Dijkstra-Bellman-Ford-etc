import { NextRequest, NextResponse } from 'next/server';
import { askPerplexity } from '@/lib/llm/perplexity';
import { keepOfficial } from '@/lib/retrieval/source-filter';
import { attachMarkers } from '@/lib/guardrails/attribution';
import { default as htmlToDocx } from 'html-to-docx';

const SYSTEM =
  'Tu rédiges des documents juridiques concis en français. ' +
  'Chaque proposition est sourcée par des références [1], [2] vers des URL officielles. ' +
  'Respecte strictement le ton demandé.';
const MODEL_DRAFT =
  process.env.PERPLEXITY_MODEL_DRAFT ??
  'sonar-reasoning-pro';
const OFFICIAL_SOURCES =
  'Légifrance, Judilibre, EUR-Lex, HUDOC, CURIA, BOFiP';
const NO_OFFICIAL_MESSAGE = 'Je ne peux pas confirmer avec une source officielle.';

function markdownFrom(answer: string, sources: string[], purpose: string, tone: string, query: string) {
  const header = `# ${purpose.toUpperCase()}\n\n_Ton: ${tone}_\n\n**Objet**: ${query}\n\n`;
  return header + answer;
}

function buildDraftPrompt(
  purpose: string,
  tone: string,
  query: string,
  strict = false
) {
  const parts = [
    `Prépare un ${purpose} sur : ${query}.`,
    `Ton : ${tone}.`,
    `Utilise uniquement des sources officielles : ${OFFICIAL_SOURCES}.`,
    'Cite des URL officielles pertinentes.',
  ];
  if (strict) {
    parts.push(
      `Si aucune source officielle n'est disponible, réponds uniquement : "${NO_OFFICIAL_MESSAGE}".`
    );
  }
  return parts.join(' ');
}

export async function POST(req: NextRequest) {
  const { purpose='memo', tone='neutre', query, download } = await req.json();
  if (!query) return NextResponse.json({ error: 'missing query' }, { status: 400 });
  const basePrompt = buildDraftPrompt(purpose, tone, query);
  let { text, citations } = await askPerplexity(basePrompt, SYSTEM, { model: MODEL_DRAFT });
  let official = keepOfficial(citations);

  if (!official.length) {
    ({ text, citations } = await askPerplexity(
      buildDraftPrompt(purpose, tone, query, true),
      SYSTEM,
      { model: MODEL_DRAFT }
    ));
    official = keepOfficial(citations);
  }

  if (!official.length) {
    const md = markdownFrom(
      `> ${NO_OFFICIAL_MESSAGE}\n\nMerci de préciser une base légale, un arrêt ou une source officielle à citer.`,
      [],
      purpose,
      tone,
      query
    );
    return NextResponse.json({
      markdown: md,
      sources: [],
      guardrail_notes: ['No official sources present in citations.'],
    });
  }

  const { text: answer, sources } = attachMarkers(text, official);
  const md = markdownFrom(answer, official, purpose, tone, query);
  if (download) {
    const html = `<html><body>${md.replace(/\n/g,'<br/>')}</body></html>`;
    const buf = await (htmlToDocx as any)(html);
    return new NextResponse(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
  }
  return NextResponse.json({ markdown: md, sources });
}
