'use client';
import React from 'react';

export type Source = {
  id: string;
  url: string;
  title?: string;
  jurisdiction?: string;
  date?: string;
  pinpoint?: string;
  quote?: string;
};

export default function SourceCard({ s, onClick }: { s: Source, onClick?: (s: Source) => void }) {
  const host = (() => { try { return new URL(s.url).host.replace(/^www\./,''); } catch { return s.url; } })();
  
  return (
    <div 
      onClick={() => onClick?.(s)}
      className={`
        rounded-xl border border-white/10 bg-card p-4 transition-colors group relative flex flex-col gap-1
        ${onClick ? 'cursor-pointer hover:bg-card-hover' : ''}
      `}
    >
      {/* Site Name */}
      <div className="font-bold text-sm text-text-main">
        [{s.id}] {host}
      </div>

      {/* Complete Link */}
      <div className="text-xs text-primary break-all font-mono">
        {s.url}
      </div>

      {/* Quote / n/a */}
      <div className="text-xs text-text-muted">
        {s.quote || "n/a"}
      </div>
    </div>
  );
}
