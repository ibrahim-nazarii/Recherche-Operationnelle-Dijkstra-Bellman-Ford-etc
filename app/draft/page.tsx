'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DraftPage() {
  const [query, setQuery] = useState('Résumé des critères de l’article 1240 C. civ. et jurisprudence utile.');
  const [purpose, setPurpose] = useState('memo');
  const [tone, setTone] = useState('neutre');
  const [md, setMd] = useState('');
  const [busy, setBusy] = useState(false);

  async function runDraft() {
    setBusy(true);
    const r = await fetch('/api/draft', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ purpose, tone, query }) });
    setBusy(false);
    if (!r.ok) { alert('Draft failed'); return; }
    const j = await r.json();
    setMd(j.markdown);
  }

  async function downloadDocx() {
    const r = await fetch('/api/draft', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ purpose, tone, query, download: true }) });
    if (!r.ok) { alert('Export failed'); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'draft.docx'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div className="font-medium">Drafting</div>
          <label className="text-sm">Purpose</label>
          <select className="w-full border rounded p-2" value={purpose} onChange={e=>setPurpose(e.target.value)}>
            <option value="memo">Mémo</option>
            <option value="letter">Lettre</option>
            <option value="email">Email</option>
            <option value="clause">Clause</option>
          </select>
          <label className="text-sm">Tone</label>
          <input className="w-full border rounded p-2" value={tone} onChange={e=>setTone(e.target.value)} />
          <label className="text-sm">Query</label>
          <textarea className="w-full border rounded p-2 h-32" value={query} onChange={e=>setQuery(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={runDraft} disabled={busy} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">Générer</button>
            <button onClick={downloadDocx} className="rounded-xl border px-4 py-2">Exporter .docx</button>
          </div>
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm markdown min-h-[400px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
