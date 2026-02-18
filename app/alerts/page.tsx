'use client';
import React, { useState } from 'react';

type Hit = { title?: string; url: string; date?: string };

export default function AlertsPage() {
  const [query, setQuery] = useState('RGPD');
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);

  async function fetchNow() {
    setBusy(true);
    const r = await fetch('/api/alerts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ topics: [query] }) });
    setBusy(false);
    const j = await r.json();
    setHits(j.hits ?? []);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-white p-4 shadow-sm flex gap-2">
        <input className="flex-1 border rounded p-2" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Mot-clé…" />
        <button onClick={fetchNow} disabled={busy} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">Fetch now</button>
      </div>
      <div className="grid gap-3">
        {hits.map((h,i)=> (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="font-medium mb-1">{h.title ?? h.url}</div>
            <a className="text-blue-600 hover:underline break-all" href={h.url} target="_blank" rel="noreferrer">{h.url}</a>
            {h.date && <div className="text-xs text-gray-600 mt-1">{h.date}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
