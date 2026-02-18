'use client';
import React, { useState } from 'react';

export default function ChatInput({ onSend, loading }: { onSend: (q: string)=>void, loading?: boolean }) {
  const [q, setQ] = useState('');
  return (
    <div className="flex gap-2">
      <textarea
        className="flex-1 rounded-xl border p-3 bg-white shadow-sm h-24"
        placeholder="Posez votre question (FR/EU/ECHR)…"
        value={q}
        onChange={e=>setQ(e.target.value)}
      />
      <button
        onClick={()=>{ if(q.trim()) onSend(q.trim()); }}
        disabled={loading}
        className="self-end rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
      >Envoyer</button>
    </div>
  );
}
