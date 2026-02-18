'use client';

import React from 'react';
import { Plus, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-white/5 fixed left-0 top-0 z-50">
      {/* New Conversation Button */}
      <div className="p-4">
        <button 
          onClick={() => window.location.reload()} 
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Plus size={18} />
          Nouvelle conversation
        </button>
      </div>

      {/* Recent Conversations List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Conversations récentes</h3>
          <button className="text-xs text-text-muted hover:text-white">Tout effacer</button>
        </div>
        
        <div className="space-y-1">
          {[
            "Quelles sont les exclusions autorisées...",
            "Affaires concernant les propriétaires...",
            "Quelle est la procédure pour changer...",
            "Existe-t-il un traité ou un article...",
            "Trouvez-moi une affaire de morsure de chien"
          ].map((title, i) => (
            <button key={i} className="w-full text-left text-sm text-text-muted hover:text-white hover:bg-white/5 py-2 px-2 rounded truncate transition-colors">
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <Link href="#" className="flex items-center gap-2 text-sm text-text-muted hover:text-white px-2 py-1">
          <MessageSquare size={16} />
          <span>Voir la FAQ</span>
        </Link>
        <Link href="#" className="flex items-center gap-2 text-sm text-text-muted hover:text-white px-2 py-1">
          <ExternalLink size={16} />
          <span>Envoyer un commentaire</span>
        </Link>
      </div>
    </aside>
  );
}
