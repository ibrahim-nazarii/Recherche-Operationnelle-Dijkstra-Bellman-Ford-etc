'use client';
import React, { useState } from 'react';
import UploadDropzone from '@/components/UploadDropzone';
import ReactMarkdown from 'react-markdown';

export default function SummarizePage() {
  const [id, setId] = useState('ECLI:EU:C:2014:317');
  const [md, setMd] = useState('');
  const [busy, setBusy] = useState(false);

  async function runById() {
    setBusy(true);
    const r = await fetch('/api/summarize', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identifier: id }) });
    setBusy(false);
    const j = await r.json();
    setMd(j.markdown ?? j.error ?? '');
  }

  async function runByDoc() {
    setBusy(true);
    const r = await fetch('/api/summarize', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ useUploaded: true }) });
    setBusy(false);
    const j = await r.json();
    setMd(j.markdown ?? j.error ?? '');
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
          <div className="font-medium">Summarize by identifier</div>
          <input className="w-full border rounded p-2" value={id} onChange={e=>setId(e.target.value)} />
          <button onClick={runById} disabled={busy} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">Run</button>
        </div>
        <UploadDropzone />
        <button onClick={runByDoc} disabled={busy} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">Summarize uploaded</button>
      </div>
      <div className="md:col-span-2 rounded-xl border bg-white p-4 shadow-sm">
        <ReactMarkdown>{md}</ReactMarkdown>
      </div>
    </div>
  );
}
