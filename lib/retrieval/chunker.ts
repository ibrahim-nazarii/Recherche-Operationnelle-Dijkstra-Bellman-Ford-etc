import pdf from 'pdf-parse';
import { idOf } from '@/lib/retrieval/vector';

export async function pdfToChunks(buf: Buffer) {
  const chunks: {id:string, page:number, text:string}[] = [];
  const data = await (pdf as any)(buf, {
    pagerender: (pageData: any) => pageData.getTextContent({ normalizeWhitespace: true })
      .then((tc: any) => tc.items.map((it:any)=>('str' in it)?it.str:'').join(' '))
  });
  const pages = (data.text as string).split('\f');
  for (let i=0;i<pages.length;i++) {
    const pageText = pages[i].trim();
    const parts = splitSemantic(pageText, 800, 1200);
    for (const t of parts) chunks.push({ id: idOf(`${i+1}:${t}`), page: i+1, text: t });
  }
  return chunks;
}

function splitSemantic(text:string, min=600, max=1200){
  const s = text.split(/\n\s*\n|(?<=[\.!?])\s+/);
  const out:string[]=[]; let cur='';
  for (const piece of s) {
    if ((cur + ' ' + piece).length > max) { if (cur.length>=min) { out.push(cur); cur=piece; } else { cur += ' ' + piece; } }
    else cur += (cur? ' ':'') + piece;
  }
  if (cur) out.push(cur);
  return out.filter(Boolean);
}
