'use client';

import React from 'react';
import { X, ExternalLink, Globe, AlertTriangle } from 'lucide-react';
import type { Source } from './SourceCard';

interface DocumentPanelProps {
  source: Source | null;
  onClose: () => void;
}

export function DocumentPanel({ source, onClose }: DocumentPanelProps) {
  if (!source) return null;

  const host = (() => { try { return new URL(source.url).host.replace(/^www\./,''); } catch { return source.url; } })();
  
  // Some domains are known to block iframes. 
  // We can add a simple check, though it's not exhaustive.
  const isLikelyBlockable = source.url.includes('legifrance.gouv.fr') || source.url.includes('curia.europa.eu');

  return (
    <aside className="w-[450px] border-l border-white/5 bg-sidebar flex flex-col h-full shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-hidden">
          <Globe size={16} className="text-text-muted shrink-0" />
          <span className="text-sm font-medium truncate" title={source.title}>{source.title || host}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a 
            href={source.url} 
            target="_blank" 
            rel="noreferrer"
            className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={18} />
          </a>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white relative">
        {isLikelyBlockable ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-card">
            <AlertTriangle size={48} className="text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Impossible d'afficher l'aperçu</h3>
            <p className="text-sm text-text-muted mb-6">
              Ce site ({host}) empêche l'affichage dans une fenêtre intégrée pour des raisons de sécurité.
            </p>
            <a 
              href={source.url} 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Ouvrir le site officiel
            </a>
          </div>
        ) : (
          <iframe 
            src={source.url} 
            className="w-full h-full border-none" 
            title="Document Viewer"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>

      {/* Footer / Metadata */}
      <div className="p-4 border-t border-white/5 bg-card">
        <div className="space-y-2">
          {source.jurisdiction && (
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Juridiction</span>
              <span className="text-white">{source.jurisdiction}</span>
            </div>
          )}
          {source.date && (
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Date</span>
              <span className="text-white">{source.date}</span>
            </div>
          )}
          <div className="pt-2 mt-2 border-t border-white/5">
             <p className="text-xs text-text-muted italic">
               "{source.quote || 'Pas de citation extraite'}"
             </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
