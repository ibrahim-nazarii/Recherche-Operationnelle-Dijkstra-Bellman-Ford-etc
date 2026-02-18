'use client';

import React from 'react';
import { MessageCircle, FileEdit, FileText, Upload } from 'lucide-react';

export type Mode = 'ask' | 'draft' | 'summarize' | 'upload';

interface ModeSelectorProps {
  currentMode: Mode;
  onSelect: (mode: Mode) => void;
}

export function ModeSelector({ currentMode, onSelect }: ModeSelectorProps) {
  const modes = [
    { 
      id: 'ask', 
      label: 'Poser une question', 
      icon: MessageCircle,
      desc: 'Questions juridiques générales' 
    },
    { 
      id: 'draft', 
      label: 'Rédiger un texte', 
      icon: FileEdit,
      desc: 'Mémos, lettres, clauses' 
    },
    { 
      id: 'summarize', 
      label: 'Résumer une décision', 
      icon: FileText,
      desc: 'Par citation ou fichier' 
    },
    { 
      id: 'upload', 
      label: 'Importer pour...', 
      icon: Upload,
      desc: 'Analyser vos documents' 
    },
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto w-full mb-8">
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`
              relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left h-24
              ${isActive 
                ? 'bg-primary border-primary text-white ring-2 ring-primary/50' 
                : 'bg-card border-white/5 text-text-muted hover:bg-card-hover hover:border-white/10'}
            `}
          >
            <div className="flex items-center gap-2 mb-1">
              <mode.icon size={20} className={isActive ? 'text-white' : 'text-text-muted'} />
              <span className={`font-semibold ${isActive ? 'text-white' : 'text-text-main'}`}>
                {mode.label}
              </span>
            </div>
            {/* Optional description line could go here if design permits */}
          </button>
        );
      })}
    </div>
  );
}
