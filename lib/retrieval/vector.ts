import crypto from 'crypto';
import type { Chunk, SessionIndex } from '@/lib/types';
import { embed as embedAPI } from '@/lib/llm/openai';

export function cosine(a:number[], b:number[]) {
  let dot=0, na=0, nb=0;
  for (let i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-9);
}

export function makeIndex(): SessionIndex { return { chunks: [], dim: 3072 }; }

export async function addToIndex(idx: SessionIndex, rawChunks: Omit<Chunk,'embedding'>[]) {
  const embs = await embedAPI(rawChunks.map(c=>c.text));
  rawChunks.forEach((c, i) => idx.chunks.push({ ...c, embedding: embs[i] }));
}

export function topK(idx: SessionIndex, queryEmb: number[], k=6): Chunk[] {
  return [...idx.chunks]
    .map(c=>({ c, score: cosine(queryEmb, c.embedding!) }))
    .sort((a,b)=>b.score-a.score)
    .slice(0, k)
    .map(({c})=>c);
}

export function idOf(text:string){ return crypto.createHash('sha1').update(text).digest('hex'); }
