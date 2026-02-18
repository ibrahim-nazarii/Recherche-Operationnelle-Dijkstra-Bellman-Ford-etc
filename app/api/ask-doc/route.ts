import { NextRequest, NextResponse } from 'next/server';
import { embed } from '@/lib/llm/openai';
import { getSessionIndex } from '@/lib/utils';
import { topK } from '@/lib/retrieval/vector';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const idx = getSessionIndex();
  if (!idx || idx.chunks.length===0) return NextResponse.json({ error: 'no document uploaded' }, { status: 400 });
  const [qEmb] = await embed([query]);
  const ctx = topK(idx, qEmb, 8);
  const context = ctx.map(c=>`(p.${c.page}) ${c.text}`).join('\n\n');
  const prompt = `Contexte:\n\n${context}\n\nQuestion: ${query}\n\nConsignes: Réponds uniquement à partir du Contexte. Chaque phrase importante doit référencer (Uploaded Doc, p.X). Si insuffisant, dis-le.`;
  const comp = await openai.chat.completions.create({ model: 'gpt-4o-mini', temperature: 0.2, messages:[{role:'user', content: prompt}] });
  const answer = comp.choices?.[0]?.message?.content ?? '';
  const sources = ctx.map((c,i)=>({ id:String(i+1), url:'#', title:'Uploaded Document', pinpoint:`p.${c.page}`, quote:c.text.slice(0,160)+'…' }));
  return NextResponse.json({ answer, sources });
}
