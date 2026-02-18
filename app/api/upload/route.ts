import { NextRequest, NextResponse } from 'next/server';
import { pdfToChunks } from '@/lib/retrieval/chunker';
import { addToIndex, makeIndex } from '@/lib/retrieval/vector';
import { getSessionIndex, setSessionIndex } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const raw = await pdfToChunks(buf);
    const existing = getSessionIndex();
    const idx = existing ?? makeIndex();
    await addToIndex(idx, raw);
    setSessionIndex(idx);
    return NextResponse.json({ pages: Array.from(new Set(raw.map(r=>r.page))).length, chunks: raw.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'parse error' }, { status: 500 });
  }
}
