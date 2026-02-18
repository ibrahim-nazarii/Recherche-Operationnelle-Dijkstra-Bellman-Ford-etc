'use client';

import React, { useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { ModeSelector, type Mode } from '@/components/ModeSelector';
import { DynamicInput } from '@/components/DynamicInput';
import { AskModeExamples } from '@/components/AskModeExamples';
import SourceCard, { type Source } from '@/components/SourceCard';
import { DocumentPanel } from '@/components/DocumentPanel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Scale, FileText, ExternalLink } from 'lucide-react';

const MarkdownComponents = {
  h1: ({node, ...props}: any) => (
    <h1 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2" {...props} />
  ),
  h2: ({node, ...props}: any) => (
    <h2 className="text-xl font-semibold text-white mt-8 mb-4 flex items-center gap-2 border-b border-white/10 pb-2" {...props} />
  ),
  h3: ({node, ...props}: any) => (
    <h3 className="text-lg font-medium text-white/90 mt-6 mb-3" {...props} />
  ),
  a: ({node, ...props}: any) => (
    <a className="text-primary hover:text-primary-hover underline underline-offset-4 decoration-primary/30 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  blockquote: ({node, ...props}: any) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 my-4 italic text-text-muted bg-white/5 py-2 rounded-r-lg" {...props} />
  ),
  ul: ({node, ...props}: any) => (
    <ul className="list-disc list-outside ml-6 space-y-2 my-4 text-text-main/90" {...props} />
  ),
  ol: ({node, ...props}: any) => (
    <ol className="list-decimal list-outside ml-6 space-y-2 my-4 text-text-main/90" {...props} />
  ),
  code: ({node, inline, className, children, ...props}: any) => {
    return inline ? (
      <code className="bg-white/10 text-primary px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-card border border-white/10 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono text-text-main">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
};

export default function Page() {
  const [mode, setMode] = useState<Mode>('ask');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{role: 'user'|'assistant', content: string, sources?: Source[]}[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [draftInput, setDraftInput] = useState('');
  const [showAskExamples, setShowAskExamples] = useState(false);

  const handleAskExampleSelect = (question: string) => {
    if (loading) {
      setDraftInput(question);
      return;
    }
    handleSend(question);
  };

  // Function to handle the API calls based on Mode
  async function handleSend(input: string, subType?: string) {
    if (mode === 'ask') {
      setShowAskExamples(false);
    }
    setDraftInput('');
    setLoading(true);
    
    // Add user message immediately
    setConversation(prev => [...prev, { role: 'user', content: input }]);

    try {
      // Determine endpoint based on mode
      let endpoint = '/api/ask';
      let body: any = { query: input };

      if (mode === 'draft') {
        endpoint = '/api/draft';
        const purpose = subType?.trim() || 'Mémo juridique';
        body = { query: input, purpose, tone: 'neutre' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Désolé, une erreur est survenue.");
      }
      
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer || data.markdown || data.summary || "Désolé, une erreur est survenue.",
        sources: data.sources || [] 
      }]);

    } catch (e) {
      console.error(e);
      setConversation(prev => [...prev, { role: 'assistant', content: "Erreur de connexion." }]);
    } finally {
      setLoading(false);
    }
  }

  // If conversation is empty, show the "New Tab" experience
  // If conversation has started, show the chat view (simplified for now)
  const isChatStarted = conversation.length > 0;

  return (
    <main className="flex h-full bg-background overflow-hidden">
      
      {/* Center Column: Main Chat Interface */}
      <div className="flex-1 flex flex-col relative min-w-0 transition-all">
        <TopNav />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          <div className="max-w-4xl mx-auto w-full pt-12">
            
            {!isChatStarted ? (
              /* Empty State: Mode Selection */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-12">
                  <h1 className="text-3xl font-medium text-white">Bonjour.</h1>
                  <p className="text-text-muted">Comment puis-je vous assister aujourd'hui ?</p>
                </div>
                
                <ModeSelector currentMode={mode} onSelect={setMode} />
                
                <div className="pt-4">
                  <DynamicInput
                    mode={mode}
                    onSend={handleSend}
                    loading={loading}
                    value={draftInput}
                    onValueChange={setDraftInput}
                  />
                </div>
              </div>
            ) : (
              /* Active Chat View */
              <div className="space-y-8 pb-10">
                {conversation.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-4 ${msg.role === 'user' ? 'bg-primary/20 p-4 rounded-2xl text-white' : ''}`}>
                      {msg.role === 'assistant' ? (
                        <>
                          <div className="prose prose-invert max-w-none text-text-main">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={MarkdownComponents}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-white/10">
                              <h4 className="text-xs font-semibold text-text-muted uppercase">Sources Citées</h4>
                              {msg.sources.map(s => (
                                <SourceCard 
                                  key={s.id} 
                                  s={s} 
                                  onClick={(source) => setSelectedSource(source)} 
                                />
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                     <div className="bg-card p-4 rounded-xl animate-pulse text-text-muted">
                        Analyse en cours...
                     </div>
                  </div>
                )}
                {mode === 'ask' && (
                  <div className="pt-2 space-y-3">
                    <button
                      onClick={() => setShowAskExamples((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-text-main transition-all hover:border-white/20 hover:bg-card hover:text-white"
                      aria-expanded={showAskExamples}
                    >
                      {showAskExamples
                        ? 'Masquer les questions exemples'
                        : 'Afficher les questions exemples'}
                    </button>
                    {showAskExamples && (
                      <AskModeExamples
                        onSelect={handleAskExampleSelect}
                        showIntro={false}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating Input for Active Chat (Sticky Bottom) */}
        {isChatStarted && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-6 pt-20">
              <div className="max-w-4xl mx-auto">
                 <DynamicInput
                   mode={mode}
                   onSend={handleSend}
                   loading={loading}
                   value={draftInput}
                   onValueChange={setDraftInput}
                   showExamples={false}
                 />
              </div>
          </div>
        )}
      </div>

      {/* Right Column: Document Panel */}
      {selectedSource && (
        <DocumentPanel 
          source={selectedSource} 
          onClose={() => setSelectedSource(null)} 
        />
      )}

    </main>
  );
}
