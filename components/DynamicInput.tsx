'use client';

import React, { useState, useRef } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import type { Mode } from './ModeSelector';
import { AskModeExamples } from './AskModeExamples';

interface DynamicInputProps {
  mode: Mode;
  onSend: (text: string, subType?: string) => void;
  loading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  showExamples?: boolean;
}

type ModeConfig = {
  placeholder: string;
  pills: string[];
  examples?: string[];
  example?: string;
};

export function DynamicInput({
  mode,
  onSend,
  loading,
  value,
  onValueChange,
  showExamples,
}: DynamicInputProps) {
  const [input, setInput] = useState('');
  const [subType, setSubType] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Configuration per mode
  const config: Record<Mode, ModeConfig> = {
    ask: {
      placeholder: 'Posez votre question juridique...',
      pills: [],
    },
    draft: {
      placeholder: 'Décrivez le document à rédiger...',
      pills: ['Email', 'Lettre', 'Mémo juridique', 'Clause', 'Argument'],
      examples: [
        'Rédige un email au bailleur pour demander la restitution du dépôt de garantie, en citant l’article 22 de la loi du 6 juillet 1989.',
        'Prépare une clause de confidentialité (NDA) pour un contrat de prestation, durée 3 ans, avec pénalités en cas de violation.'
      ]
    },
    summarize: {
      placeholder: 'Entrez une citation (ex: Cass. com. 12 juin 2024...)',
      pills: [],
      example: 'Cass. com., 12 juin 2019, n° 17-15.623'
    },
    upload: {
      placeholder: 'Posez une question sur vos documents...',
      pills: ['Synthèse', 'Risques', 'Arguments'],
      example: 'Quels sont les risques identifiés dans ce contrat ?'
    }
  };

  const current = config[mode];
  const isControlled = typeof value === 'string' && typeof onValueChange === 'function';
  const inputValue = isControlled ? value : input;
  const setInputValue = isControlled ? onValueChange : setInput;
  const shouldShowExamples = showExamples !== false;

  const handleAskExampleSelect = (question: string) => {
    if (loading) {
      setInputValue(question);
      return;
    }
    onSend(question, subType);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSend(inputValue, subType);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      
      {/* Examples & Helper Text */}
      {mode === 'ask' && shouldShowExamples ? (
        <AskModeExamples onSelect={handleAskExampleSelect} />
      ) : (current.examples?.length || current.example) ? (
        <div className="text-text-muted text-sm pl-1 space-y-2">
          <span className="opacity-70">
            {(current.examples?.length ?? 0) > 1 ? 'Exemples :' : 'Exemple :'}
          </span>
          <div className="flex flex-col gap-1">
            {(current.examples ?? [current.example ?? ''])
              .filter(Boolean)
              .map((example) => (
                <button
                  key={example}
                  onClick={() => setInputValue(example)}
                  className="text-left hover:text-white hover:underline transition-colors"
                >
                  {example}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {/* Pills (if any) */}
      {current.pills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-text-muted mr-2">Inclus :</span>
          {current.pills.map((pill) => (
            <button
              key={pill}
              onClick={() => setSubType(pill)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors border
                ${subType === pill 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-text-muted border-white/20 hover:border-white/50 hover:text-white'}
              `}
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative bg-card rounded-xl border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={current.placeholder}
          className="w-full bg-transparent text-text-main placeholder-text-muted/50 p-4 min-h-[60px] max-h-[200px] resize-none focus:outline-none"
          rows={1}
          style={{ minHeight: '60px' }}
        />
        
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {mode === 'upload' && (
            <button className="p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/10">
              <Paperclip size={18} />
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            className={`
              p-2 rounded-lg transition-all
              ${!inputValue.trim() || loading
                ? 'bg-white/5 text-text-muted cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-purple-900/20'}
            `}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
