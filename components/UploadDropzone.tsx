'use client';
import React, { useState } from 'react';

export default function UploadDropzone() {
  const [info, setInfo] = useState<string>('');
  const [busy, setBusy] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    setBusy(true);
    setInfo('');
    const r = await fetch('/api/upload', { method:'POST', body: fd });
    setBusy(false);
    if (!r.ok) { setInfo('Upload failed.'); return; }
    const j = await r.json();
    setInfo(`Parsed ${j.pages} pages, ${j.chunks} chunks.`);
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="font-medium mb-2">Uploaded document (session)</div>
      <input type="file" accept="application/pdf" onChange={onFileChange} disabled={busy} />
      <div className="text-sm text-gray-600 mt-2">{busy ? 'Parsing…' : info}</div>
      <div className="text-xs text-amber-700 mt-1">Les réponses seront limitées au document; aucune vérification externe.</div>
    </div>
  );
}
